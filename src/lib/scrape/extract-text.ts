import * as cheerio from "cheerio";
import type { FetchedPage } from "@/lib/scrape/fetch-site";

// Full page inventory + raw text per plan §7: nav, services, about, FAQs,
// testimonials, CTAs, disclaimers, prices if present, NAP, hours, social
// URLs, and what fields the site's own forms ask for. This is the bulk of
// scrape_results.facts — the grounding source every generate_* atom reads.
export interface PageInventory {
  url: string;
  title: string | null;
  headings: string[];
  navLinks: { text: string; href: string }[];
  bodyText: string;
  formFields: string[];
}

export interface ExtractedContactInfo {
  phones: string[];
  emails: string[];
  socialUrls: string[];
}

const SOCIAL_HOST_PATTERNS = [/facebook\.com/, /instagram\.com/, /twitter\.com/, /x\.com/, /tiktok\.com/, /youtube\.com/, /linkedin\.com/];

function extractContactInfo($: cheerio.CheerioAPI, bodyText: string): ExtractedContactInfo {
  const phones = Array.from(new Set(bodyText.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || []));
  const emails = Array.from(new Set(bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []));
  const socialUrls: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href && SOCIAL_HOST_PATTERNS.some((p) => p.test(href))) socialUrls.push(href);
  });
  return { phones, emails, socialUrls: Array.from(new Set(socialUrls)) };
}

export function extractPageInventory(page: FetchedPage): PageInventory {
  const $ = cheerio.load(page.html);
  $("script, style, noscript").remove();

  const title = $("title").first().text().trim() || null;
  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text) headings.push(text);
  });

  // <nav> alone misses real-world sites that don't use it — WordPress/Beaver
  // Builder-style pages (e.g. K-Team Karting, case 0) put the real menu in a
  // <header> with a plain <ul id="menu-nav">, no semantic <nav> at all.
  // Dedup by href since the same menu often appears twice (desktop + mobile
  // hamburger markup share link hrefs).
  const navLinks: { text: string; href: string }[] = [];
  const seenHrefs = new Set<string>();
  $('nav a[href], header a[href], ul[id*="menu" i] a[href], ul[class*="menu" i] a[href]').each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr("href");
    if (text && href && !seenHrefs.has(href)) {
      seenHrefs.add(href);
      navLinks.push({ text, href });
    }
  });

  const formFields: string[] = [];
  $("form input, form textarea, form select").each((_, el) => {
    const name = $(el).attr("name") || $(el).attr("id") || $(el).attr("placeholder");
    if (name) formFields.push(name);
  });

  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 20000);

  return { url: page.url, title, headings, navLinks, bodyText, formFields };
}

export function extractContactInfoFromPage(page: FetchedPage): ExtractedContactInfo {
  const $ = cheerio.load(page.html);
  const bodyText = $("body").text();
  return extractContactInfo($, bodyText);
}

// Titles are typically "Business Name | Tagline" or "Business Name - City" —
// take the first segment as the real business name. This is the site's own
// declared identity, and should outrank anything a lead-capture form collects
// (that field is the submitter's own contact name, not the business's).
export function deriveSiteName(title: string | null): string | null {
  if (!title) return null;
  const first = title.split(/[|\-–—]/)[0]?.trim();
  return first && first.length > 1 ? first : null;
}
