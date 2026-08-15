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

export async function generateServiceLine(facts: Facts, service: string, slug?: string): Promise<string> {
  const servicePage = findRelevantPage(facts, slug ?? service);
  const relevantPages = findRelevantPages(facts, slug ?? service);
  const digest = await researchDigest(relevantPages, service);
  const prompt = `Write one short service-card description (1-2 sentences, under 30 words, no emoji) for the "${service}" service, based only on these real facts about the business — prefer real detail from their own site's content below about this specific service over generic category language:\n${buildRichContext(
    facts,
    { relevantPage: servicePage }
  )}${digest ? `\n\nAdditional real research on "${service}":\n${digest}` : ""}\n\nDo not invent pricing, guarantees, or claims not present in the facts. Reply with the description text only.`;

  const generated = await draftCritiqueRevise(prompt, digest, "1-2 sentences, under 30 words, no emoji");
  if (generated) return generated.replace(/^"|"$/g, "");
  const town = facts.town as string | undefined;
  return town ? `Professional ${service.toLowerCase()} serving ${town}.` : `Professional ${service.toLowerCase()} from a local team you can trust.`;
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

export async function generateFaqAnswer(question: string, facts: Facts): Promise<string> {
  const faqPage = findRelevantPage(facts, "faq") ?? findRelevantPage(facts);
  const digest = await researchDigest(findRelevantPages(facts, "faq"), question);
  const prompt = `Answer this FAQ question in 1-3 sentences, grounded ONLY in these real facts about the business (including their own site's real content below) — never invent a price, policy, or claim not present here. If the facts don't answer it, give a generic honest answer that tells the visitor to call to confirm.\n\nQuestion: ${question}\n\nFacts:\n${buildRichContext(
    facts,
    { relevantPage: faqPage }
  )}${digest ? `\n\nAdditional real research:\n${digest}` : ""}\n\nReply with the answer text only.`;

  const generated = await draftCritiqueRevise(prompt, digest, "1-3 sentences");
  if (generated) return generated;

  const phone = firstPhone(facts);
  return phone ? `Great question — call ${phone} and we'll confirm the details for your specific situation.` : `Great question — call us and we'll confirm the details for your specific situation.`;
}
