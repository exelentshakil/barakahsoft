import { callSmartModel } from "@/lib/generate/model";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { PageDesignSchema, LAYOUT_FAMILIES, MEDIA_POSITIONS, GROUNDS, type PageDesign } from "@/lib/generate/v2/page-design";
import type { DesignDna } from "@/lib/design-dna";
import type { Entity } from "@/lib/extract-entities";
import type { SiteBrief } from "@/lib/generate-bespoke-site";
import type { ComposedSection } from "@/lib/generate/v2/compose";

// One model call that designs the whole page.
//
// It is given everything already paid for — the client's verified facts, the
// sections those facts can fill, and the reference site's own structure and
// visual direction — and it decides how each section is built.
//
// It is NOT given colours, pixel values or markup, and it cannot return any.
// Every axis is a role the system resolves, which is what makes this safe to
// hand over: the failure mode of a model writing CSS is an unreadable page,
// and the failure mode of a model choosing "ink ground, split layout, media
// left" is a page that looks different from the one before it.

function entitySummary(entities: Entity[]): string {
  const counts = new Map<string, number>();
  for (const entity of entities) counts.set(entity.kind, (counts.get(entity.kind) ?? 0) + 1);
  if (counts.size === 0) return "nothing specific was read from their site";
  return [...counts.entries()].map(([kind, n]) => `${n} ${kind}`).join(", ");
}

function prompt(args: {
  brief: SiteBrief;
  sections: ComposedSection[];
  entities: Entity[];
  dna: DesignDna | null;
  photoCount: number;
}): string {
  const { brief, sections, entities, dna, photoCount } = args;

  return `Design the homepage for one real local business. You are deciding LAYOUT ONLY — the shape of every
section, the header and the footer. You are not writing copy, colours or markup; those are handled.

THE BUSINESS
- ${brief.businessName}, a ${brief.industry} in ${brief.city}
- Its customers are ${brief.vertical.nouns.customer}s and what it sells it calls ${brief.vertical.nouns.offeringPlural}
- What it actually has, read off its own site: ${entitySummary(entities)}
- Real photographs available for this page: ${photoCount}
- What a visitor is meant to do: ${brief.intent.primaryLabel}

THE SECTIONS THIS PAGE WILL HAVE, in this order. Design each one.
${sections.map((section, index) => `${index + 1}. id="${section.id}" — this page calls it "${section.kind}"${section.purpose ? `: ${section.purpose}` : ""}`).join("\n")}

${
  dna
    ? `THE VISUAL DIRECTION, taken from ${dna.sourceName}, a strong site in this industry:
- mood: ${dna.mood}
- type: ${dna.typography.displayFamily} display, ${dna.typography.scale} scale, ${dna.typography.headingCase} case
- geometry: ${dna.geometry.radius} corners, ${dna.geometry.elevation} elevation
- rhythm: ${dna.layout.sectionRhythm}, imagery ${dna.layout.imageDensity}
- devices that site uses: ${dna.motifs.join("; ") || "none noted"}
Design in that spirit. Do not copy it section for section — it is a different company.`
    : `No reference site was researched, so design from the business itself.`
}

Return ONLY JSON:
{"sections":[{"id":"","kind":"","layout":"","media":"","columns":3,"align":"left","ground":"surface","density":"regular","divider":"none","emphasis":"none","mediaShape":"wide"}],
 "chrome":{"style":"","ground":"ink","action":"button"},
 "footer":{"style":"","ground":"ink"},
 "rationale":""}

One entry per section above, same ids, same order.

  layout      ${LAYOUT_FAMILIES.join(" | ")}
  media       ${MEDIA_POSITIONS.join(" | ")}
  columns     1-4, only meaningful for grid, rows, rail, mosaic
  align       left | center
  ground      ${GROUNDS.join(" | ")}
  density     tight | regular | airy
  divider     none | rule | diagonal | curve | notch
  emphasis    none | numbered | oversized-index | accent-rule | eyebrow-slab
  mediaShape  wide | square | portrait | arch | circle | bleed
  chrome.style   utility-bar | floating-glass | stacked-brand | side-rail | minimal
  chrome.ground  ink | surface | brand | transparent
  chrome.action  button | phone | both | none
  footer.style   cta-slab | map-anchored | big-type | split-panel | columns
  footer.ground  ink | surface | brand

HOW TO DESIGN THIS, and these rules are what separate a real page from a template:

- VARY THE GROUND. A page where every section sits on "surface" is a wall of the same colour. Alternate
  deliberately: two or three sections on "ink" or "brand" placed where the page needs a breath or a push,
  the rest on surface and alt. Never put three consecutive sections on the same ground.
- VARY THE LAYOUT. Do not use "grid" for everything that has more than one item. A team of five people, a
  list of classes and a set of prices are three different kinds of content and should not be three
  identical card grids. Reach for rows, rail, feature and mosaic.
- MEDIA FOLLOWS SUPPLY. There are ${photoCount} real photographs. If that number is low, most sections must
  use media "none" — an empty frame is worse than no frame. If it is high, use them: background, inset,
  alternating left and right down the page.
- ALTERNATE SIDES. Consecutive "split" sections must not both put media on the same side.
- EMPHASIS IS INFORMATION, not decoration. "numbered" only where the content is genuinely a sequence — a
  process, steps, an order of events. Never number a list of services or people.
- THE HERO IS THE PAGE'S FIRST IMPRESSION. Give it the boldest treatment the facts support.
- The FIRST section after the hero should not repeat the hero's shape.
- rationale: one sentence on the through-line of this page's design.`;
}

/**
 * Design the page, or return null so the caller keeps its existing behaviour.
 *
 * A failure here must cost a less interesting page, never a broken one — so
 * everything that can go wrong returns null and the deterministic path runs.
 */
export async function designPage(args: {
  brief: SiteBrief;
  sections: ComposedSection[];
  entities: Entity[];
  dna: DesignDna | null;
  photoCount: number;
}): Promise<PageDesign | null> {
  let raw: string | null = null;
  try {
    raw = await callSmartModel(prompt(args), {
      system:
        "You are an art director laying out one bespoke homepage. You choose structure only, from a fixed vocabulary, and you return strict JSON.",
      maxTokens: 4000,
      // Warm enough that two businesses in one trade genuinely diverge, cold
      // enough that the rules above are followed.
      temperature: 0.85,
    });
  } catch (error) {
    console.warn("[page-design] design call failed", error);
    return null;
  }
  if (!raw) return null;

  const parsed = PageDesignSchema.safeParse(parseJsonResponse(raw));
  if (!parsed.success) {
    console.warn("[page-design] unexpected shape", parsed.error.issues.slice(0, 4));
    return null;
  }

  // The model designed sections; the composer decided which exist. Where they
  // disagree the composer wins, because its list is the one backed by facts.
  const byId = new Map(parsed.data.sections.map((section) => [section.id, section]));
  const aligned = args.sections.map((section) => byId.get(section.id)).filter(Boolean);
  if (aligned.length < Math.min(5, args.sections.length)) {
    console.warn(`[page-design] only ${aligned.length}/${args.sections.length} sections were designed; ignoring`);
    return null;
  }

  return { ...parsed.data, sections: aligned as PageDesign["sections"] };
}
