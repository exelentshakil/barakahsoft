import { callGemini, type GeminiImagePart } from "@/lib/gemini-client";
import { GENERIC_SLOP_PHRASES } from "@/lib/grounding";
import type { PageInventory } from "@/lib/scrape/extract-text";

// Real agentic loop applied to every substantive piece of generated copy —
// not a partial fix limited to a few section types. Bounded to exactly one
// critique/revise cycle (never unbounded looping): research -> draft ->
// critique -> revise-once. ~3 Gemini calls per section instead of 1.

// research pass — synthesizes across the top 2-3 topic-matching real pages
// (vs. a single truncated slice) into a compact fact digest before the
// draft prompt runs. Returns "" (not null) when nothing relevant exists so
// callers can just concatenate it into their prompt without a null check.
export async function researchDigest(pages: PageInventory[], topic: string): Promise<string> {
  if (pages.length === 0) return "";
  const combined = pages.map((p) => `PAGE: ${p.title ?? p.url}\n${p.bodyText.slice(0, 4000)}`).join("\n\n");
  const prompt = `From the real page content below, extract only the concrete facts relevant to "${topic}" as a compact bullet list — real numbers, real service details, real claims actually present. Do not write marketing copy, just extract facts. If nothing relevant exists, reply exactly "none".\n\n${combined.slice(0, 8000)}`;

  const result = await callGemini(prompt);
  return result && result.trim().toLowerCase() !== "none" ? result : "";
}

function critiquePrompt(draft: string, digest: string, constraintSummary: string): string {
  return `Review this draft against these criteria. Reply with the exact word "APPROVED" if it passes all of them, or specific revision notes if it doesn't:
1. Cites specific real details from the research below (not generic industry language)
2. Avoids these forbidden generic phrases: ${GENERIC_SLOP_PHRASES.join(", ")}
3. Reads like someone who actually read this business's real site wrote it, not a template
4. Meets this constraint: ${constraintSummary}

Research (real facts only):
${digest || "(none provided)"}

Draft:
${draft}`;
}

function revisePrompt(draft: string, critique: string, digest: string, constraintSummary: string, sentinel?: string): string {
  return `Rewrite this draft to address the feedback below. Stay grounded ONLY in the real research provided — never invent anything new.${
    sentinel ? ` If the feedback genuinely means there's nothing real to say, reply with the exact string ${sentinel} instead.` : ""
  } Constraint: ${constraintSummary}.

Original draft:
${draft}

Feedback:
${critique}

Research (real facts only):
${digest || "(none provided)"}

Reply with the revised text only, nothing else.`;
}

// draftPrompt is fully formed by the caller (it already embeds `digest` if
// it wants to) — this function only owns the critique/revise cycle so it
// works identically for prose (headline, service copy) and structured
// JSON-or-sentinel output (process steps, audience segments).
//
// v8 -- optional `images` (real reference screenshots) attached to the
// DRAFT call only, not critique/revise -- the critique pass is judging
// structure/grounding/quality of the text already produced, which doesn't
// need a second look at the images, and skipping it there keeps the
// cheaper text-only calls cheap.
export async function draftCritiqueRevise(
  draftPrompt: string,
  digest: string,
  constraintSummary: string,
  sentinel?: string,
  images?: GeminiImagePart[]
): Promise<string | null> {
  const draft = await callGemini(draftPrompt, undefined, images);
  if (!draft) return null;
  if (sentinel && draft.trim() === sentinel) return draft;

  const critique = await callGemini(critiquePrompt(draft, digest, constraintSummary));
  if (!critique || critique.trim().toUpperCase().startsWith("APPROVED")) return draft;

  const revised = await callGemini(revisePrompt(draft, critique, digest, constraintSummary, sentinel));
  return revised ?? draft;
}
