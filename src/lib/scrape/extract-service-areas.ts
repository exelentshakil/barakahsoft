import type { PageInventory } from "@/lib/scrape/extract-text";

// v3 (Phase L) — real service-area names, extracted only from real text the
// business itself published (never invented, never guessed from a
// gazetteer). `payload.areas` was unconditionally empty before this — a
// documented gap, not a bug — because there was no real area signal being
// captured at all.
//
// Deliberately conservative, verified against real scraped data: a naive
// "grab any Title-Case phrase near a trigger word" pass produced garbage
// like "Learn More Property" and "Homeowners Protect" from a real site's
// "Who We Serve" (audience-segment) section, which happens to contain the
// literal words "we serve" but has nothing to do with geography. Two fixes
// from that finding: (1) only trigger on phrases that are unambiguously
// about location ("service area", "areas we serve", "neighborhoods we
// serve" — not the bare, ambiguous "we serve"), and (2) only accept
// candidates that appear in an actual comma-separated enumeration (real
// area lists read "Brooklyn, Queens, and the Bronx" — a lone Title-Case
// phrase floating in body copy is not that). Returning an empty list when
// a site's real area list turns out to only live in a JS map embed (also
// observed on a real site) is the correct, honest outcome, not a bug to
// route around.
const TRIGGER_PHRASES = [
  /(?:our |the )?service area(?:s)?\b/i,
  /areas we serve/i,
  /(?:neighborhoods|communities|towns|cities) we serve/i,
  /serving (?:the )?following (?:areas|communities|neighborhoods)/i,
  /proudly serving (?:the )?(?:areas|communities|neighborhoods|towns|cities) of/i,
];

// Requires a real enumeration: a Title Case phrase (1-2 words) followed by
// at least one more comma-separated Title Case phrase, optionally with
// "and" before the last item and/or a trailing state abbreviation. A lone
// capitalized word/phrase with no list structure around it does not match.
const AREA_LIST = /((?:[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)(?:,?\s+(?:and\s+)?[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?){1,7})/;

const GENERIC_WORDS = new Set([
  "We",
  "Our",
  "The",
  "Home",
  "About",
  "Contact",
  "Services",
  "Service",
  "Areas",
  "Area",
  "Reviews",
  "FAQ",
  "Call",
  "Get",
  "Book",
  "Learn",
  "More",
]);

function isPlausibleAreaName(name: string): boolean {
  if (name.length < 3 || name.length > 40) return false;
  return !name.split(/\s+/).some((w) => GENERIC_WORDS.has(w));
}

function extractCandidatesFromText(text: string): string[] {
  const found = new Set<string>();
  for (const trigger of TRIGGER_PHRASES) {
    const match = trigger.exec(text);
    if (!match) continue;
    // A tight window right after the trigger phrase -- where a real area
    // list actually lives, not the whole surrounding paragraph.
    const window = text.slice(match.index + match[0].length, match.index + match[0].length + 200);
    const listMatch = AREA_LIST.exec(window);
    if (!listMatch) continue;

    const names = listMatch[1]
      .split(/,|\band\b/i)
      .map((n) => n.trim())
      .filter(Boolean);
    for (const name of names) {
      if (isPlausibleAreaName(name)) found.add(name);
    }
  }
  return Array.from(found);
}

const MAX_AREAS = 12;

export function extractServiceAreas(pages: PageInventory[]): string[] {
  const seen = new Set<string>();
  for (const page of pages) {
    for (const name of extractCandidatesFromText(page.bodyText)) {
      seen.add(name);
    }
    if (seen.size >= MAX_AREAS) break;
  }
  return Array.from(seen).slice(0, MAX_AREAS);
}
