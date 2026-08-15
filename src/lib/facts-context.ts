import type { Facts } from "@/lib/ai";
import type { PageInventory } from "@/lib/scrape/extract-text";

// Finds the scraped page most relevant to a generation slot (a service
// name/slug, "faq", or no hint at all for the homepage) by matching against
// real page url/title/headings/nav links — this is the actual content every
// generate_* prompt should be grounded in, not the old fixed whitelist of
// fact keys that don't exist in the real scrape output (differentiators,
// years_in_business, certifications, guarantee, service_area, price_range
// are never populated by scrapeBusiness).
export function findRelevantPage(facts: Facts, matchHint?: string | null): PageInventory | null {
  const pages = (facts.pages as PageInventory[] | undefined) ?? [];
  if (pages.length === 0) return null;
  if (!matchHint) return pages[0];

  const hint = matchHint.toLowerCase();
  let best: PageInventory | null = null;
  let bestScore = 0;

  for (const page of pages) {
    let score = 0;
    if (page.url.toLowerCase().includes(hint)) score += 3;
    if (page.title?.toLowerCase().includes(hint)) score += 2;
    if (page.headings.some((h) => h.toLowerCase().includes(hint))) score += 2;
    if (page.navLinks.some((l) => l.text.toLowerCase().includes(hint) || l.href.toLowerCase().includes(hint))) score += 1;
    if (score > bestScore) {
      best = page;
      bestScore = score;
    }
  }

  return best ?? pages[0];
}

const BASE_FACT_KEYS = ["business_name", "town", "rating", "review_count", "hours", "nap"];

// Real, always-populated fields (see scrapeBusiness in src/lib/scrape/index.ts)
// plus real content from the matched page and any existing on-site JSON-LD —
// the grounding source generate_* prompts were supposed to have all along.
export function buildRichContext(facts: Facts, opts: { relevantPage?: PageInventory | null; maxChars?: number } = {}): string {
  const maxChars = opts.maxChars ?? 2000;
  const lines: string[] = [];

  for (const key of BASE_FACT_KEYS) {
    const value = facts[key];
    if (value != null) lines.push(`${key}: ${JSON.stringify(value)}`);
  }

  const page = opts.relevantPage;
  if (page) {
    if (page.headings.length > 0) lines.push(`page_headings: ${JSON.stringify(page.headings.slice(0, 15))}`);
    if (page.bodyText) lines.push(`page_content: ${page.bodyText.slice(0, maxChars)}`);
  }

  const schema = facts.existing_schema;
  if (Array.isArray(schema) && schema.length > 0) {
    lines.push(`existing_site_schema: ${JSON.stringify(schema).slice(0, 1000)}`);
  }

  return lines.join("\n");
}
