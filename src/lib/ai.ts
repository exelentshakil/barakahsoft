// generate_* atoms — one Gemini-backed generator per content slot, each with
// a rule-based fallback so the pipeline never hard-fails on a missing key.
// Every function takes the lead's full scrape_results.facts blob (the
// grounding source) plus a small slot-specific argument, and returns plain
// text. Callers must still run the result through validate_grounding
// (src/lib/grounding.ts) before it's trusted into artifacts.funnel_pages.

import { findRelevantPage, findRelevantPages, buildRichContext } from "@/lib/facts-context";
import { draftCritiqueRevise, researchDigest } from "@/lib/generate-with-critique";
import { callGemini } from "@/lib/gemini-client";

// Re-exported so existing importers (compose-sections.ts, caption-photos.ts,
// generate-extra-sections.ts) don't need to change — the implementation
// moved to gemini-client.ts to break a circular import with
// generate-with-critique.ts, which this file also depends on.
export { callGemini };

export type Facts = Record<string, unknown>;

function reviewLine(facts: Facts): string | null {
  const reviewCount = facts.review_count as number | undefined;
  const rating = facts.rating as number | undefined;
  return reviewCount && rating ? `Rated ${rating} from ${reviewCount} real reviews.` : null;
}

function firstPhone(facts: Facts): string | null {
  const nap = facts.nap as { phones?: string[] } | undefined;
  return nap?.phones?.[0] ?? null;
}

// Populated by enrich-generate.ts from the playbook + ResearchCompetitors
// molecule (src/lib/research-competitors.ts) — industryLabel isn't in facts
// (it lives on leads.industry / the playbook, not the scrape), and
// designBrief grounds tone against real local competitors rather than
// writing in a vacuum, per the explicit ask to research the niche/location
// before generating copy.
export interface GenerationContext {
  industryLabel: string;
  town: string | null;
  designBrief: string;
}

function contextBlock(context: GenerationContext): string {
  return context.designBrief ? `\n\nCategory context: ${context.designBrief}` : "";
}

export async function generateHeadline(facts: Facts, context: GenerationContext): Promise<string> {
  const businessName = (facts.business_name as string) || "This business";
  const town = context.town || "";
  const homepage = findRelevantPage(facts);
  const digest = await researchDigest(findRelevantPages(facts), "homepage headline");
  const prompt = `Write a single homepage H1 headline (under 10 words, no emoji, no exclamation marks) for a local ${context.industryLabel} business in ${town || "their area"}, based only on these real facts about their actual business (including their own site's real headings/content below — use it, don't write generic category copy when specific real services or language are available):\n${buildRichContext(
    facts,
    { relevantPage: homepage }
  )}${digest ? `\n\nAdditional real research:\n${digest}` : ""}${contextBlock(context)}\n\nReply with the headline text only, nothing else.`;

  const generated = await draftCritiqueRevise(prompt, digest, "under 10 words, no emoji, no exclamation marks");
  if (generated) return generated.replace(/^"|"$/g, "");

  return town ? `${context.industryLabel} in ${town}` : `${businessName} — ${context.industryLabel}`;
}

export async function generateSubhead(facts: Facts, context: GenerationContext): Promise<string> {
  const homepage = findRelevantPage(facts);
  const digest = await researchDigest(findRelevantPages(facts), "homepage subheadline trust signal");
  const prompt = `Write a single homepage subheadline (one sentence, under 25 words, no emoji) for a ${context.industryLabel} business that supports the headline with a concrete trust signal, based only on these real facts (including their own site's real content below):\n${buildRichContext(
    facts,
    { relevantPage: homepage }
  )}${digest ? `\n\nAdditional real research:\n${digest}` : ""}${contextBlock(context)}\n\nReply with the subheadline text only, nothing else. If there is no real trust signal in the facts, write a plain statement of what the business does instead of inventing one.`;

  const generated = await draftCritiqueRevise(prompt, digest, "one sentence, under 25 words, no emoji");
  if (generated) return generated.replace(/^"|"$/g, "");

  return reviewLine(facts) ?? "Local, reliable, and ready to help.";
}

