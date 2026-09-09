import { requireOperator } from "@/lib/tenant-scope";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Single upload endpoint for anything an operator manually attaches to a
// lead during QA/prompt-editing. Scraped/Unsplash/Pexels assets go through
// the photo-waterfall's own copy_to_storage path instead — this route is
// only for the "upload" media_assets.source case.
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

export async function POST(req: Request) {
  // Being signed in is not being an operator: any Supabase user can
  // complete a magic link. This route then uses the service-role client.
  if (!(await requireOperator())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  const leadId = formData?.get("lead_id") as string | null;
  // The Studio sends "slot"; the reference-image and asset pickers send
  // "slot_hint". Only the second was read, so every logo, hero and footer
  // upload from the Studio landed in media_assets with a null slot and no
  // record of what it was uploaded to be.
  const slotHint = (formData?.get("slot_hint") as string) || (formData?.get("slot") as string) || null;
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!leadId) return NextResponse.json({ error: "lead_id is required" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Unsupported file type — use PNG, JPEG, WebP, GIF, or SVG" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File is too large — 8MB max" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${leadId}/upload/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from("lead-media")
    .upload(path, buffer, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

  const { data } = admin.storage.from("lead-media").getPublicUrl(path);

  const { data: mediaAsset, error: insertError } = await admin
    .from("media_assets")
    .insert({
      lead_id: leadId,
      storage_path: path,
      public_url: data.publicUrl,
      source: "upload",
      slot_hint: slotHint,
    })
    .select()
    .single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

  return NextResponse.json({ url: data.publicUrl, media_asset: mediaAsset });
}
