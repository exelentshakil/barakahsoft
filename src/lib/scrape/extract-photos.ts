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
  // DOM context for photos that can genuinely sit inside real page content
  // (img/lazy/css-bg only — og/twitter/favicon/json-ld have no meaningful
  // position). Lets downstream steps match a photo to a specific topic
  // (Phase C2 captioning, Phase C3 slot matching) instead of ranking blind.
  nearestHeading: string | null;
  sectionText: string | null;
}

function resolveUrl(url: string, base: string): string | null {
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

const SECTION_LIKE_SELECTOR = 'section, article, li, div[class*="service" i], div[class*="card" i], div[class*="item" i]';

// Climbs from an element to the nearest containing "block" (a section/card/
// list-item, or a div that looks like one) and the closest heading either
// inside that block or immediately preceding it — a cheap, real signal for
// "what is this photo actually next to," not an AI guess.
function nearestContext(startNode: ReturnType<cheerio.CheerioAPI>): { nearestHeading: string | null; sectionText: string | null } {
  let node = startNode;
  let sectionText: string | null = null;
  let heading: string | null = null;

  for (let i = 0; i < 6 && node.length; i++) {
    if (!sectionText && node.is(SECTION_LIKE_SELECTOR)) {
      const text = node.text().replace(/\s+/g, " ").trim();
      if (text) sectionText = text.slice(0, 300);
    }
    if (!heading) {
      const h = node.find("h1, h2, h3, h4").first();
      const text = h.text().trim();
      if (text) heading = text;
    }
    if (sectionText && heading) break;
    node = node.parent();
  }

  if (!heading) {
    let prev = startNode.closest(SECTION_LIKE_SELECTOR).prev();
    for (let i = 0; i < 3 && prev.length; i++) {
      if (/^h[1-4]$/i.test((prev.prop("tagName") as string) || "")) {
        const text = prev.text().trim();
        if (text) heading = text;
        break;
      }
      prev = prev.prev();
    }
  }

  return { nearestHeading: heading, sectionText };
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
          if (resolved) candidates.push({ url: resolved, alt: null, sourcePage: pageUrl, kind: "json-ld", nearestHeading: null, sectionText: null });
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
    const context = nearestContext($(el));
    if (src) {
      const resolved = resolveUrl(src, page.url);
      if (resolved) candidates.push({ url: resolved, alt, sourcePage: page.url, kind, ...context });
    }
    const srcset = $(el).attr("srcset");
    if (srcset) {
      const largest = srcset.split(",").pop()?.trim().split(" ")[0];
      if (largest) {
        const resolved = resolveUrl(largest, page.url);
        if (resolved) candidates.push({ url: resolved, alt, sourcePage: page.url, kind: "img", ...context });
      }
    }
  });

  $("picture source[srcset]").each((_, el) => {
    const srcset = $(el).attr("srcset");
    const largest = srcset?.split(",").pop()?.trim().split(" ")[0];
    if (largest) {
      const resolved = resolveUrl(largest, page.url);
      if (resolved) candidates.push({ url: resolved, alt: null, sourcePage: page.url, kind: "img", ...nearestContext($(el)) });
    }
  });

  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) {
    const resolved = resolveUrl(ogImage, page.url);
    if (resolved) candidates.push({ url: resolved, alt: null, sourcePage: page.url, kind: "og", nearestHeading: null, sectionText: null });
  }

  const twitterImage = $('meta[name="twitter:image"]').attr("content");
  if (twitterImage) {
    const resolved = resolveUrl(twitterImage, page.url);
    if (resolved) candidates.push({ url: resolved, alt: null, sourcePage: page.url, kind: "twitter", nearestHeading: null, sectionText: null });
  }

  const favicon = $('link[rel~="icon"]').first().attr("href");
  if (favicon) {
    const resolved = resolveUrl(favicon, page.url);
    if (resolved) candidates.push({ url: resolved, alt: null, sourcePage: page.url, kind: "favicon", nearestHeading: null, sectionText: null });
  }

  const appleTouch = $('link[rel="apple-touch-icon"]').first().attr("href");
  if (appleTouch) {
    const resolved = resolveUrl(appleTouch, page.url);
    if (resolved) candidates.push({ url: resolved, alt: null, sourcePage: page.url, kind: "apple-touch", nearestHeading: null, sectionText: null });
  }

  $("[style]").each((_, el) => {
    const style = $(el).attr("style") || "";
    const match = style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/);
    if (match) {
      const resolved = resolveUrl(match[1], page.url);
      if (resolved) candidates.push({ url: resolved, alt: null, sourcePage: page.url, kind: "css-bg", ...nearestContext($(el)) });
    }
  });

  candidates.push(...extractFromJsonLd($, page.url));

  return candidates;
}
