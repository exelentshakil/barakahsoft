import { createAdminClient } from "@/lib/supabase/admin";

// A real map of the service area, with one pin per place the business
// actually serves.
//
// What the model produced instead was an <iframe> pointed at
// maps.google.com/maps?...&output=embed — the unofficial embed hack, not the
// Maps Embed API. On one real lead it carried the query "Las Vegas Whitney,
// NV" (the city and the first area concatenated into something that is not a
// place) and showed a single pin for ten service areas. It is also
// model-authored, so it changed shape on every generation.
//
// Static Maps is the right primitive here: it takes many markers, returns an
// image, and needs no JavaScript or third-party frame on a client's page.
//
// The key must never reach the generated HTML. Static Maps authenticates by
// query parameter, so a raw URL in the markup would publish the credential
// on every client site — the sanitiser already strips any img src containing
// an AIza… token for exactly this reason. So the image is fetched during
// generation and stored, and the page references our own Storage URL.

/** Static Maps allows one alphanumeric character per marker label. */
const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export interface ServiceMapResult {
  url: string;
  pins: { label: string; area: string }[];
}

function normaliseHex(hex: string | null | undefined): string {
  const value = (hex ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(value) ? `0x${value.slice(1)}` : "0xEA4335";
}

/**
 * Build the request URL. Kept separate so it is never accidentally the thing
 * that gets written into markup.
 */
function staticMapUrl(
  areas: string[],
  brandHex: string | null,
  apiKey: string,
  /** "WY, USA". A bare town name is geocoded against the whole planet. */
  regionHint: string | null,
  /** The verified business location, so the frame cannot drift off it. */
  origin: { lat: number; lng: number } | null
): string {
  const qualify = (area: string) =>
    regionHint && !area.includes(",") ? `${area}, ${regionHint}` : area;

  const markers = areas
    .map((area, index) => `markers=${encodeURIComponent(`color:${normaliseHex(brandHex)}|label:${LABELS[index]}|${qualify(area)}`)}`)
    .join("&");

  // The business itself, so the map is anchored on somewhere we have verified
  // rather than on wherever the pins happened to land.
  const home = origin
    ? `&markers=${encodeURIComponent(`color:0x111111|label:H|${origin.lat},${origin.lng}`)}`
    : "";

  return `https://maps.googleapis.com/maps/api/staticmap?size=640x420&scale=2&maptype=roadmap&region=us&${markers}${home}&key=${apiKey}`;
}

/**
 * Fetch the map and put it in Storage.
 *
 * Returns null rather than throwing on any failure: a missing map should
 * cost the page its map section, never the whole generation.
 */
export async function renderServiceMap(
  leadId: string,
  areas: string[],
  brandHex: string | null,
  regionHint: string | null = null,
  origin: { lat: number; lng: number } | null = null
): Promise<ServiceMapResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  // Google geocodes each marker server-side, so place names are enough — but
  // 26 is the hard ceiling on distinct labels, and a map with more pins than
  // that is unreadable long before it is incorrect.
  const shortlist = areas.map((a) => a.trim()).filter(Boolean).slice(0, LABELS.length);
  if (shortlist.length === 0) return null;

  try {
    const response = await fetch(staticMapUrl(shortlist, brandHex, apiKey, regionHint, origin));
    if (!response.ok) {
      console.error("[service-map] static maps returned", response.status);
      return null;
    }
    const contentType = response.headers.get("content-type") ?? "";
    // A quota or referrer failure comes back as a 200 with a text body.
    if (!contentType.startsWith("image/")) {
      console.error("[service-map] expected an image, got", contentType);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const admin = createAdminClient();
    const path = `${leadId}/service-map.png`;
    const { error } = await admin.storage.from("lead-media").upload(path, buffer, {
      contentType: "image/png",
      upsert: true,
      cacheControl: "31536000",
    });
    if (error) {
      console.error("[service-map] upload failed", error.message);
      return null;
    }

    const { data } = admin.storage.from("lead-media").getPublicUrl(path);
    return {
      // Regenerating replaces the same path, so without this the page keeps
      // serving the previous lead's map from cache.
      url: `${data.publicUrl}?v=${Date.now()}`,
      pins: shortlist.map((area, index) => ({ label: LABELS[index], area })),
    };
  } catch (err) {
    console.error("[service-map] failed", err);
    return null;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** The map plus a legend that ties each lettered pin back to its place. */
function mapFigure(map: ServiceMapResult, businessName: string): string {
  const legend = map.pins
    .map(
      (pin) =>
        `<li class="bs-map-legend-item"><span class="bs-map-pin" aria-hidden="true">${pin.label}</span><span class="bs-map-place">${escapeHtml(pin.area)}</span></li>`
    )
    .join("");

  return `<figure class="bs-service-map"><img src="${escapeHtml(map.url)}" alt="Map of the areas ${escapeHtml(businessName)} serves, with a pin on each" width="1280" height="840" loading="lazy" decoding="async" class="bs-service-map-image" /><figcaption class="bs-map-legend-wrap"><ul class="bs-map-legend">${legend}</ul></figcaption></figure>`;
}

/**
 * Put the real map into the areas section.
 *
 * Deterministic post-processing rather than an instruction, because the
 * model demonstrably invents its own embed however the brief is worded, and
 * a map is either correct or it is a liability on a page whose whole job is
 * telling someone whether they are covered.
 */
export function injectServiceMap(html: string, map: ServiceMapResult, businessName: string): string {
  const section = html.match(/<section\b[^>]*\bid=["']areas["'][\s\S]*?<\/section>/i)?.[0];
  if (!section) return html;

  const figure = mapFigure(map, businessName);

  // Replace whatever map the model reached for; otherwise add one.
  const replaced = /<iframe[\s\S]*?<\/iframe>/i.test(section)
    ? section.replace(/<iframe[\s\S]*?<\/iframe>/i, figure)
    : section.replace(/<\/section>\s*$/i, `${figure}</section>`);

  return html.replace(section, replaced);
}
