import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";

// Remove one photograph from a lead's library.
//
// Uploading was possible and removing was not, which meant a bad photo — a
// blurry shot, a competitor's watermark, a picture the client asked us to drop
// — stayed in the pool and reappeared on every rebuild.
//
// The image is dropped from the fact digest (so it stops being offered to a
// build), marked unusable in media_assets (so the planner will not pick it),
// and pulled out of any stored media plan (so the section it filled gets
// re-planned). The stored file itself is left alone: a URL still referenced by
// an already-delivered page must not start 404ing.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url) return NextResponse.json({ error: "A photo url is required" }, { status: 400 });

  const admin = createAdminClient();
  const [{ data: scrape }, { data: artifact }] = await Promise.all([
    admin.from("scrape_results").select("id, facts").eq("lead_id", leadId).maybeSingle(),
    admin.from("artifacts").select("id, media_plan").eq("lead_id", leadId).maybeSingle(),
  ]);

  if (scrape?.id) {
    const facts = (scrape.facts as Record<string, unknown> | null) ?? {};
    const sitePhotos = Array.isArray(facts.site_photos) ? (facts.site_photos as { url?: string }[]) : [];
    const gbpPhotos = Array.isArray(facts.gbp_photo_urls) ? (facts.gbp_photo_urls as string[]) : [];
    await admin
      .from("scrape_results")
      .update({
        facts: {
          ...facts,
          site_photos: sitePhotos.filter((photo) => photo?.url !== url),
          gbp_photo_urls: gbpPhotos.filter((photo) => photo !== url),
        },
      })
      .eq("id", scrape.id);
  }

  await admin.from("media_assets").update({ usable: false }).eq("lead_id", leadId).eq("public_url", url);

  if (artifact?.id && Array.isArray(artifact.media_plan)) {
    const plan = (artifact.media_plan as { url?: string }[]).filter((item) => item?.url !== url);
    await admin.from("artifacts").update({ media_plan: plan }).eq("id", artifact.id);
  }

  return NextResponse.json({ ok: true });
}
