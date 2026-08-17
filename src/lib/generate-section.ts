import {
  generateServiceLine,
  generateServiceLongBody,
  generateLocationServiceBody,
  generateDifferentiator,
  generateFaqAnswer,
  type Facts,
  type GenerationContext,
} from "@/lib/ai";
import { validateGrounding } from "@/lib/grounding";
import type { FunnelPageSection } from "@/types/database";

// GenerateSectionContent molecule — one generate_* atom + validate_grounding
// -> one validated funnel_pages[] entry (plan §5). qa_notes carries any
// grounding warnings through to the human QA gate rather than blocking
// generation outright — a human makes the final call, per PRD §7 stage 5.
//
// v6.3 -- returns null (not a section with disclaimer text as its body)
// when generateServiceLine genuinely has nothing real to ground -- a real
// nav link doesn't automatically deserve a published page if the site
// itself never says anything more about it than its own name (e.g. a
// materials/systems nav entry like "PVC ROOFING MEMBRANE" with zero
// supporting body copy anywhere on the site).
export async function generateServiceSection(
  facts: Facts,
  service: string,
  slug: string,
  mediaAssetIds: string[]
): Promise<(FunnelPageSection & { groundingWarnings: string[] }) | null> {
  const body = await generateServiceLine(facts, service, slug);
  if (!body) return null;
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

// v3 (Phase L) — the deeper standalone-page content, generated only in
// enrich-expand.ts and merged into an existing service section's
// long_body_content field (not a new funnel_pages entry). Returns null
// (never a fabricated fallback) when generation fails or facts don't
// support it -- the standalone page template falls back to body_content.
export async function generateServiceLongBodySection(
  facts: Facts,
  service: string,
  slug: string,
  context: GenerationContext
): Promise<{ longBody: string | null; groundingWarnings: string[] }> {
  const longBody = await generateServiceLongBody(facts, service, slug, context);
  if (!longBody) return { longBody: null, groundingWarnings: [] };
  const { pass, reasons } = validateGrounding(longBody, facts);
  return { longBody, groundingWarnings: pass ? [] : reasons };
}

// Same shape for a real service x area combination page.
export async function generateLocationServiceSection(
  facts: Facts,
  service: string,
  area: string,
  context: GenerationContext
): Promise<{ longBody: string | null; groundingWarnings: string[] }> {
  const longBody = await generateLocationServiceBody(facts, service, area, context);
  if (!longBody) return { longBody: null, groundingWarnings: [] };
  const { pass, reasons } = validateGrounding(longBody, facts);
  return { longBody, groundingWarnings: pass ? [] : reasons };
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
