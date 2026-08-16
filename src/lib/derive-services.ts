import { slugifyText } from "@/lib/slug";
import type { PageInventory } from "@/lib/scrape/extract-text";

// Derives service candidates from the business's own real nav labels
// (grounding rule: never invent a service that isn't in facts). This is a
// deliberately conservative heuristic over real NLP service-extraction —
// a nav link is strong evidence the business itself considers that a
// distinct offering worth its own page, which is exactly what a mega-menu
// row needs. Case 0 (k-teamkarting.com) validates this directly: its real
// nav (Corporate Events, Team Building, Stag & Hen, Kids) becomes the
// service list verbatim.
const STOPLIST = [
  "home",
  "about",
  "about us",
  "contact",
  "contact us",
  "gallery",
  "booking",
  "book now",
  "blog",
  "news",
  "faq",
  "faqs",
  "privacy",
  "privacy policy",
  "terms",
  "terms of service",
  "reviews",
  "testimonials",
  "login",
  "sign in",
];

// Real bug found against a live lead (cityroofrepairnyc.com): its nav has
// the site's own logo/home link, six social-platform icons, a tel:/mailto:
// link, and a Google Maps address link *before* its real services in
// document order -- every one of those has real letters in its visible
// text ("Facebook", "contact@cityroofrepairnyc.com"), so the old
// text-only STOPLIST + "has letters" check let all of them through as
// "services". Filtering by what a link actually points to (href) is far
// more robust than trying to enumerate every possible junk label in every
// language: a mailto:/tel: link is never a service regardless of its text,
// and neither is a link to a known social/maps platform.
const JUNK_HREF_SUBSTRINGS = [
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "pinterest.com",
  "yelp.com",
  "x.com/",
  "twitter.com",
  "linkedin.com",
  "tiktok.com",
  "google.com/maps",
  "maps.google.com",
  "goo.gl/maps",
  "wa.me",
  "whatsapp.com",
];

// A link back to the site's own homepage (the logo link) -- bare domain
// root, optionally with a trailing slash, no further path.
const HOMEPAGE_HREF = /^https?:\/\/(www\.)?[^/]+\/?$/i;

function isJunkNavLink(link: { text: string; href: string }): boolean {
  const href = link.href.trim().toLowerCase();
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return true;
  if (JUNK_HREF_SUBSTRINGS.some((d) => href.includes(d))) return true;
  if (HOMEPAGE_HREF.test(href)) return true;
  return false;
}

export const MAX_SERVICES = 15;

// A real nav-derived service list is usually several items -- below this,
// treat the nav signal as too thin to trust alone and fall through to the
// body-content list-item heuristic below. Confirmed real case
// (danielsroofingnyc.com): 14 real services, zero survive as nav links
// (they're plain <li> text, no <a> at all) -- only a junk tel: link came
// through pre-fix, producing exactly 1 wrong "service".
const MIN_NAV_SERVICES = 3;

// v3 -- enrich-generate.ts's fast homepage pass caps this to a handful of
// top services (FAST_PASS_SERVICE_CAP); enrich-expand.ts calls this again
// uncapped once a lead is qualified, so the same real nav-derived ordering
// just gets more of the list rather than a second, different derivation.
export function deriveServiceCandidates(pages: PageInventory[], cap: number = MAX_SERVICES): { name: string; slug: string }[] {
  const seen = new Map<string, string>();

  for (const page of pages) {
    for (const link of page.navLinks) {
      const clean = link.text.trim();
      if (!clean || clean.length > 60) continue;
      if (!/[a-zA-Z]/.test(clean)) continue;
      if (isJunkNavLink(link)) continue;
      if (STOPLIST.includes(clean.toLowerCase())) continue;
      const slug = slugifyText(clean);
      if (!slug || seen.has(slug)) continue;
      seen.set(slug, clean);
    }
  }

  // Fallback: some real sites (single-page Divi/WordPress sites) list real
  // services as plain <li> text with no <a> wrapper -- invisible to the
  // nav-link path above. Only kicks in when nav-derived candidates are too
  // thin to be a real service list on their own, so a site with a real,
  // rich nav never gets these lower-confidence candidates mixed in.
  if (seen.size < MIN_NAV_SERVICES) {
    for (const page of pages) {
      for (const candidate of page.listItemCandidates) {
        const clean = candidate.trim();
        if (STOPLIST.includes(clean.toLowerCase())) continue;
        const slug = slugifyText(clean);
        if (!slug || seen.has(slug)) continue;
        seen.set(slug, clean);
      }
    }
  }

  return Array.from(seen.entries())
    .slice(0, cap)
    .map(([slug, name]) => ({ name, slug }));
}
