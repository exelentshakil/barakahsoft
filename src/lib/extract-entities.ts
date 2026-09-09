import { z } from "zod";
import { callSmartModel } from "@/lib/generate/model";
import { parseJsonResponse } from "@/lib/parse-json-response";

// The specific things a business actually has.
//
// `classifyBusiness` extracts `services: string[]` and `areas: string[]`, and
// that is the whole of what the generator knows about a client. No price, no
// membership tier, no class name, no coach, no amenity, no policy — though
// `facts.markdown` and `facts.pages` contain all of it, already paid for.
//
// That is why a page can be generic even when everything else works: the
// structure came from one vertical's section list, and the facts behind it
// were a flat list of nouns. A competitor's page for the same gym names ten
// real classes and six membership tiers because it read the gym's own site.
//
// So entities are the client's half of the composition. The reference site's
// blueprint says a gym page wants membership tiers; these say whether THIS gym
// has any. A blueprint section whose needs are unmet is dropped rather than
// filled with invention — which is the opposite discipline to pad-brief-lists,
// deliberately.

export const EntitySchema = z.object({
  /**
   * Free string, matching the blueprint's `needs` vocabulary: pricing-tier,
   * class, person, location, amenity, policy, certification, differentiator,
   * opening-hours, photo. Not an enum, for the same reason `blueprint.kind`
   * is not one.
   */
  kind: z.string().min(2).max(40),
  /** What it is called, in the business's own words. */
  label: z.string().min(2).max(120),
  detail: z.string().max(300).default(""),
  /** Verbatim as written, currency symbol and all. "£120", "from $45". */
  price: z.string().max(40).default(""),
  /** "month", "session", "class", "hour". Empty for one-off prices. */
  period: z.string().max(30).default(""),
  /** Bullet points belonging to this entity — what a tier includes, say. */
  attributes: z.array(z.string().max(140)).max(10).default([]),
  /**
   * The page this came from.
   *
   * Required, and checked against the pages actually scraped. An entity
   * nobody can point at a source for is the exact failure this module exists
   * to prevent: it would put an invented price on a client's live website.
   */
  source: z.string().min(4).max(500),
});

export type Entity = z.infer<typeof EntitySchema>;

const ResponseSchema = z.object({ entities: z.array(EntitySchema).max(80) });

interface ScrapedPage {
  url: string;
  title: string | null;
  bodyText: string;
}

