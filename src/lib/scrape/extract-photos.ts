import * as cheerio from "cheerio";
import type { FetchedPage } from "@/lib/scrape/fetch-site";

// extract_photos atom — pulls every candidate photo URL from a page's
// img/srcset/picture, OG/Twitter meta, favicon/apple-touch icons, JSON-LD
// images, CSS background-image, and lazy data-src attributes, per plan §7's
// exhaustive-scrape requirement. Dedup and quality-rank happen downstream in
// rank-photos.ts — this atom only collects candidates.
export interface PhotoCandidate {
  url: string;
  alt: string | null;
  sourcePage: string;
  kind: "img" | "og" | "twitter" | "favicon" | "apple-touch" | "json-ld" | "css-bg" | "lazy";
}

function resolveUrl(url: string, base: string): string | null {
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

function extractFromJsonLd($: cheerio.CheerioAPI, pageUrl: string): PhotoCandidate[] {
  const candidates: PhotoCandidate[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text());
      const entries = Array.isArray(json) ? json : [json];
      for (const entry of entries) {
        const image = entry?.image;
        const urls = Array.isArray(image) ? image : image ? [image] : [];
        for (const u of urls) {
          const resolved = typeof u === "string" ? resolveUrl(u, pageUrl) : null;
          if (resolved) candidates.push({ url: resolved, alt: null, sourcePage: pageUrl, kind: "json-ld" });
        }
      }
    } catch {
      // malformed JSON-LD on the target site — skip, not our bug to fix
    }
  });
  return candidates;
}

export function extractPhotos(page: FetchedPage): PhotoCandidate[] {
  const $ = cheerio.load(page.html);
  const candidates: PhotoCandidate[] = [];

  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    const alt = $(el).attr("alt") || null;
    const kind = $(el).attr("data-src") && !$(el).attr("src") ? "lazy" : "img";
    if (src) {
      const resolved = resolveUrl(src, page.url);
      if (resolved) candidates.push({ url: resolved, alt, sourcePage: page.url, kind });
    }
    const srcset = $(el).attr("srcset");
    if (srcset) {
      const largest = srcset.split(",").pop()?.trim().split(" ")[0];
      if (largest) {
        const resolved = resolveUrl(largest, page.url);
        if (resolved) candidates.push({ url: resolved, alt, sourcePage: page.url, kind: "img" });
      }
    }
  });

  $("picture source[srcset]").each((_, el) => {
    const srcset = $(el).attr("srcset");
    const largest = srcset?.split(",").pop()?.trim().split(" ")[0];
    if (largest) {
      const resolved = resolveUrl(largest, page.url);
      if (resolved) candidates.push({ url: resolved, alt: null, sourcePage: page.url, kind: "img" });
    }
  });

  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) {
    const resolved = resolveUrl(ogImage, page.url);
    if (resolved) candidates.push({ url: resolved, alt: null, sourcePage: page.url, kind: "og" });
  }

  const twitterImage = $('meta[name="twitter:image"]').attr("content");
  if (twitterImage) {
    const resolved = resolveUrl(twitterImage, page.url);
    if (resolved) candidates.push({ url: resolved, alt: null, sourcePage: page.url, kind: "twitter" });
  }

  const favicon = $('link[rel~="icon"]').first().attr("href");
  if (favicon) {
    const resolved = resolveUrl(favicon, page.url);
    if (resolved) candidates.push({ url: resolved, alt: null, sourcePage: page.url, kind: "favicon" });
  }

  const appleTouch = $('link[rel="apple-touch-icon"]').first().attr("href");
  if (appleTouch) {
    const resolved = resolveUrl(appleTouch, page.url);
    if (resolved) candidates.push({ url: resolved, alt: null, sourcePage: page.url, kind: "apple-touch" });
  }

  $("[style]").each((_, el) => {
    const style = $(el).attr("style") || "";
    const match = style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/);
    if (match) {
      const resolved = resolveUrl(match[1], page.url);
      if (resolved) candidates.push({ url: resolved, alt: null, sourcePage: page.url, kind: "css-bg" });
    }
  });

  candidates.push(...extractFromJsonLd($, page.url));

  return candidates;
}
