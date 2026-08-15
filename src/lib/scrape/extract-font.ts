import * as cheerio from "cheerio";
import type { FetchedPage } from "@/lib/scrape/fetch-site";

// extract_font atom. Same honest-static-signal limitation as
// extract-logo-color.ts — a real rendered page (headless browser) would be
// needed to read computed font-family reliably; this reads what sites
// actually publish (a Google Fonts <link>, the single most common
// real-world case) and falls back to null, which the shell renders with
// today's default Inter/Space Grotesk. Self-hosted/@font-face fonts are
// out of scope for this pass.
export interface FontResult {
  googleFontFamily: string | null;
  googleFontStylesheetUrl: string | null;
}

const GOOGLE_FONTS_CSS_PATTERN = /fonts\.googleapis\.com\/css/i;

function extractFamilyFromHref(href: string): string | null {
  try {
    const url = new URL(href);
    if (!GOOGLE_FONTS_CSS_PATTERN.test(url.host + url.pathname)) return null;
    const family = url.searchParams.get("family");
    if (!family) return null;
    // "Roboto:wght@400;700" or "Open+Sans:400,700" -> "Roboto" / "Open Sans"
    const first = family.split("|")[0]?.split(":")[0];
    const cleaned = first?.replace(/\+/g, " ").trim();
    return cleaned || null;
  } catch {
    return null;
  }
}

export function extractFont(page: FetchedPage): FontResult {
  const $ = cheerio.load(page.html);

  let family: string | null = null;
  let stylesheetUrl: string | null = null;

  $('link[rel="stylesheet"][href]').each((_, el) => {
    if (family) return;
    const href = $(el).attr("href");
    if (!href) return;
    let resolved: string | null;
    try {
      resolved = new URL(href, page.url).toString();
    } catch {
      resolved = null;
    }
    if (!resolved) return;
    const extracted = extractFamilyFromHref(resolved);
    if (extracted) {
      family = extracted;
      stylesheetUrl = resolved;
    }
  });

  if (!family) {
    $("style").each((_, el) => {
      if (family) return;
      const css = $(el).text();
      const match = /@import\s+url\((['"]?)(https:\/\/fonts\.googleapis\.com\/css[^'")]+)\1\)/i.exec(css);
      if (match) {
        const extracted = extractFamilyFromHref(match[2]);
        if (extracted) {
          family = extracted;
          stylesheetUrl = match[2];
        }
      }
    });
  }

  return { googleFontFamily: family, googleFontStylesheetUrl: stylesheetUrl };
}
