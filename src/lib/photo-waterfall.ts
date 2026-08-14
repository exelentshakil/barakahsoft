import { createAdminClient } from "@/lib/supabase/admin";
import { searchUnsplash } from "@/lib/unsplash";
import { searchPexels } from "@/lib/pexels";
import type { Playbook } from "@/lib/playbooks";
import type { MediaAssetSource } from "@/types/database";

// copy_to_storage atom — downloads a source URL and re-uploads into this
// lead's Storage folder. Every image on a generated site must live here;
// nothing is ever hotlinked (plan §7).
async function copyToStorage(sourceUrl: string, leadId: string, source: MediaAssetSource, slotHint: string): Promise<string | null> {
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    // "image/svg+xml" -> "svg", not the literal "svg+xml" suffix.
    const ext = contentType.split("/")[1]?.split(";")[0]?.split("+")[0] || "jpg";
    const buffer = Buffer.from(await res.arrayBuffer());

    const path = `${leadId}/${source}/${slotHint}-${Date.now()}.${ext}`;
    const admin = createAdminClient();
    const { error } = await admin.storage.from("lead-media").upload(path, buffer, { contentType, upsert: false });
    if (error) throw error;

    const { data } = admin.storage.from("lead-media").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("[photo-waterfall] copy_to_storage failed for", sourceUrl, err);
    return null;
  }
}

interface RequiredSlot {
  slotHint: string;
  playbookQueryKey: keyof Playbook["photo_queries"] | string;
}

// PhotoWaterfall molecule — for each required slot: prefer the business's
// own ranked site/GBP photos; if none is left for that slot, fall through
// to Unsplash then Pexels using the playbook's vertical-specific query
// (never generic stock). Every result gets copied into Storage and written
// as a media_assets row with the correct source tag + attribution.
export async function runPhotoWaterfall(
  leadId: string,
  facts: { site_photos?: { url: string; alt: string | null; qualityScore: number }[]; gbp_photo_urls?: string[] },
  playbook: Playbook,
  requiredSlots: RequiredSlot[]
) {
  const admin = createAdminClient();
  const sitePhotos = [...(facts.site_photos ?? [])].sort((a, b) => b.qualityScore - a.qualityScore);
  const gbpPhotos = [...(facts.gbp_photo_urls ?? [])];

  for (const slot of requiredSlots) {
    let sourceUrl: string | null = null;
    let source: MediaAssetSource = "site";
    let attributionName: string | null = null;
    let attributionUrl: string | null = null;

    // 1. Theirs first — site photos, ranked, then GBP photos.
    const nextSitePhoto = sitePhotos.shift();
    if (nextSitePhoto && nextSitePhoto.qualityScore >= 40) {
      sourceUrl = nextSitePhoto.url;
      source = "site";
    } else if (gbpPhotos.length > 0) {
      sourceUrl = gbpPhotos.shift()!;
      source = "gbp";
    } else {
      // 2. Unsplash fill with a playbook-matched query.
      const query = playbook.photo_queries[slot.playbookQueryKey] ?? playbook.photo_queries.hero;
      const unsplash = await searchUnsplash(query);
      if (unsplash) {
        sourceUrl = unsplash.sourceUrl;
        source = "unsplash";
        attributionName = unsplash.attributionName;
        attributionUrl = unsplash.attributionUrl;
      } else {
        // 3. Pexels fallback.
        const pexels = await searchPexels(query);
        if (pexels) {
          sourceUrl = pexels.sourceUrl;
          source = "pexels";
          attributionName = pexels.attributionName;
          attributionUrl = pexels.attributionUrl;
        }
      }
    }

    if (!sourceUrl) continue;

    const publicUrl = await copyToStorage(sourceUrl, leadId, source, slot.slotHint);
    if (!publicUrl) continue;

    await admin.from("media_assets").insert({
      lead_id: leadId,
      storage_path: publicUrl.split("/lead-media/")[1] ?? publicUrl,
      public_url: publicUrl,
      source,
      slot_hint: slot.slotHint,
      attribution_name: attributionName,
      attribution_url: attributionUrl,
    });
  }
}
