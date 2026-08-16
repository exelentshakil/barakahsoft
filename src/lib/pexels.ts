// search_pexels atom — step 3 of the photo waterfall, only reached if
// Unsplash returned nothing usable for a slot. v4 Phase N — photo-waterfall.ts
// now hotlinks this directly when safe rather than always downloading and
// copying into Storage; falls back to copying when the hotlink-safety
// check fails.
export type PexelsPhoto = {
  sourceUrl: string;
  alt: string;
  width: number;
  height: number;
  attributionName: string;
  attributionUrl: string;
};

export async function searchPexels(query: string): Promise<PexelsPhoto | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) throw new Error(`Pexels API ${res.status}`);
    const data = await res.json();
    const photo = data.photos?.[0];
    if (!photo) return null;
    return {
      sourceUrl: photo.src.large2x,
      alt: photo.alt || query,
      width: photo.width,
      height: photo.height,
      attributionName: photo.photographer || "Pexels",
      attributionUrl: photo.photographer_url || "https://pexels.com",
    };
  } catch (err) {
    console.error("[pexels] search failed", err);
    return null;
  }
}
