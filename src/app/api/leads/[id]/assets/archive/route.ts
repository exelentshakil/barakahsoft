import { assertLeadInTenant } from "@/lib/tenant-scope";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FunnelPageSection } from "@/types/database";

// Automated asset migration: downloads all remote hotlinks (scraped from old site or CDN),
// optimizes them to clean WebP/JPEG using Sharp, uploads them to permanent Supabase Storage (lead-media),
// and updates the artifact references so the standalone export has zero broken image dependencies.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;

  const supabase = await createClient();
  // Authenticates and proves the lead belongs to this operator's brand in
  // one call. 404 rather than 403: a 403 confirms the lead exists.
  if (!(await assertLeadInTenant(leadId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: artifact } = await admin
    .from("artifacts")
    .select("id, funnel_pages, extracted_assets")
    .eq("lead_id", leadId)
    .single();

  if (!artifact) return NextResponse.json({ error: "Artifact not found" }, { status: 404 });

  const sections = (artifact.funnel_pages as FunnelPageSection[]) || [];
  let migratedCount = 0;

  try {
    const updatedSections = await Promise.all(
      sections.map(async (sec) => {
        const updated = { ...sec };
        const imageUrl = sec.variant_props?.image_url as string | undefined;

        if (imageUrl && imageUrl.startsWith("http") && !imageUrl.includes("supabase.co")) {
          try {
            const res = await fetch(imageUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
            if (res.ok) {
              const rawBuffer = Buffer.from(await res.arrayBuffer());
              const optimized = await sharp(rawBuffer)
                .resize({ width: 1200, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

              const filename = `${leadId}/permanent/${sec.slug}-${Date.now()}.webp`;
              const { error: uploadErr } = await admin.storage
                .from("lead-media")
                .upload(filename, optimized, {
                  contentType: "image/webp",
                  upsert: true,
                });

              if (!uploadErr) {
                const { data } = admin.storage.from("lead-media").getPublicUrl(filename);
                updated.variant_props = {
                  ...(updated.variant_props || {}),
                  image_url: data.publicUrl,
                  original_hotlink: imageUrl,
                };
                migratedCount++;
              }
            }
          } catch (fetchErr) {
            console.error(`[asset-archive] failed to migrate ${imageUrl}`, fetchErr);
          }
        }
        return updated;
      })
    );

    await admin
      .from("artifacts")
      .update({
        funnel_pages: updatedSections,
        last_edited_at: new Date().toISOString(),
      })
      .eq("lead_id", leadId);

    return NextResponse.json({
      ok: true,
      migratedCount,
      totalSections: updatedSections.length,
    });
  } catch (err) {
    console.error("[asset-archive] unhandled error", err);
    return NextResponse.json({ error: "Asset migration failed" }, { status: 500 });
  }
}
