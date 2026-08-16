import { findRelevantPage, buildRichContext } from "@/lib/facts-context";
import { draftCritiqueRevise } from "@/lib/generate-with-critique";
import { validateGrounding } from "@/lib/grounding";
import { parseJsonResponse } from "@/lib/parse-json-response";
import type { Facts } from "@/lib/ai";
import type { FunnelPageSection } from "@/types/database";

export interface SectionEditResult {
  h2: string;
  body_content: string;
  groundingWarnings: string[];
}

// The AI-prompt dashboard editor's actual generation step -- reuses the
// exact same grounding-gated pipeline every other section generator in
// this codebase routes through (draftCritiqueRevise + validateGrounding),
// never a separate, less-safe path just because a human typed the
// instruction instead of the system. Works identically for a small tweak
// ("make this punchier") and a full rewrite ("start over") -- both are
// just an instruction against the same current content, scored the same way.
export async function editSectionWithPrompt(
  facts: Facts,
  section: Pick<FunnelPageSection, "slug" | "kind" | "h2" | "body_content">,
  instruction: string
): Promise<SectionEditResult> {
  const relevantPage = findRelevantPage(facts, section.slug !== "hero" ? section.slug : null);
  const context = buildRichContext(facts, { relevantPage });

  const draftPrompt = `You're editing one section of a real business's website. Apply this instruction to the CURRENT content below, staying grounded ONLY in the real facts provided -- never invent a new claim, number, or detail that isn't already true of this business.

Instruction: ${instruction}

Current heading: ${section.h2}
Current body: ${section.body_content}

Real facts about this business:
${context}

Reply with strict JSON only, no markdown fences, no commentary, no text before or after: {"heading": "<the new heading>", "body": "<the new body text>"}`;

  // v4 (Phase U1) -- was a fragile HEADING:/BODY: text-marker regex that
  // silently fell back to the ORIGINAL unchanged content whenever the
  // revise pass's rewrite dropped the literal markers (a real, likely
  // failure mode given draftCritiqueRevise's revise prompt separately says
  // "reply with the revised text only, nothing else"). Strict JSON parsed
  // via the same parseJsonResponse every other JSON-emitting generator in
  // this codebase already uses is far more reliably round-trippable
  // through a critique/revise cycle than a hand-rolled text format.
  const constraintSummary = 'reply with strict JSON only, exactly {"heading": "...", "body": "..."}, grounded only in the real facts provided';
  const result = await draftCritiqueRevise(draftPrompt, context, constraintSummary);

  if (!result) {
    return { h2: section.h2, body_content: section.body_content, groundingWarnings: ["Edit failed -- AI call returned nothing. Original content unchanged."] };
  }

  const parsed = parseJsonResponse(result);
  const h2 = typeof parsed?.heading === "string" ? parsed.heading.trim() : null;
  const body_content = typeof parsed?.body === "string" ? parsed.body.trim() : null;

  // Confirmed real bug this replaces: a parse/shape failure used to
  // silently fall back to the unchanged original with no signal at all.
  // A malformed response is now a loud warning, never a silent no-op.
  if (!h2 || !body_content) {
    return {
      h2: section.h2,
      body_content: section.body_content,
      groundingWarnings: ["Edit failed -- AI response wasn't valid JSON in the expected shape. Original content unchanged. Try rephrasing the prompt."],
    };
  }

  const grounding = validateGrounding(`${h2} ${body_content}`, facts);
  return { h2, body_content, groundingWarnings: grounding.pass ? [] : grounding.reasons };
}