// v6.3 -- real bug found against a live lead (cityroofrepairnyc.com): a
// heavily SEO-paged site's nav includes real pages for individual roofing
// materials/systems ("APP 160 ROOFING", "PVC ROOFING MEMBRANE") mentioned
// nowhere else on the site beyond that one nav label -- the model was
// correctly refusing to invent anything, but instead of signaling that it
// wrote an honest sentence describing its own lack of information ("No
// research facts were provided...") as if it were real page content,
// which then got published verbatim. Explicit NONE sentinel (same pattern
// generateProcessSection/generateAudienceSegmentsSection already use)
// turns "nothing real to say" into a real null the caller can act on --
// generateServiceSection skips the section entirely rather than
// publishing a page whose only content is a disclaimer about itself.
export async function generateServiceLine(facts: Facts, service: string, slug?: string): Promise<string | null> {
  const servicePage = findRelevantPage(facts, slug ?? service);
  const relevantPages = findRelevantPages(facts, slug ?? service);
  const digest = await researchDigest(relevantPages, service);
  const prompt = `Write one short service-card description (1-2 sentences, under 30 words, no emoji) for the "${service}" service, based only on these real facts about the business — prefer real detail from their own site's content below about this specific service over generic category language:\n${buildRichContext(
    facts,
    { relevantPage: servicePage }
  )}${digest ? `\n\nAdditional real research on "${service}":\n${digest}` : ""}\n\nDo not invent pricing, guarantees, or claims not present in the facts. If the real facts above genuinely contain nothing specific about "${service}" beyond its name, reply with the exact string NONE and nothing else — never write a sentence describing what information is missing. Otherwise reply with the description text only.`;

  const generated = await draftCritiqueRevise(prompt, digest, "1-2 sentences, under 30 words, no emoji", "NONE");
  if (generated && generated.trim() !== "NONE") return generated.replace(/^"|"$/g, "");
  if (generated === null) {
    // Total call failure (not "nothing to ground"), keep the pipeline
    // moving with a harmless generic line rather than dropping a real service.
    const town = facts.town as string | undefined;
    return town ? `Professional ${service.toLowerCase()} serving ${town}.` : `Professional ${service.toLowerCase()} from a local team you can trust.`;
  }
  return null;
}

// v3 (Phase L) — genuinely deeper standalone-page SEO copy, generated only
// in enrich-expand.ts once a lead is qualified (not the fast homepage
// pass). Same grounding discipline as generateServiceLine, just a much
// larger constraint/digest budget since this is real organic-search
// investment, not a card blurb. Returns null (not a generic fallback
// string) on total failure — a long-form page with no real content to say
// is worse than falling back to the short body_content the page template
// already has.
export async function generateServiceLongBody(facts: Facts, service: string, slug: string, context: GenerationContext): Promise<string | null> {
  const servicePage = findRelevantPage(facts, slug ?? service);
  const relevantPages = findRelevantPages(facts, slug ?? service);
  const digest = await researchDigest(relevantPages, service);
  const prompt = `Write a genuinely useful, detailed standalone webpage section (600-900 words, plain prose in 4-6 paragraphs separated by blank lines, no headings, no emoji, no bullet lists) about the "${service}" service for a ${context.industryLabel} business${context.town ? ` in ${context.town}` : ""}. Cover what the service actually involves, why it matters, and what makes this specific business's approach real and credible — grounded ONLY in the real facts below, never invented:\n${buildRichContext(
    facts,
    { relevantPage: servicePage, maxChars: 4000 }
  )}${digest ? `\n\nAdditional real research on "${service}":\n${digest}` : ""}\n\nDo not invent pricing, guarantees, certifications, or claims not present in the facts above. If the real facts genuinely don't support 600+ words without inventing anything, write as much genuine, grounded content as they do support. Reply with the body text only.`;

  const generated = await draftCritiqueRevise(prompt, digest, "600-900 words, plain prose paragraphs, no invented claims");
  return generated ? generated.trim() : null;
}

// Same shape as generateServiceLongBody, for a location x service
// combination page (e.g. "Roof Repair in Park Slope, Brooklyn") -- area is
// a real string extracted by extract-service-areas.ts, never invented.
export async function generateLocationServiceBody(facts: Facts, service: string, area: string, context: GenerationContext): Promise<string | null> {
  const relevantPages = findRelevantPages(facts, service);
  const digest = await researchDigest(relevantPages, `${service} in ${area}`);
  const prompt = `Write a genuinely useful, detailed standalone webpage section (500-800 words, plain prose in 4-6 paragraphs separated by blank lines, no headings, no emoji, no bullet lists) about "${service}" specifically for customers in "${area}", for a ${context.industryLabel} business. Cover what the service involves and why this business is a credible choice for someone in that specific area — grounded ONLY in the real facts below, never invented (never invent details about the area itself beyond its name, never invent that the business has a physical presence there beyond what the facts state):\n${buildRichContext(
    facts,
    { maxChars: 4000 }
  )}${digest ? `\n\nAdditional real research:\n${digest}` : ""}\n\nDo not invent pricing, guarantees, certifications, local landmarks, or claims not present in the facts above. If the real facts genuinely don't support 500+ words without inventing anything, write as much genuine, grounded content as they do support. Reply with the body text only.`;

  const generated = await draftCritiqueRevise(prompt, digest, "500-800 words, plain prose paragraphs, no invented claims");
  return generated ? generated.trim() : null;
}

