import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { repointSlot } from "@/lib/media/slots";
import type { MediaPlan } from "@/lib/media/plan-media";

// Professional photo retouching pipeline for real client job photos.
//
// Unlike AI generation (which creates a completely different artificial scene),
// this preserves 100% of the client's genuine work photo, crew, building and
// composition, while applying high-end commercial grading:
// - CLAHE (Contrast-Limited Adaptive Histogram Equalization) to reveal hidden textures
// - Smart unsharp masking for crisp tool, material, and architectural lines
// - Vibrancy & color modulation to remove dull/washed-out phone camera haze
// - Controlled gamma correction for rich shadows and balanced highlights
export async function retouchPhotoBuffer(rawBuffer: Buffer): Promise<Buffer> {
  const meta = await sharp(rawBuffer).metadata();
  const width = meta.width || 1800;

  return await sharp(rawBuffer)
    .resize({ width: Math.min(width, 2400), withoutEnlargement: true })
    .clahe({ width: 80, height: 80, maxSlope: 2.2 })
    .modulate({
      brightness: 1.03,
      saturation: 1.16,
    })
    .gamma(1.03)
    .sharpen({
      sigma: 1.15,
      m1: 1.35,
      m2: 0.5,
    })
    .webp({ quality: 90, effort: 6 })
    .toBuffer();
}

/**
 * Retouches the real photo currently in a slot and updates all pages referencing it.
 */
export async function retouchSlotPhoto(
  leadId: string,
  slotKey: string
): Promise<{ url: string; pagesUpdated: string[] } | null> {
  const admin = createAdminClient();
  const { data: artifact } = await admin
    .from("artifacts")
    .select("media_plan")
    .eq("lead_id", leadId)
    .single<{ media_plan: MediaPlan | null }>();

  const entry = artifact?.media_plan?.find((e) => e.slot === slotKey);
  if (!entry || !entry.url) return null;

  try {
    const res = await fetch(entry.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BarakahSoft/1.0)" },
    });
    if (!res.ok) return null;

    const rawBuffer = Buffer.from(await res.arrayBuffer());
    const retouchedBuffer = await retouchPhotoBuffer(rawBuffer);

    const storagePath = `${leadId}/retouched/${slotKey}-${Date.now()}.webp`;
    const { error: uploadError } = await admin.storage
      .from("lead-media")
      .upload(storagePath, retouchedBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("[retouch] upload failed", uploadError);
      return null;
    }

    const { data: publicUrlData } = admin.storage
      .from("lead-media")
      .getPublicUrl(storagePath);

    const newUrl = publicUrlData.publicUrl;

    await admin.from("media_assets").insert({
      lead_id: leadId,
      storage_path: storagePath,
      public_url: newUrl,
      source: "retouched-photo",
      slot_hint: slotKey,
      storage_mode: "copied",
    });

    const pagesUpdated = await repointSlot(
      leadId,
      entry.url,
      newUrl,
      `AI Retouched real photo in ${slotKey} (commercial grade)`
    );

    return { url: newUrl, pagesUpdated };
  } catch (err) {
    console.error(`[retouch] failed for slot ${slotKey}`, err);
    return null;
  }
}
