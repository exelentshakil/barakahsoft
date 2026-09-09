import { fill, fillVars } from "@/lib/verticals/fill";
import type { SiteBrief } from "@/lib/generate-bespoke-site";

// Photographs for the whole page, not just the four the client had.
//
// This is the difference between the reference sites and ours. Alarcon Pro and
// Better Painting are photo-dense: every service card carries an image, there
// is a real work gallery, the team appears more than once. Our builds were
// text on dark grey because the manifest could only assign the handful of
// photos scraped from the client's own site, so twelve of fifteen sections had
// nothing to show and composed themselves out of type and borders.
//
// The client's own photography always comes first and is never displaced —
// it is the only genuinely authentic material we have. Stock tops the pool up
// to something a photo-led page can actually be built from.

export interface PoolPhoto {
  url: string;
  /** Shown to the art director so it assigns a photo that fits the section. */
  caption: string;
  source: "client" | "stock";
}

const TARGET_POOL = 20;

async function searchPexelsMany(query: string, count: number): Promise<{ url: string; alt: string }[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&size=large`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) {
      console.warn(`[photo-pool] pexels ${res.status} for "${query}"`);
      return [];
    }
    const data = await res.json();
    return (data.photos ?? [])
      .map((photo: { src?: { large2x?: string }; alt?: string }) => ({
        url: photo.src?.large2x ?? "",
        alt: photo.alt || query,
      }))
      .filter((photo: { url: string }) => photo.url.startsWith("https://"));
  } catch (err) {
    console.error(`[photo-pool] pexels failed for "${query}"`, err);
    return [];
  }
}

export async function buildPhotoPool(brief: SiteBrief, clientPhotos: string[]): Promise<PoolPhoto[]> {
  const pool: PoolPhoto[] = clientPhotos.slice(0, 12).map((url, index) => ({
    url,
    caption: index === 0 ? `${brief.businessName} real work photo (best available)` : `${brief.businessName} real work photo ${index + 1}`,
    source: "client",
  }));

  const needed = Math.max(0, TARGET_POOL - pool.length);
  if (needed === 0) return pool;

  // One query per offering, then generic shots to fill. Queries name the
  // industry so a "repair" query does not return a stock photo of a phone.
  //
  // The generic four come from the vertical profile. They were hardcoded to
  // "crew at work", "truck and equipment" and "finished project home
  // exterior", which is the right pool for a roofer and returns nothing a
  // dentist, a florist or a solicitor would ever put on their homepage.
  const profile = brief.vertical;
  const vars = fillVars(brief, profile);
  const queries = [
    ...brief.services.slice(0, 8).map((offering) => fill(profile.media.offeringQuery, { ...vars, item: offering })),
    fill(profile.media.heroQuery, vars),
    fill(profile.media.proofQuery, vars),
    fill(profile.media.teamQuery, vars),
  ];

  const results = await Promise.all(queries.map((query) => searchPexelsMany(query, 2)));

  const seen = new Set(pool.map((photo) => photo.url));
  for (let index = 0; index < results.length && pool.length < TARGET_POOL; index++) {
    for (const photo of results[index]) {
      if (pool.length >= TARGET_POOL || seen.has(photo.url)) continue;
      seen.add(photo.url);
      pool.push({ url: photo.url, caption: `${queries[index]} — ${photo.alt}`, source: "stock" });
    }
  }

  console.log(`[photo-pool] ${pool.length} photos (${pool.filter((p) => p.source === "client").length} from the client)`);
  return pool;
}
