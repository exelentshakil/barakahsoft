import * as cheerio from "cheerio";
import type { FetchedPage } from "@/lib/scrape/fetch-site";

// extract_video atom — v4 Phase N5: look for a real, self-hosted <video> on
// the client's own site before ever falling back to Veo generation. Only
// mp4/webm <source>/<video src> — YouTube/Vimeo iframe embeds are out of
// scope, there's no reliable way to use a third-party embed as a hero
// background. Same resolveUrl convention as extract-photos.ts.
export interface SiteVideo {
  url: string;
  posterUrl: string | null;
  sourcePage: string;
}

const VIDEO_EXT_PATTERN = /\.(mp4|webm)(\?|$)/i;

function resolveUrl(url: string, base: string): string | null {
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

export function extractVideo(page: FetchedPage): SiteVideo | null {
  const $ = cheerio.load(page.html);
  let found: SiteVideo | null = null;

  $("video").each((_, el) => {
    if (found) return;
    const $video = $(el);
    const directSrc = $video.attr("src");
    const sourceSrc = $video.find("source").map((__, s) => $(s).attr("src")).get().find((s) => s && VIDEO_EXT_PATTERN.test(s));
    const candidate = (directSrc && VIDEO_EXT_PATTERN.test(directSrc) ? directSrc : null) ?? sourceSrc;
    if (!candidate) return;

    const resolved = resolveUrl(candidate, page.url);
    if (!resolved) return;

    const posterAttr = $video.attr("poster");
    const posterUrl = posterAttr ? resolveUrl(posterAttr, page.url) : null;

    found = { url: resolved, posterUrl, sourcePage: page.url };
  });

  return found;
}

// Runs across every scraped page, homepage/about first — the hero band is
// what a real self-hosted video is usually attached to.
export function extractSiteVideo(pages: FetchedPage[]): SiteVideo | null {
  for (const page of pages) {
    const found = extractVideo(page);
    if (found) return found;
  }
  return null;
}
