import { createAdminClient } from "@/lib/supabase/admin";
import { searchUnsplash } from "@/lib/unsplash";
import { searchPexels } from "@/lib/pexels";
import { isHotlinkSafe } from "@/lib/scrape/check-hotlink-safety";
import type { Playbook } from "@/lib/playbooks";
import type { MediaAssetSource, MediaStorageMode } from "@/types/database";
import type { CaptionedPhoto } from "@/lib/scrape/caption-photos";

const MIN_QUALITY_FLOOR = 40;

// A slot hint is "kind" or "kind:topic" (e.g. "hero", "service:gutter-repair",
// "area:park-slope") — the part after the colon is the real semantic topic.
function slotTopic(slotHint: string): string[] {
  const colonIndex = slotHint.indexOf(":");
  const raw = colonIndex >= 0 ? slotHint.slice(colonIndex + 1) : slotHint;
  return raw
    .replace(/[-_]/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

// Picks the best unused real site photo for a slot by cheap keyword overlap
// between the slot's topic and everything real we know about the photo
// (alt text, an AI-inferred caption for hashed/alt-less images, the nearest
// real heading/section text it sat next to on the source page) — not a
// second AI call, just scoring against context Phase C1/C2 already captured.
// Blind ranked-order consumption meant a lead with 12 real services only
// ever got 3 real photos used total; this lets every slot find its own
// best-matching unused photo instead.
function pickBestSitePhoto(sitePhotos: CaptionedPhoto[], slot: RequiredSlot, usedUrls: Set<string>): CaptionedPhoto | null {
  const topicWords = slotTopic(slot.slotHint);

  let best: CaptionedPhoto | null = null;
  let bestScore = -Infinity;

  for (const photo of sitePhotos) {
    if (usedUrls.has(photo.url) || photo.qualityScore < MIN_QUALITY_FLOOR) continue;
    const haystack = `${photo.alt ?? ""} ${photo.inferredCaption ?? ""} ${photo.nearestHeading ?? ""} ${photo.sectionText ?? ""} ${photo.url}`.toLowerCase();
    const matches = topicWords.filter((w) => haystack.includes(w)).length;
    const semanticScore = topicWords.length > 0 ? (matches / topicWords.length) * 100 : 0;
    const finalScore = photo.qualityScore * 0.4 + semanticScore * 0.6;
    if (finalScore > bestScore) {
      bestScore = finalScore;
      best = photo;
    }
  }

  return best;
}

// copy_to_storage atom — downloads a source URL and re-uploads into this
// lead's Storage folder. Used whenever hotlinking a source isn't safe (see
// resolveMediaUrl below), or unconditionally for GBP photos.
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

// v4 Phase N — reverses the earlier "never hotlinked" decision (storage
// cost): site-photo and stock-fallback (unsplash/pexels) sources hotlink
// directly when isHotlinkSafe confirms it, skipping copyToStorage entirely.
// GBP photos always go through copyToStorage — the Places Photo API already
// requires a server-side authenticated fetch, so there's no separate
// hotlink win, and Google's endpoint has its own referrer/key restrictions
// that make direct client-side hotlinking unreliable.
const HOTLINK_ELIGIBLE: MediaAssetSource[] = ["site", "unsplash", "pexels"];

async function resolveMediaUrl(
  sourceUrl: string,
  leadId: string,
  source: MediaAssetSource,
  slotHint: string
): Promise<{ publicUrl: string; storageMode: MediaStorageMode } | null> {
  if (HOTLINK_ELIGIBLE.includes(source) && (await isHotlinkSafe(sourceUrl))) {
    return { publicUrl: sourceUrl, storageMode: "hotlink" };
  }
  const copied = await copyToStorage(sourceUrl, leadId, source, slotHint);
  return copied ? { publicUrl: copied, storageMode: "copied" } : null;
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
  facts: { site_photos?: CaptionedPhoto[]; gbp_photo_urls?: string[] },
  playbook: Playbook,
  requiredSlots: RequiredSlot[]
) {
  const admin = createAdminClient();
  const sitePhotos = facts.site_photos ?? [];
  const usedUrls = new Set<string>();
  const gbpPhotos = [...(facts.gbp_photo_urls ?? [])];

  for (const slot of requiredSlots) {
    let sourceUrl: string | null = null;
    let source: MediaAssetSource = "site";
    let attributionName: string | null = null;
    let attributionUrl: string | null = null;

    // 1. Theirs first — best semantic+quality match, then GBP photos.
    const bestSitePhoto = pickBestSitePhoto(sitePhotos, slot, usedUrls);
    if (bestSitePhoto) {
      sourceUrl = bestSitePhoto.url;
      source = "site";
      usedUrls.add(bestSitePhoto.url);
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

    const resolved = await resolveMediaUrl(sourceUrl, leadId, source, slot.slotHint);
    if (!resolved) continue;
    const { publicUrl, storageMode } = resolved;

    await admin.from("media_assets").insert({
      lead_id: leadId,
      storage_path: storageMode === "copied" ? publicUrl.split("/lead-media/")[1] ?? publicUrl : sourceUrl,
      public_url: publicUrl,
      source,
      slot_hint: slot.slotHint,
      attribution_name: attributionName,
      attribution_url: attributionUrl,
      storage_mode: storageMode,
    });
  }
}
