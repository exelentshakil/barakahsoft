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

const MAX_SERVICES = 8;

export function deriveServiceCandidates(pages: PageInventory[]): { name: string; slug: string }[] {
  const seen = new Map<string, string>();

  for (const page of pages) {
    for (const link of page.navLinks) {
      const clean = link.text.trim();
      if (!clean || clean.length > 60) continue;
      if (STOPLIST.includes(clean.toLowerCase())) continue;
      const slug = slugifyText(clean);
      if (!slug || seen.has(slug)) continue;
      seen.set(slug, clean);
    }
  }

  return Array.from(seen.entries())
    .slice(0, MAX_SERVICES)
    .map(([slug, name]) => ({ name, slug }));
}
