import { createAdminClient } from "@/lib/supabase/admin";
import { mirrorToStorage } from "@/lib/media/ingest";
import { recordVersion, HOME_KEY } from "@/lib/page-versions";

// Image slots — the operator's fix for a photograph that landed badly.
//
// Swapping an image rewrites the stored markup rather than adding a render-time
// indirection. That keeps one representation of a page: what is in the database
// is exactly what renders, and exactly what a standalone export produces. A
// render-time lookup would mean the exported site and the previewed site could
// disagree.
//
// The slot list is now read out of the markup itself rather than out of a
// planning table written during the build. There is no build-time media plan
// any more — photographs are curated before a build, not arranged during one —
// and reading the document means the Studio can never show a slot the page does
// not actually contain, or miss one it does.

export interface SlotView {
  key: string;
  label: string;
  url: string;
  origin: "real" | "stock" | "uploaded";
}

const SLOT_LABELS: Record<string, string> = {
  hero: "Hero",
  about: "About / team",
  proof: "Proof / finished work",
  team: "Team",
  gallery: "Gallery",
};

function slotLabel(key: string, serviceNames: string[]): string {
  if (SLOT_LABELS[key]) return SLOT_LABELS[key];
  const service = key.match(/^service-(\d+)$/);
  if (service) {
    const index = Number(service[1]);
    return serviceNames[index] ? `Service · ${serviceNames[index]}` : `Service ${index + 1}`;
  }
  return key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function loadHomepage(leadId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("artifacts")
    .select("bespoke_homepage_html")
    .eq("lead_id", leadId)
    .maybeSingle<{ bespoke_homepage_html: string | null }>();
  return data?.bespoke_homepage_html ?? "";
}

const IMG_TAG = /<img\b[^>]*>/gi;

function attr(tag: string, name: string): string | null {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? null;
}

/** Every slotted image in the page, in document order, first occurrence wins. */
export async function listSlots(leadId: string, serviceNames: string[] = []): Promise<SlotView[]> {
  const html = await loadHomepage(leadId);
  if (!html) return [];

  const found = new Map<string, string>();
  for (const tag of html.match(IMG_TAG) ?? []) {
    const slot = attr(tag, "data-slot");
    const src = attr(tag, "src");
    if (!slot || !src || found.has(slot)) continue;
    // A logo is a brand mark, not swappable photography. Models tag it anyway,
    // and it then occupies two tiles in the operator's photo grid as something
    // to replace — which is both wrong and the first thing the eye lands on.
    if (/logo|wordmark|brand-?mark/i.test(slot)) continue;
    found.set(slot, src);
  }
  if (found.size === 0) return [];

  const admin = createAdminClient();
  const { data: assets } = await admin
    .from("media_assets")
    .select("public_url, source")
    .eq("lead_id", leadId)
    .returns<{ public_url: string; source: string }[]>();

  const sourceByUrl = new Map((assets ?? []).map((a) => [a.public_url, a.source]));

  return [...found.entries()].map(([key, url]) => {
    const assetSource = sourceByUrl.get(url);
    return {
      key,
      label: slotLabel(key, serviceNames),
      url,
      // Stock is called stock. An operator scanning the grid needs to see at a
      // glance which pictures are not the client's, because those are the ones
      // worth replacing before anything is sent.
      origin:
        assetSource === "upload"
          ? "uploaded"
          : assetSource === "pexels" || assetSource === "unsplash"
            ? "stock"
            : "real",
    };
  });
}

/**
 * Point one slot at a new image.
 *
 * Matched on the data-slot attribute rather than on the current URL, because
 * two slots can legitimately share a photograph and matching by URL swapped
 * both of them. The whole <img> is located first and its src rewritten second,
 * since attribute order varies.
 */
export async function applyMedia(
  leadId: string,
  slotKey: string,
  newUrl: string,
  note: string
): Promise<boolean> {
  const html = await loadHomepage(leadId);
  if (!html) return false;

  const escaped = slotKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<img\\b[^>]*\\bdata-slot=["']${escaped}["'][^>]*>`, "gi");

  const updated = html.replace(pattern, (tag) =>
    /\bsrc\s*=/.test(tag)
      ? tag.replace(/\bsrc\s*=\s*(["'])[^"']*\1/i, `src="${newUrl}"`)
      : tag.replace(/^<img/i, `<img src="${newUrl}"`)
  );

  if (updated === html) return false;

  const admin = createAdminClient();
  await admin
    .from("artifacts")
    .update({ bespoke_homepage_html: updated, last_edited_at: new Date().toISOString() })
    .eq("lead_id", leadId);

  // Recorded so swapping a photo is undoable exactly like a copy edit.
  await recordVersion(leadId, HOME_KEY, updated, "edited", note);
  return true;
}

/** Replace a slot with a real photograph the operator supplies. */
export async function uploadToSlot(
  leadId: string,
  slotKey: string,
  file: Buffer,
  caption: string
): Promise<{ url: string; applied: boolean } | null> {
  const stored = await mirrorToStorage(leadId, `upload:${slotKey}:${Date.now()}`, "upload", {
    slotHint: slotKey,
    buffer: file,
  });
  if (!stored) return null;

  const admin = createAdminClient();
  await admin
    .from("media_assets")
    .update({ caption: caption || null, subject: "work", usable: true })
    .eq("id", stored.id);

  const applied = await applyMedia(leadId, slotKey, stored.publicUrl, `Real photo added to ${slotKey}`);
  return { url: stored.publicUrl, applied };
}
