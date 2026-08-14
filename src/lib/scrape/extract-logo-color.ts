import * as cheerio from "cheerio";
import type { FetchedPage } from "@/lib/scrape/fetch-site";
import { hexToHslTriplet } from "@/lib/color";

// extract_logo_color atom. True computed-CSS extraction needs a real
// rendered page (headless browser) — out of scope for a static-HTML scrape.
// This uses the honest static signals sites actually publish (theme-color
// meta tag, common brand CSS custom properties) and falls back to null,
// which the shell renders with its own neutral default until an operator
// overrides it during QA/prompt-editing.
const HEX_COLOR = /#[0-9a-f]{3,8}\b/i;
const BRAND_VAR_NAMES = ["--brand", "--primary", "--primary-color", "--theme-color", "--brand-color"];

export interface LogoColorResult {
  logoUrl: string | null;
  brandColorHex: string | null;
  brandColorHsl: string | null;
}

function findLogoUrl($: cheerio.CheerioAPI, pageUrl: string): string | null {
  const candidates = [
    $('link[rel="icon"]').attr("href"),
    $('link[rel="apple-touch-icon"]').attr("href"),
    $('header img[class*="logo"], img[class*="logo"], img[id*="logo"]').first().attr("src"),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      return new URL(candidate, pageUrl).toString();
    } catch {
      continue;
    }
  }
  return null;
}

function findBrandColor($: cheerio.CheerioAPI): string | null {
  const themeColor = $('meta[name="theme-color"]').attr("content");
  if (themeColor && HEX_COLOR.test(themeColor)) return themeColor.match(HEX_COLOR)![0];

  let found: string | null = null;
  $("style").each((_, el) => {
    if (found) return;
    const css = $(el).text();
    for (const varName of BRAND_VAR_NAMES) {
      const match = new RegExp(`${varName}\\s*:\\s*(#[0-9a-f]{3,8})`, "i").exec(css);
      if (match) {
        found = match[1];
        return;
      }
    }
  });
  return found;
}

export function extractLogoColor(page: FetchedPage): LogoColorResult {
  const $ = cheerio.load(page.html);
  const logoUrl = findLogoUrl($, page.url);
  const brandColorHex = findBrandColor($);

  return {
    logoUrl,
    brandColorHex,
    brandColorHsl: brandColorHex ? hexToHslTriplet(brandColorHex) : null,
  };
}
