import * as cheerio from "cheerio";
import type { FetchedPage } from "@/lib/scrape/fetch-site";

// Cheap heuristic signals from a homepage's already-fetched HTML — not a
// second live fetch, just a deeper read of the same page researchCompetitors
// already pulls for headline/brand-color. This is the real, live, per-lead
// design-research signal that feeds section-variant composition: what do
// real competitors in this niche/location actually do structurally.
export interface CompetitorStructuralSignals {
  heroImagePresent: boolean;
  statsAboveFold: boolean;
  testimonialPresent: boolean;
  galleryPresent: boolean;
  navLinkCount: number;
}

export function extractStructuralSignals(page: FetchedPage): CompetitorStructuralSignals {
  const $ = cheerio.load(page.html);
  $("script, style, noscript").remove();

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const aboveFoldText = bodyText.slice(0, 600);

  const images = $("img");
  const heroImagePresent = images.toArray().some((el) => {
    const width = parseInt($(el).attr("width") || "0", 10);
    return width === 0 || width > 300;
  });

  const statsAboveFold =
    /\b\d{1,4}[+%]?\b/.test(aboveFoldText) && /(year|review|customer|job|project|client|star)/i.test(aboveFoldText);

  const classAndIdText = $("[class], [id]")
    .toArray()
    .map((el) => `${$(el).attr("class") ?? ""} ${$(el).attr("id") ?? ""}`)
    .join(" ");
  const testimonialPresent = /testimonial|review/i.test(classAndIdText) || /[★☆]/.test(bodyText);

  const galleryPresent = images.length >= 6 || /gallery|portfolio/i.test(classAndIdText);

  const navLinkCount = $("nav a[href], header a[href]").length;

  return { heroImagePresent, statsAboveFold, testimonialPresent, galleryPresent, navLinkCount };
}
