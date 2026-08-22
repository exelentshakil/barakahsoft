import { callOpenAI, bestModelChain } from "@/lib/openai-client";
import type { SiteBrief } from "@/lib/generate-bespoke-site";
import type { DesignDna } from "@/lib/design-dna";
import type { MediaPlan } from "@/lib/media/plan-media";
import {
  STANCE,
  SPACE_STANDARD,
  PSYCHOLOGY_STANDARD,
  HYGIENE_STANDARD,
  INTERACTION_CONTRACT,
  truthStandard,
  PAGE_SHAPE,
} from "@/lib/generate/standard";

export { INTERACTION_CONTRACT };

// Pass one: the page itself — structure and words together.
//
// Copy and layout are decided in the same call because they are the same
// decision: a headline's length constrains a hero, and a section's shape
// determines how much can be said in it. Splitting them, which this
// codebase tried, produced strong copy arranged badly.
//
// What changed here is that the model now names its own classes. It used to
// compose from a fixed vocabulary, which capped layout quality at whatever
// had been pre-built — content came out good and the arrangement did not.
// The stylesheet pass writes rules for exactly these class names, so the
// old failure mode of a class resolving to nothing cannot occur.

function factsBlock(brief: SiteBrief): string {
  const lines: string[] = [
    `Business: ${brief.businessName}`,
    `Trade: ${brief.industry}`,
    `Serves: ${brief.city}${brief.areas.length > 0 ? ` — ${brief.areas.slice(0, 10).join(", ")}` : ""}`,
  ];
  if (brief.founder) lines.push(`Owner: ${brief.founder}`);
  if (brief.phone) lines.push(`Phone (verbatim, in tel: links): ${brief.phone}`);
  if (brief.email) lines.push(`Email: ${brief.email}`);

  lines.push(
    brief.rating && brief.reviewCount
      ? `Google: ${brief.rating} stars from ${brief.reviewCount} reviews — verified, lead with it`
      : `NO verified rating exists. Never mention ratings, stars or review counts.`
  );
  lines.push(
    brief.licensedInsured
      ? `They state on their own site that they are licensed and insured — you may say so.`
      : `No licensing or insurance claim exists. Never claim licensed, insured, bonded or certified.`
  );
  lines.push(`Their real services:\n${brief.services.map((s) => `  - ${s}`).join("\n")}`);

  lines.push(
    brief.reviews.length > 0
      ? `Real reviews — quote verbatim or not at all:\n${brief.reviews.map((r) => `  "${r.text.slice(0, 260)}" — ${r.author}`).join("\n")}`
      : `No review text available. Include no testimonials of any kind.`
  );

  lines.push(`\nScraped from their current site:\n${brief.factsDigest.slice(0, 5000)}`);
  return lines.join("\n");
}

export interface StructureResult {
  html: string;
  /** What the model intended, so the stylesheet pass builds the same page. */
  designNotes: string;
}

export async function generateStructure(
  brief: SiteBrief,
  dna: DesignDna,
  media: MediaPlan,
  knownPaths: string[],
  previousFailures?: string
): Promise<StructureResult | null> {
  const prompt = `${STANCE}

Write the complete homepage for a real ${brief.industry} business in ${brief.city}.

The owner opens this page and decides in about four seconds whether you are better than whoever built their current site. Make committed decisions — a timid page of evenly-spaced identical cards is the failure to avoid.

This is pass one of two. You write the HTML and the words. A second pass writes a bespoke stylesheet for exactly the class names you choose, so name them clearly and describe your intent.

═══ THE BUSINESS — every claim comes from here and nowhere else ═══
${factsBlock(brief)}

═══ WHAT THIS PAGE IS FOR ═══
Primary action: ${brief.intent.primaryLabel}
${brief.intent.guidance}
${brief.intent.secondaryLabel ? `Secondary action: ${brief.intent.secondaryLabel}` : ""}

${
  brief.painInstructions.length > 0
    ? `═══ WHAT THE OWNER SAID IS WRONG — the page must visibly fix each ═══\n${brief.painInstructions.map((p) => `- ${p}`).join("\n")}`
    : ""
}

═══ DESIGN DIRECTION — from a best-in-class site in this trade ═══
Mood: ${dna.mood} · Rhythm: ${dna.layout.sectionRhythm} · Hero: ${dna.layout.heroTreatment}
Services as: ${dna.layout.serviceLayout} · Proof as: ${dna.layout.proofStyle}
Geometry: ${dna.geometry.radius} corners, ${dna.geometry.elevation} elevation
Type: ${dna.typography.displayFamily} display, ${dna.typography.bodyFamily} body, ${dna.typography.scale} scale
Build these motifs rather than gesturing at them: ${dna.motifs.join("; ") || "none specified"}
Why the reference reads premium: ${dna.rationale}

═══ IMAGES — only these URLs. Any other src is deleted ═══
${
  media.length > 0
    ? media.map((m) => `[${m.slot}] ${m.url}\n    shows: ${m.caption}`).join("\n")
    : "None. Build with type, colour and layout alone, and make that a deliberate editorial choice rather than a page with holes in it. Output no <img> tags."
}

═══ LINKS THAT EXIST ═══
${knownPaths.map((p) => `  ${p}`).join("\n")}
Anything else becomes an on-page anchor. Give each service block an id of its slug.
${brief.phone ? `Phone links: tel:${brief.phone.replace(/[^\d+]/g, "")}` : ""}

═══ HOW TO WRITE THE MARKUP ═══
${HYGIENE_STANDARD}

The stylesheet pass builds to this geometry, so structure the markup so it is possible:
${SPACE_STANDARD}

${PSYCHOLOGY_STANDARD}

Name classes descriptively and consistently, block-then-element:
  hero, hero__inner, hero__title, hero__actions
  services, services__grid, service-card, service-card__title
The stylesheet pass styles exactly what you name, so be consistent — do not invent three names for the same kind of thing.


${INTERACTION_CONTRACT}

${truthStandard(brief.rating, brief.reviewCount)}

═══ WHAT THE PAGE MUST DO ═══
${PAGE_SHAPE}
${
  previousFailures
    ? `\n═══ A PREVIOUS ATTEMPT WAS REJECTED ═══\nThis is a fresh build, not a repair. Just make sure none of these are true of yours:\n${previousFailures}\n`
    : ""
}
Reply in EXACTLY this format:
DESIGN NOTES: three or four sentences describing the visual system you intend — the hero treatment, how sections alternate, where the accent colour lands, what carries the eye down the page. The stylesheet pass reads this.
---PAGE---
<the HTML body fragment, no markdown fences>`;

  const raw = await callOpenAI(prompt, {
    maxTokens: 60000,
    temperature: 0.85,
    modelChain: bestModelChain(),
    system:
      "You are a senior web designer and conversion copywriter writing production HTML. You never invent facts about a business, and you name classes consistently because someone else is writing the CSS.",
  });

  if (!raw) return null;

  const trimmed = raw.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const match = trimmed.match(/^DESIGN NOTES:\s*([\s\S]*?)\n+---PAGE---\s*\n/i);
  const designNotes = match ? match[1].trim() : "";
  const html = match ? trimmed.slice(match[0].length).trim() : trimmed;

  if (!html || html.replace(/<[^>]+>/g, "").trim().length < 400) return null;

  return { html, designNotes };
}
