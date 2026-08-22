// Deriving a business's real services from its URL structure.
//
// A path like /services/200-amp-panel-upgrades names a real service as
// reliably as crawling that page would, and Firecrawl's map endpoint returns
// every URL on a site for a single credit. That is a thirtieth of the cost of
// crawling to learn the same thing.
//
// This is why the default scrape is now map-plus-homepage rather than a full
// crawl: the expensive part of the crawl was mostly buying us a list of
// service names we can read straight off the sitemap.

const SERVICE_PATH = /\/(services?|our-services|what-we-do|solutions|specialt(?:y|ies)|repairs?|installations?)\//i;

const AREA_PATH = /\/(areas?|locations?|service-areas?|cities|towns|neighou?rhoods?)\//i;

// Paths that exist on nearly every site and describe no service at all.
const BOILERPLATE =
  /^(home|index|about|about-us|contact|contact-us|privacy|privacy-policy|terms|terms-of-service|sitemap|blog|news|careers|jobs|reviews|testimonials|gallery|faq|faqs|team|our-team|financing|coupons|specials|search|login|account|cart|checkout|thank-you|thanks|404|service-areas?|areas-we-serve|locations?|our-services|services)$/i;

// Machine files, not pages. A real roofing site returned "Page Sitemap.Xml",
// "Post Sitemap2.Xml" and "Category Sitemap.Xml" as services, which would
// have gone onto the client's rebuilt homepage as things they sell.
const NOT_A_PAGE = /\.(xml|json|txt|rss|atom|csv|pdf|gz|php|xsl)$/i;
const FEED_PATH = /(sitemap|feed|rss|wp-json|wp-content|wp-admin|xmlrpc|robots)/i;

// Article URLs. A blog post about a service is not a service, and its title
// reads as one — "Roof Repair Emergencies You Never Ignore" came through as
// a service on the same site.
const ARTICLE_PATH = /\/(blog|news|articles?|posts?|insights?|resources|guides?|tips)\//i;
const DATED_PATH = /\/(19|20)\d{2}\/(\d{1,2})\//;

/** Whether a URL is a real page that could plausibly be a service. */
function isCandidatePage(url: string): boolean {
  if (NOT_A_PAGE.test(url) || FEED_PATH.test(url)) return false;
  if (ARTICLE_PATH.test(url) || DATED_PATH.test(url)) return false;
  return true;
}

// A service is a noun phrase. A headline is a sentence, and article titles
// slugify into long multi-word paths that read like one.
function looksLikeAnArticle(slug: string): boolean {
  const words = slug.split("-").filter(Boolean);
  if (words.length > 5) return true;
  return /\b(you|your|we|our|how|why|what|when|should|never|best|top|guide|tips|vs|and-how)\b/i.test(slug);
}

function slugToName(slug: string): string {
  return slug
    .replace(/\.(html?|php|aspx?)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function lastSegment(url: string): string | null {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "");
    const segments = path.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? null;
  } catch {
    return null;
  }
}

export interface UrlDerivedBrief {
  services: string[];
  areas: string[];
  /** Real pages worth scraping if the operator asks for depth. */
  notablePages: string[];
}

/**
 * Read services and areas off a site's URL list.
 *
 * Deliberately conservative: a name that cannot be confidently read as a
 * service is left out, because a wrong service name reaches the client's
 * homepage as a claim about their business.
 */
export function deriveBriefFromUrls(urls: string[]): UrlDerivedBrief {
  const services = new Map<string, string>();
  const areas = new Map<string, string>();
  const notable: string[] = [];

  for (const url of urls) {
    if (!isCandidatePage(url)) continue;
    const segment = lastSegment(url);
    if (!segment) continue;

    const slug = segment.toLowerCase().replace(/\.(html?|php|aspx?)$/i, "");
    if (BOILERPLATE.test(slug)) continue;
    if (looksLikeAnArticle(slug)) continue;
    // A slug this long is an article, and one this short is a code.
    if (slug.length < 3 || slug.length > 60) continue;
    if (/^\d+$/.test(slug)) continue;

    if (SERVICE_PATH.test(url)) {
      services.set(slug, slugToName(slug));
      if (notable.length < 6) notable.push(url);
      continue;
    }

    if (AREA_PATH.test(url)) {
      areas.set(slug, slugToName(slug));
      continue;
    }
  }

  // Sites without a /services/ prefix put service pages at the root. Only
  // trust those when the site has no explicit services section at all,
  // otherwise every top-level page becomes a "service".
  if (services.size === 0) {
    for (const url of urls) {
      if (!isCandidatePage(url)) continue;
      const segment = lastSegment(url);
      if (!segment) continue;
      const slug = segment.toLowerCase().replace(/\.(html?|php|aspx?)$/i, "");
      if (BOILERPLATE.test(slug) || slug.length < 3 || slug.length > 50) continue;
      if (looksLikeAnArticle(slug)) continue;

      try {
        const depth = new URL(url).pathname.split("/").filter(Boolean).length;
        if (depth !== 1) continue;
      } catch {
        continue;
      }

      services.set(slug, slugToName(slug));
      if (notable.length < 6) notable.push(url);
    }
  }

  return {
    services: Array.from(services.values()).slice(0, 10),
    areas: Array.from(areas.values()).slice(0, 15),
    notablePages: notable,
  };
}
