import { generateServiceLine, generateDifferentiator, generateFaqAnswer, type Facts, type GenerationContext } from "@/lib/ai";
import { validateGrounding } from "@/lib/grounding";
import type { FunnelPageSection } from "@/types/database";

// GenerateSectionContent molecule — one generate_* atom + validate_grounding
// -> one validated funnel_pages[] entry (plan §5). qa_notes carries any
// grounding warnings through to the human QA gate rather than blocking
// generation outright — a human makes the final call, per PRD §7 stage 5.
export async function generateServiceSection(
  facts: Facts,
  service: string,
  slug: string,
  mediaAssetIds: string[]
): Promise<FunnelPageSection & { groundingWarnings: string[] }> {
  const body = await generateServiceLine(facts, service);
  const { pass, reasons } = validateGrounding(body, facts);
  return {
    slug,
    kind: "service",
    h2: service,
    body_content: body,
    media_asset_ids: mediaAssetIds,
    cta: "Get a free quote",
    groundingWarnings: pass ? [] : reasons,
  };
}

export async function generateDifferentiatorSection(
  facts: Facts,
  context: GenerationContext,
  slug = "why-choose-us"
): Promise<FunnelPageSection & { groundingWarnings: string[] }> {
  const body = await generateDifferentiator(facts, context);
  const { pass, reasons } = validateGrounding(body, facts);
  return {
    slug,
    kind: "differentiator",
    h2: "Why choose us",
    body_content: body,
    media_asset_ids: [],
    cta: null,
    groundingWarnings: pass ? [] : reasons,
  };
}

// One funnel_pages entry per question (not one combined blob) — each
// question becomes its own FAQPage JSON-LD Question/acceptedAnswer pair in
// src/app/s/[leadSlug]/page.tsx, which needs individually addressable Q&As,
// not a single concatenated answer.
export async function generateFaqSections(facts: Facts, questions: string[]): Promise<(FunnelPageSection & { groundingWarnings: string[] })[]> {
  return Promise.all(
    questions.map(async (question, i) => {
      const answer = await generateFaqAnswer(question, facts);
      const { pass, reasons } = validateGrounding(answer, facts);
      return {
        slug: `faq-${i + 1}`,
        kind: "faq",
        h2: question,
        body_content: answer,
        media_asset_ids: [],
        cta: null,
        groundingWarnings: pass ? [] : reasons,
      };
    })
  );
}
