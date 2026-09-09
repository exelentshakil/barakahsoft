import { assertLeadInTenant } from "@/lib/tenant-scope";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Lead, Artifact, ScrapeResults } from "@/types/database";

export const maxDuration = 120;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  // Authenticates and proves the lead belongs to this operator's brand in
  // one call. 404 rather than 403: a 403 confirms the lead exists.
  if (!(await assertLeadInTenant(leadId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });

  const admin = createAdminClient();
  const [{ data: lead }, { data: artifact }, { data: scrape }] = await Promise.all([
    admin.from("leads").select("*").eq("id", leadId).single<Lead>(),
    admin.from("artifacts").select("*").eq("lead_id", leadId).maybeSingle<Artifact>(),
    admin.from("scrape_results").select("facts").eq("lead_id", leadId).maybeSingle<ScrapeResults>(),
  ]);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const facts = (scrape?.facts as Record<string, unknown> | null) ?? {};
  const businessName = lead.business_name || (facts.business_name as string) || lead.slug;
  const trade = lead.industry || (facts.industry as string) || "home services";
  const city = (facts.town as string) || (facts.city as string) || "their local area";
  const founderName = (facts.founder_name as string) || lead.contact_name || "the company owner";
  const body = await req.json().catch(() => ({}));
  const customPrompt = body.prompt ||
    `Photorealistic professional editorial portrait representing ${founderName} of ${businessName}, a ${trade} business serving ${city}. On-site, natural expression, clean work clothing, authentic trade context, natural directional light, crisp commercial photography, no text, no logos.`;

  try {
    let imageBuffer: Buffer | null = null;
    for (const model of ["imagen-3.0-generate-002", "imagen-3.0-fast-generate-001", "imagegeneration@006"]) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            instances: [{ prompt: customPrompt }],
            parameters: { sampleCount: 1, aspectRatio: "1:1", outputMimeType: "image/jpeg", personGeneration: "allow_adult" },
          }),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const encoded = data.predictions?.[0]?.bytesBase64Encoded;
        if (encoded) {
          imageBuffer = Buffer.from(encoded, "base64");
          break;
        }
      } catch (error) {
        console.warn(`[generate-avatar] ${model} failed`, error);
      }
    }

    if (!imageBuffer && process.env.OPENAI_API_KEY) {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: "dall-e-3", prompt: customPrompt, size: "1024x1024", quality: "hd", n: 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        const imageUrl = data.data?.[0]?.url;
        if (imageUrl) {
          const download = await fetch(imageUrl);
          if (download.ok) imageBuffer = Buffer.from(await download.arrayBuffer());
        }
      }
    }

    if (!imageBuffer) return NextResponse.json({ error: "Could not generate portrait" }, { status: 502 });

    const storagePath = `${leadId}/generated-avatars/founder-${Date.now()}.jpg`;
    const { error: uploadError } = await admin.storage
      .from("lead-media")
      .upload(storagePath, imageBuffer, { contentType: "image/jpeg", upsert: false });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = admin.storage.from("lead-media").getPublicUrl(storagePath);
    const publicUrl = publicUrlData.publicUrl;
    const { error: mediaError } = await admin.from("media_assets").insert({
      lead_id: leadId,
      storage_path: storagePath,
      public_url: publicUrl,
      source: "generated",
      slot_hint: "about-owner",
      storage_mode: "copied",
      generation_prompt: customPrompt,
    });
    if (mediaError) throw mediaError;

    if (artifact) {
      const existing = (artifact.extracted_assets as Record<string, unknown> | null) ?? {};
      const { error } = await admin
        .from("artifacts")
        .update({
          extracted_assets: { ...existing, founder_photo_url: publicUrl, about_image_url: publicUrl },
          last_edited_at: new Date().toISOString(),
        })
        .eq("lead_id", leadId);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true, url: publicUrl, founderName });
  } catch (error) {
    console.error("[generate-avatar] failed", error);
    return NextResponse.json({ error: "Avatar generation failed" }, { status: 500 });
  }
}
