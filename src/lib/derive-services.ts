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

export const MAX_SERVICES = 15;

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
      // Real bug found in production data: a tel: nav link's visible text
      // ("(917) 440-1800") was slipping through as a "service" once the
      // uncapped v3 expansion pass reached far enough into the nav list. A
      // real service name always has letters in it.
      if (!/[a-zA-Z]/.test(clean)) continue;
      if (STOPLIST.includes(clean.toLowerCase())) continue;
      const slug = slugifyText(clean);
      if (!slug || seen.has(slug)) continue;
      seen.set(slug, clean);
    }
  }

  return Array.from(seen.entries())
    .slice(0, cap)
    .map(([slug, name]) => ({ name, slug }));
}