/** Digits in a price, so "£120.00" and "120" compare equal. */
function digits(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

/**
 * Keep only what the scrape can actually back.
 *
 * Two checks, both cheap and both about the same thing — a fact on a client's
 * live site must have come from the client:
 *
 *  1. The source must be a page we really fetched. A plausible-looking URL the
 *     model composed is not a source.
 *  2. If the entity carries a price, those digits must appear in that page's
 *     text. Prices are the one field where a hallucination is not a cosmetic
 *     error — it is a number a customer will hold the business to.
 */
export function verifyEntities(entities: Entity[], pages: ScrapedPage[]): { kept: Entity[]; dropped: string[] } {
  const byUrl = new Map<string, string>();
  for (const page of pages) {
    if (!page?.url) continue;
    byUrl.set(page.url.replace(/\/+$/, ""), `${page.title ?? ""}\n${page.bodyText ?? ""}`);
  }

  const kept: Entity[] = [];
  const dropped: string[] = [];
  const seen = new Set<string>();

  for (const entity of entities) {
    const url = entity.source.replace(/\/+$/, "");
    const text = byUrl.get(url);
    if (text === undefined) {
      dropped.push(`${entity.kind}:${entity.label} — source ${entity.source} was never scraped`);
      continue;
    }
    if (entity.price && !text.includes(digits(entity.price)) && digits(entity.price).length > 0) {
      dropped.push(`${entity.kind}:${entity.label} — price ${entity.price} is not on ${entity.source}`);
      continue;
    }
    const key = `${entity.kind}|${entity.label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(entity);
  }

  return { kept, dropped };
}

function corpus(pages: ScrapedPage[], markdown: string): string {
  if (pages.length === 0) return markdown.slice(0, 24_000);
  // Whole pages, labelled with their URL, because the model has to name the
  // source per entity and cannot do that from an undifferentiated blob.
  let budget = 40_000;
  const chunks: string[] = [];
  for (const page of pages) {
    if (budget <= 0) break;
    const body = (page.bodyText ?? "").slice(0, Math.min(9_000, budget));
    budget -= body.length;
    chunks.push(`=== PAGE: ${page.url}\n${page.title ? `TITLE: ${page.title}\n` : ""}${body}`);
  }
  return chunks.join("\n\n");
}

/**
 * Read the client's own site for the specific things it has.
 *
 * One model call over content already paid for, run beside classifyBusiness at
 * analysis time so the operator sees the result on the brief screen before
 * anything is generated.
 */
export async function extractEntities(facts: Record<string, unknown>): Promise<{
  entities: Entity[];
  dropped: string[];
}> {
  const pages = (facts.pages as ScrapedPage[] | undefined) ?? [];
  const markdown = typeof facts.markdown === "string" ? facts.markdown : "";
  const sourceUrl = typeof facts.source_url === "string" ? facts.source_url : "";
  const body = corpus(pages, markdown);
  if (body.trim().length < 200) return { entities: [], dropped: [] };

  const prompt = `Below is the real content of a local business's own website. Pull out the SPECIFIC things this business has, so a new website can be built for them out of their own facts instead of generic filler.

${body}

Return ONLY JSON:
{ "entities": [ { "kind": "...", "label": "...", "detail": "...", "price": "...", "period": "...", "attributes": ["..."], "source": "the exact PAGE url above that this came from" } ] }

kind is a short singular noun naming what sort of thing this is. Use whichever of these fit, and invent one only when none does:
  pricing-tier   a package, plan or membership with a price or a name
  class          a scheduled class, session or course they run
  offering       a service, treatment, dish or product they sell
  person         a named member of staff, with their role in "detail"
  location       a branch, studio or premises they operate
  amenity        a facility on site: parking, changing rooms, free wifi
  certification  an accreditation, licence, award or membership body
  policy         a rule a customer needs to know: cancellations, deposits, guarantees
  opening-hours  a day or range of days and its hours
  differentiator a specific claim about how they are different that is stated on the site

RULES — these matter more than completeness:
- Every entity must come from the text above, and "source" must be one of the PAGE urls exactly as written. Anything you cannot point at a page for must be left out.
- Copy prices exactly as written, symbol and all: "£120", "from $45", "45.00". Never convert, round, infer or average. If a price is not stated, leave it "".
- Do not invent, do not complete a pattern, do not fill a gap. Six tiers listed means six entities, not eight.
- "label" is their wording, not yours. If a package is called "BRONZE package", that is the label.
- attributes are the bullet points that belong to that entity — what a tier includes, what a class covers.
- Skip navigation labels, cookie notices, page titles and marketing slogans. These are things, not words.
- 60 entities is plenty. Depth on what they actually sell beats breadth.
${sourceUrl ? `\nThe business's own site is ${sourceUrl}.` : ""}`;

  let raw: string | null = null;
  try {
    raw = await callSmartModel(prompt, {
      system:
        "You extract structured facts from a business's own website. You never invent a fact, and you cite the page every fact came from.",
      maxTokens: 8000,
      temperature: 0.1,
    });
  } catch (error) {
    console.warn("[entities] extraction call failed", error);
    return { entities: [], dropped: [] };
  }
  if (!raw) return { entities: [], dropped: [] };

  const parsed = ResponseSchema.safeParse(parseJsonResponse(raw));
  if (!parsed.success) {
    console.warn("[entities] unexpected shape", parsed.error.issues.slice(0, 3));
    return { entities: [], dropped: [] };
  }

  const { kept, dropped } = verifyEntities(parsed.data.entities, pages);
  if (dropped.length > 0) {
    console.warn(`[entities] dropped ${dropped.length} unsourced or unverifiable: ${dropped.slice(0, 5).join(" | ")}`);
  }
  console.log(`[entities] kept ${kept.length} of ${parsed.data.entities.length}`);
  return { entities: kept, dropped };
}

/** What kinds exist, for matching a blueprint section's `needs`. */
export function entityKinds(entities: Entity[]): Set<string> {
  return new Set(entities.map((entity) => entity.kind.toLowerCase()));
}
