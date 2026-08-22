import { callOpenAI } from "@/lib/openai-client";
import { sanitizeBespokeHtml } from "@/lib/sanitize-generated-html";
import { VOCABULARY_REFERENCE } from "@/lib/generate-bespoke-site";
import type { DesignDna } from "@/lib/design-dna";
import type { CopyPlan } from "@/lib/generate-copy-plan";
import type { MediaPlan } from "@/lib/media/plan-media";
import type { PageSection } from "@/lib/page-sections";
import type { SiteBrief } from "@/lib/generate-bespoke-site";

// Section-level repair and authoring.
//
// This is what makes a weak page fixable instead of restartable. Each call
// rewrites ONE section against a plain-English instruction, with the rest of
// the page supplied only as context — so the operator's approved work is
// structurally out of reach, not merely asked to be left alone.
//
// It is also the reason the refinement loop can live in the admin rather
// than in Claude Code: the person fixing a hero should not need to know what
// HTML is.

interface SectionContext {
  brief: SiteBrief;
  copy: CopyPlan;
  dna: DesignDna;
  media: MediaPlan;
  sections: PageSection[];
}

function pageOutline(sections: PageSection[], targetId?: string): string {
  return sections
    .map((s, i) => {
      const marker = s.id === targetId ? "  <-- THE SECTION YOU ARE WRITING" : s.locked ? "  (approved, untouchable)" : "";
      return `  ${i + 1}. ${s.label}${marker}`;
    })
    .join("\n");
}

function factsBlock(brief: SiteBrief): string {
  return `THE FACTS — the only permitted source of claims. Never state a price, a year founded, a certification, a guarantee, a rating or a testimonial that is not here:
  Business: ${brief.businessName}${brief.founder ? `, owner ${brief.founder}` : ""}
  Trade: ${brief.industry}
  Serves: ${brief.city}${brief.areas.length > 0 ? ` and ${brief.areas.slice(0, 10).join(", ")}` : ""}
  ${brief.phone ? `Phone: ${brief.phone}` : "No phone number available"}
  ${brief.rating && brief.reviewCount ? `Google: ${brief.rating} stars from ${brief.reviewCount} reviews` : "No verified rating — never mention ratings or reviews"}
  ${brief.licensedInsured ? "States it is licensed and insured on its own site" : "No licensing or insurance claim exists — never claim it"}
  Services: ${brief.services.join(" | ")}

${brief.factsDigest.slice(0, 2500)}`;
}

function mediaBlock(media: MediaPlan): string {
  if (media.length === 0) return "IMAGES: none available. Do not output any <img> tag.";
  return `IMAGES — only these exact URLs may appear in an <img src>. Anything else is deleted:
${media.map((m) => `  ${m.url}\n     shows: ${m.caption}`).join("\n")}`;
}

function designBlock(dna: DesignDna): string {
  return `DESIGN DIRECTION — the rest of the page follows this and so must your section:
  Mood: ${dna.mood} · Rhythm: ${dna.layout.sectionRhythm} · Geometry: ${dna.geometry.radius} corners, ${dna.geometry.elevation} elevation
  Signature motifs: ${dna.motifs.join("; ") || "none"}`;
}

const OUTPUT_RULE = `Reply with the HTML for this ONE section only — a single top-level <section> element, no markdown fences, no commentary, no <header>, no <nav>, no <footer>, no <form>.`;

function clean(raw: string | null): string | null {
  if (!raw) return null;
  const stripped = raw.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const sanitized = sanitizeBespokeHtml(stripped);
  return sanitized.replace(/<[^>]+>/g, "").trim().length < 40 ? null : sanitized;
}

/**
 * Rewrite one section.
 *
 * The instruction is optional: with none, this is "this section is weak, do
 * it better", which is the most common case when a page comes out uneven.
 */
export async function regenerateSection(
  ctx: SectionContext,
  target: PageSection,
  instruction?: string
): Promise<string | null> {
  const raw = await callOpenAI(
    `You are revising ONE section of a ${ctx.brief.industry} homepage that is already built. Everything else on the page stays exactly as it is — you are not rewriting the page.

WHERE THIS SECTION SITS:
${pageOutline(ctx.sections, target.id)}

THIS SECTION IS: ${target.label}

ITS CURRENT MARKUP:
${target.html}

${instruction ? `WHAT TO CHANGE — follow this exactly:\n${instruction}` : `NO SPECIFIC INSTRUCTION WAS GIVEN. This section is not good enough. Make it genuinely better: stronger visual composition, more confident use of surface and space, and copy that a competitor could not paste onto their own site. Keep its purpose and its facts.`}

${designBlock(ctx.dna)}

${factsBlock(ctx.brief)}

${mediaBlock(ctx.media)}

${VOCABULARY_REFERENCE}

The section must sit visually alongside the sections above and below it — do not introduce a treatment that would make it look pasted in from a different site.

${OUTPUT_RULE}`,
    {
      maxTokens: 24000,
      temperature: 0.85,
      system:
        "You are a senior web designer revising a single section of an existing page. You never invent facts and you use only the class vocabulary you are given.",
    }
  );

  return clean(raw);
}

/** Author a brand-new section from a description, for a page that needs more. */
export async function createSection(
  ctx: SectionContext,
  description: string,
  insertAfterLabel: string | null
): Promise<string | null> {
  const raw = await callOpenAI(
    `You are adding ONE new section to a ${ctx.brief.industry} homepage that is already built.

THE PAGE AS IT STANDS:
${pageOutline(ctx.sections)}

The new section goes ${insertAfterLabel ? `directly after "${insertAfterLabel}"` : "at the end of the page"}.

WHAT IT SHOULD BE:
${description}

${designBlock(ctx.dna)}

${factsBlock(ctx.brief)}

${mediaBlock(ctx.media)}

${VOCABULARY_REFERENCE}

It must look like it belongs to this page — same design language, same voice — and it must not repeat what a section above already says.

${OUTPUT_RULE}`,
    {
      maxTokens: 24000,
      temperature: 0.85,
      system:
        "You are a senior web designer adding a section to an existing page. You never invent facts and you use only the class vocabulary you are given.",
    }
  );

  return clean(raw);
}
