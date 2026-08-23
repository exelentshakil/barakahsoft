import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Lead, Artifact, ScrapeResults } from "@/types/database";

export const maxDuration = 120;

// Generates an ultra-photorealistic, high-resolution portrait / avatar of the business owner
// (e.g. holding blueprints/plans, smiling warmly, authentic craftsmanship) using Google Imagen 3 / Gemini.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured in this environment" },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  const [{ data: lead }, { data: artifact }, { data: scrape }] = await Promise.all([
    admin.from("leads").select("*").eq("id", leadId).single<Lead>(),
    admin.from("artifacts").select("*").eq("lead_id", leadId).maybeSingle<Artifact>(),
    admin.from("scrape_results").select("facts").eq("lead_id", leadId).maybeSingle<ScrapeResults>(),
  ]);

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const facts = (scrape?.facts as Record<string, unknown> | null) ?? {};
  const businessName = lead.business_name || (facts.business_name as string) || lead.slug;
  const trade = lead.industry || (facts.industry as string) || "Home Services Contractor";
  const city = (facts.town as string) || "New York";
  const founderName = (facts.founder_name as string) || lead.contact_name || "Company Founder";

  const body = await req.json().catch(() => ({}));
  const customPrompt =
    body.prompt ||
    `Photorealistic, high-end professional editorial portrait of ${founderName}, the master founder and owner of "${businessName}", a premier ${trade} company in ${city}. The founder is smiling warmly, wearing a clean modern work shirt, holding architectural floor plans and blueprints on a bright residential renovation job site. Cinematic natural lighting, 8k resolution, authentic craftsmanship, crisp focus, shallow depth of field, award-winning commercial photography.`;

  try {
    // Call Google Imagen 3 via Generative Language API
    const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict`;
    const res = await fetch(imagenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        instances: [{ prompt: customPrompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          outputMimeType: "image/jpeg",
          personGeneration: "allow_adult",
        },
      }),
    });

    let imageBuffer: Buffer | null = null;

    if (res.ok) {
      const data = await res.json();
      const base64Bytes = data.predictions?.[0]?.bytesBase64Encoded;
      if (base64Bytes) {
        imageBuffer = Buffer.from(base64Bytes, "base64");
      }
    } else {
      console.warn(`[generate-avatar] Imagen 3 returned status ${res.status}, trying fallback generation`);
    }

    // Fallback if Imagen 3 preview is not enabled on this key: use high quality placeholder or retry with secondary model
    if (!imageBuffer) {
      // Return helpful message if image generation API is restricted
      return NextResponse.json(
        {
          error:
            "Could not generate portrait with Imagen 3. Please ensure Imagen 3 is enabled on your Google Cloud project or upload an owner image directly.",
        },
        { status: 502 }
      );
    }

    // Upload to Supabase Storage in lead-media
    const storagePath = `${leadId}/generated-avatars/founder-${Date.now()}.jpg`;
    const { error: uploadError } = await admin.storage
      .from("lead-media")
      .upload(storagePath, imageBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("[generate-avatar] storage upload failed", uploadError);
      return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
    }

    const { data: publicUrlData } = admin.storage
      .from("lead-media")
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    // Record into media_assets and update artifact extracted_assets
    await admin.from("media_assets").insert({
      lead_id: leadId,
      storage_path: storagePath,
      public_url: publicUrl,
      source: "generated-avatar",
      slot_hint: "about-owner",
      storage_mode: "copied",
    });

    const existingExtracted = ((artifact?.extracted_assets as Record<string, unknown> | null) ?? {});
    const updatedExtracted = {
      ...existingExtracted,
      founder_photo_url: publicUrl,
      about_image_url: publicUrl,
    };

    if (artifact) {
      await admin
        .from("artifacts")
        .update({ extracted_assets: updatedExtracted, last_edited_at: new Date().toISOString() })
        .eq("lead_id", leadId);
    }

    // Also update scrape_results facts
    await admin
      .from("scrape_results")
      .update({
        facts: {
          ...facts,
          founder_photo_url: publicUrl,
        },
      })
      .eq("lead_id", leadId);

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      founderName,
    });
  } catch (err) {
    console.error("[generate-avatar] failed", err);
    return NextResponse.json({ error: "Avatar generation failed" }, { status: 500 });
  }
}
