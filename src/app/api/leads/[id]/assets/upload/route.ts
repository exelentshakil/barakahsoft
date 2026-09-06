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
  // Per-file reasons. "No images could be processed" told the operator
  // nothing: an iPhone HEIC, a 200px thumbnail and a storage permission error
  // all produced the same sentence, and only one of them is their fault.
  const skipped: { name: string; reason: string }[] = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;

    // sharp is built without libheif here, so a HEIC throws deep inside and
    // surfaces as an unexplained null. iPhone photos are the single most
    // likely thing to be dragged into this box, so say so plainly.
    const isHeic = /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
    if (isHeic) {
      skipped.push({
        name: file.name,
        reason: "HEIC is not supported. On a Mac, open it in Preview and export as JPEG; on an iPhone, set Camera > Formats to Most Compatible.",
      });
      continue;
    }

    if (file.size > 25 * 1024 * 1024) {
      skipped.push({ name: file.name, reason: `${(file.size / 1024 / 1024).toFixed(1)}MB is over the 25MB limit.` });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Not a real URL — storagePath only uses it to build a readable filename.
    const result = await mirrorToStorage(leadId, `manual-${Date.now()}-${file.name}`, "upload", { buffer });

    if (result) {
      uploaded.push(result);
    } else {
      skipped.push({
        name: file.name,
        reason: "Could not be read as an image, or its shortest edge is under 200px.",
      });
    }
  }

  if (uploaded.length === 0) {
    return NextResponse.json(
      {
        error:
          skipped.length > 0
            ? skipped.map((item) => `${item.name}: ${item.reason}`).join(" ")
            : "No image files were received.",
        skipped,
      },
      { status: 400 }
    );
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
    skipped,
  });
}
