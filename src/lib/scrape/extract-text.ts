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
  // Confirmed real gap (danielsroofingnyc.com): a single-page Divi/
  // WordPress site's real service list can be plain <li> text with no <a>
  // wrapper at all -- invisible to navLinks. Collected here as a fallback
  // source for derive-services.ts, only used when nav-derived candidates
  // are too thin to be a real service list on their own.
  listItemCandidates: string[];
}

export interface ExtractedContactInfo {
  phones: string[];
  emails: string[];
  socialUrls: string[];
}

const SOCIAL_HOST_PATTERNS = [/facebook\.com/, /instagram\.com/, /twitter\.com/, /x\.com/, /tiktok\.com/, /youtube\.com/, /linkedin\.com/];

function extractContactInfo($: cheerio.CheerioAPI, bodyText: string): ExtractedContactInfo {
  // A phone has at least ten digits.
  //
  // The old pattern started at `\d`, so it clipped the opening bracket off
  // "(307) 475-6088" and handed "307) 475-6088" on as the number — and it
  // matched any run of digits and dots, which meant the latitude and
  // longitude in a map embed ("41.160885", "104.705409") were collected as
  // phone numbers too. The first of those was then passed to Places as this
  // business's phone, which is how a Wyoming roofer was matched to a company
  // in Stuart, Florida and shipped that company's rating and reviews.
  const phones = Array.from(
    new Set(
      (bodyText.match(/\+?\d{0,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g) || [])
        .map((candidate) => candidate.trim())
        .filter((candidate) => {
          const digits = candidate.replace(/\D/g, "");
          return digits.length >= 10 && digits.length <= 15;
        })
    )
  );
  const emails = Array.from(new Set(bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []));
  const socialUrls: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href && SOCIAL_HOST_PATTERNS.some((p) => p.test(href))) socialUrls.push(href);
  });
  return { phones, emails, socialUrls: Array.from(new Set(socialUrls)) };
}

// extract_list_item_candidates atom -- a real service list rendered as
// plain <li> text (no <a> wrapper) inside a generic content module, not a
// <nav>/<header>/menu-class container. Conservative: only lists with 3+
// non-linked items count (a real service list is usually several items,
// not one or two incidental bullets), each item capped to a short phrase
// (real service names are short -- "NEW ROOF INSTALLATION", "Gutter
// Cleaning", not a sentence).
function extractListItemCandidates($: cheerio.CheerioAPI): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  $("ul, ol").each((_, listEl) => {
    const items = $(listEl).children("li").toArray();
    const plainTextItems = items.filter((li) => $(li).find("a").length === 0);
    if (plainTextItems.length < 3) return;

    for (const li of plainTextItems) {
      const text = $(li).text().replace(/\s+/g, " ").trim();
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      if (!text || wordCount === 0 || wordCount > 8) continue;
      if (!/[a-zA-Z]/.test(text)) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push(text);
    }
  });

  return candidates;
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
  const listItemCandidates = extractListItemCandidates($);

  return { url: page.url, title, headings, navLinks, bodyText, formFields, listItemCandidates };
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
