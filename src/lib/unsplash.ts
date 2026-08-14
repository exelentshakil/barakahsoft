// search_unsplash atom — step 2 of the photo waterfall (plan §4/§7 of the
// pasted spec): only called when a required slot has no usable photo from
// the business's own site/GBP. Returns the source URL for photo-waterfall.ts
// to download and copy into Supabase Storage — never hotlinked, and the
// caller is responsible for writing attribution_name/attribution_url onto
// the resulting media_assets row (Unsplash's license requires it).
export type UnsplashPhoto = {
  sourceUrl: string;
  alt: string;
  width: number;
  height: number;
  attributionName: string;
  attributionUrl: string;
};

export async function searchUnsplash(query: string): Promise<UnsplashPhoto | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );
    if (!res.ok) throw new Error(`Unsplash API ${res.status}`);
    const data = await res.json();
    const photo = data.results?.[0];
    if (!photo) return null;
    return {
      sourceUrl: photo.urls.regular,
      alt: photo.alt_description || query,
      width: photo.width,
      height: photo.height,
      attributionName: photo.user?.name || "Unsplash",
      attributionUrl: photo.user?.links?.html || "https://unsplash.com",
    };
  } catch (err) {
    console.error("[unsplash] search failed", err);
    return null;
  }
}
