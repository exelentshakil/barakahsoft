import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { mirrorToStorage, describeImages, saveDescriptions } from "@/lib/media/ingest";

export const maxDuration = 120;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Use multipart/form-data" }, { status: 400 });
  }

  const form = await req.formData();
  const files = form.getAll("file");
  
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const admin = createAdminClient();

  // facts lives on scrape_results, not on leads. Selecting it here made the
  // whole query error, and the null result was reported as "Lead not found" —
  // so uploading a client's own photographs failed with a message that pointed
  // at the wrong thing entirely.
  const [{ data: lead, error: leadError }, { data: scrape }] = await Promise.all([
    admin.from("leads").select("id, industry").eq("id", leadId).single(),
    admin.from("scrape_results").select("id, facts").eq("lead_id", leadId).maybeSingle(),
  ]);
  if (leadError || !lead) {
    return NextResponse.json({ error: leadError?.message ?? "Lead not found" }, { status: 404 });
  }

  const uploaded = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Pass fake URL so storagePath handles it nicely, using origin 'upload'
    const result = await mirrorToStorage(leadId, `manual-${Date.now()}-${file.name}`, "upload", {
      buffer,
    });
    
    if (result) uploaded.push(result);
  }
  
  if (uploaded.length === 0) {
    return NextResponse.json({ error: "No images could be processed. Check format and size." }, { status: 400 });
  }

  // Use vision to describe them so the generator uses them intelligently
  const verdicts = await describeImages(
    uploaded.map((u) => ({ id: u.id, url: u.publicUrl })),
    lead.industry || "local services"
  );
  await saveDescriptions(verdicts);

  // Added to scrape_results.facts.site_photos, which is where buildSiteBrief
  // reads real photography from.
  const currentFacts = (scrape?.facts as Record<string, unknown> | null) ?? {};
  const sitePhotos = Array.isArray(currentFacts.site_photos) ? currentFacts.site_photos : [];
  
  const newPhotos = uploaded.filter(u => {
    const verdict = verdicts.get(u.id);
    return !verdict || verdict.usable !== false;
  }).map(u => ({
    url: u.publicUrl,
    caption: verdicts.get(u.id)?.caption || "Client uploaded photo"
  }));

  if (newPhotos.length > 0) {
    const updatedFacts = {
      ...currentFacts,
      site_photos: [...sitePhotos, ...newPhotos]
    };

    if (scrape?.id) {
      await admin.from("scrape_results").update({ facts: updatedFacts }).eq("id", scrape.id);
    } else {
      await admin.from("scrape_results").insert({ lead_id: leadId, facts: updatedFacts });
    }
  }

  return NextResponse.json({
    ok: true,
    uploaded: uploaded.length,
    usable: newPhotos.length,
    photos: newPhotos,
  });
}
