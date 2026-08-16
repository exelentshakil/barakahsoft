import { findRelevantPage, buildRichContext } from "@/lib/facts-context";
import { draftCritiqueRevise } from "@/lib/generate-with-critique";
import { validateGrounding } from "@/lib/grounding";
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

Reply with exactly two lines in this format, nothing else:
HEADING: <the new heading>
BODY: <the new body text>`;

  const constraintSummary = "reply in the exact HEADING:/BODY: two-line format, grounded only in the real facts provided";
  const result = await draftCritiqueRevise(draftPrompt, context, constraintSummary);

  if (!result) {
    return { h2: section.h2, body_content: section.body_content, groundingWarnings: ["Edit failed -- AI call returned nothing. Original content unchanged."] };
  }

  const headingMatch = result.match(/HEADING:\s*(.+)/i);
  const bodyMatch = result.match(/BODY:\s*([\s\S]+)/i);
  const h2 = headingMatch?.[1]?.trim() || section.h2;
  const body_content = bodyMatch?.[1]?.trim() || section.body_content;

  const grounding = validateGrounding(`${h2} ${body_content}`, facts);
  return { h2, body_content, groundingWarnings: grounding.pass ? [] : grounding.reasons };
}