export async function generateDifferentiator(facts: Facts, context: GenerationContext): Promise<string> {
  const homepage = findRelevantPage(facts);
  const digest = await researchDigest(findRelevantPages(facts), "why choose this business");
  const prompt = `Write one short "why choose us" claim (one sentence, under 20 words, no emoji) for a ${context.industryLabel} business, grounded ONLY in these real facts — do not invent anything not present here (including their own site's real content below):\n${buildRichContext(
    facts,
    { relevantPage: homepage }
  )}${digest ? `\n\nAdditional real research:\n${digest}` : ""}${contextBlock(context)}\n\nReply with the claim text only. If none of the facts support a real differentiator, write "Local team, straightforward pricing, no surprises."`;

  const generated = await draftCritiqueRevise(prompt, digest, "one sentence, under 20 words, no emoji");
  if (generated) return generated.replace(/^"|"$/g, "");

  return (
    reviewLine(facts) ??
    (firstPhone(facts) ? "A real local number you can call — no call center, no script." : "Local team, straightforward pricing, no surprises.")
  );
}

export async function generateAuditNarrative(facts: Facts): Promise<string> {
  const pagespeed = facts.pagespeed as Record<string, unknown> | undefined;
  const prompt = `Write a 2-3 sentence plain-English summary of this business's current website performance for a non-technical owner, based only on these real PageSpeed facts (never invent a number not present here):\n${JSON.stringify(
    pagespeed ?? {}
  )}\n\nReply with the summary text only, no markdown.`;

  const generated = await callGemini(prompt);
  if (generated) return generated;

  const mobileScore = (pagespeed?.mobile as Record<string, unknown> | undefined)?.score;
  return mobileScore
    ? `Your current site scores ${mobileScore}/100 on mobile speed — there's real room to convert more of your traffic into calls.`
    : "We weren't able to pull a speed score for your current site.";
}

// v6.3 -- real bug found against a live lead: when the facts genuinely
// didn't answer a question, the model was writing a sentence describing
// its own lack of information ("I am unable to confirm... because no
// research details were provided") instead of the clean "call to confirm"
// fallback the prompt already asks for — a disclaimer-about-itself is not
// the same as the honest, visitor-facing answer the instruction meant. The
// prompt now spells out the exact fallback line to use verbatim, and
// looksLikeMetaDisclaimer() is a runtime safety net that substitutes the
// real deterministic fallback if the model still writes about its own
// limitations instead of answering the visitor.
const META_DISCLAIMER_PATTERN = /\b(no research|not (?:provided|available)|unable to confirm|cannot confirm|i (?:don't|do not) have)\b/i;

function looksLikeMetaDisclaimer(text: string): boolean {
  return META_DISCLAIMER_PATTERN.test(text);
}

export async function generateFaqAnswer(question: string, facts: Facts): Promise<string> {
  const faqPage = findRelevantPage(facts, "faq") ?? findRelevantPage(facts);
  const digest = await researchDigest(findRelevantPages(facts, "faq"), question);
  const phone = firstPhone(facts);
  const fallbackLine = phone
    ? `Great question — call ${phone} and we'll confirm the details for your specific situation.`
    : `Great question — call us and we'll confirm the details for your specific situation.`;
  const prompt = `Answer this FAQ question in 1-3 sentences, grounded ONLY in these real facts about the business (including their own site's real content below) — never invent a price, policy, or claim not present here.\n\nQuestion: ${question}\n\nFacts:\n${buildRichContext(
    facts,
    { relevantPage: faqPage }
  )}${digest ? `\n\nAdditional real research:\n${digest}` : ""}\n\nIf the facts above genuinely don't answer this question, reply with EXACTLY this line and nothing else — never write your own sentence explaining what information is missing: "${fallbackLine}"\n\nOtherwise, reply with the answer text only.`;

  const generated = await draftCritiqueRevise(prompt, digest, "1-3 sentences");
  if (generated && !looksLikeMetaDisclaimer(generated)) return generated;
  return fallbackLine;
}
