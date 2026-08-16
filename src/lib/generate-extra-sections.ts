import type { Facts, GenerationContext } from "@/lib/ai";
import { findRelevantPage, findRelevantPages, buildRichContext } from "@/lib/facts-context";
import { draftCritiqueRevise, researchDigest } from "@/lib/generate-with-critique";
import { validateGrounding } from "@/lib/grounding";
import { countTrustSignals, findLicenseInsuranceMention } from "@/lib/trust-signals";
import { parseJsonResponse } from "@/lib/parse-json-response";
import type { FunnelPageSection } from "@/types/database";
import type { PageInventory } from "@/lib/scrape/extract-text";

type SectionResult = (FunnelPageSection & { groundingWarnings: string[] }) | null;

// Phase E generators — six new section kinds. Every one follows the same
// anti-fabrication discipline the shell composer already documents for a
// process timeline: return null to skip the section entirely rather than
// invent content to hit a section count. `kind` is an open string on
// FunnelPageSection, so these slot in with zero schema changes.

// trust-strip — a real-signal stat row (town/rating+reviews/phone/license
// mention). Purely deterministic assembly from facts already on hand — no
// AI call needed or wanted for a handful of factual labels.
export function generateTrustStripSection(facts: Facts): SectionResult {
  const signals = countTrustSignals(facts);
  if (signals.count < 2) return null;

  const items: { icon: string; label: string; value: string }[] = [];
  if (signals.hasTown) items.push({ icon: "MapPin", label: "Serving", value: facts.town as string });
  if (signals.hasReviews) {
    items.push({ icon: "Star", label: "Rated", value: `${facts.rating}/5 (${facts.review_count})` });
  }
  if (signals.hasPhone) {
    const nap = facts.nap as { phones?: string[] };
    items.push({ icon: "Phone", label: "Call direct", value: nap.phones![0] });
  }
  if (signals.hasLicenseMention) items.push({ icon: "ShieldCheck", label: "Licensed & insured", value: "Verified on-site" });

  return {
    slug: "trust-strip",
    kind: "trust-strip",
    h2: "",
    body_content: "",
    media_asset_ids: [],
    cta: null,
    variant_props: { items },
    groundingWarnings: [],
  };
}

// expertise — a "why choose us" narrative of real reasoning, not a flat
// checklist. Each point pairs a short title with a full grounded sentence
// (matching the reference bar: real specifics like "fourth-generation
// contractor since 1987", not a 15-word fragment). Gated on either a real
// differentiator photo (Phase C4's slot) or at least 2 real trust signals —
// skip otherwise rather than call the AI over nothing.
export async function generateExpertiseSection(
  facts: Facts,
  context: GenerationContext,
  hasDifferentiatorPhoto: boolean
): Promise<SectionResult> {
  const signals = countTrustSignals(facts);
  if (!hasDifferentiatorPhoto && signals.count < 2) return null;

  const homepage = findRelevantPage(facts);
  const digest = await researchDigest(findRelevantPages(facts), "why choose this business, expertise, differentiators, history, credentials");
  const prompt = `Write 3-4 "why choose us" points for a ${context.industryLabel} business, grounded ONLY in these real facts — never invent a claim not present here. Each point needs a short title (3-6 words, no emoji) AND a real supporting sentence (20-30 words) that cites specific, concrete details from the facts below (years in business, real credentials, how the owner/team works, real service scope) — not a generic industry platitude:\n${buildRichContext(
    facts,
    { relevantPage: homepage }
  )}${digest ? `\n\nAdditional real research:\n${digest}` : ""}\n\nReply with strict JSON only, no markdown: {"points": [{"title": "...", "description": "..."}]}. If fewer than 2 real points can be grounded with a genuine supporting sentence, reply {"points": []}.`;

  const raw = await draftCritiqueRevise(
    prompt,
    digest,
    'valid JSON {"points": [{"title": "3-6 words", "description": "20-30 word grounded sentence"}]}, 3-4 items'
  );
  const parsed = raw ? parseJsonResponse(raw) : null;
  const rawPoints = Array.isArray(parsed?.points) ? (parsed!.points as unknown[]) : [];
  const points = rawPoints.filter(
    (p): p is { title: string; description: string } =>
      typeof p === "object" && p !== null && typeof (p as { title?: unknown }).title === "string" && typeof (p as { description?: unknown }).description === "string"
  );

  if (points.length < 2 && !hasDifferentiatorPhoto) return null;

  const body = points.map((p) => `${p.title}: ${p.description}`).join("\n");
  const { pass, reasons } = validateGrounding(body, facts);
  return {
    slug: "expertise",
    kind: "expertise",
    h2: "Why choose us",
    body_content: body,
    media_asset_ids: [],
    cta: null,
    variant_props: { points },
    groundingWarnings: pass ? [] : reasons,
  };
}

// cta-banner — a mid-page repeat of the call CTA. Low-risk, no invented
// claims, renders whenever a real phone number exists.
export function generateCtaBannerSection(facts: Facts, businessName: string): SectionResult {
  const nap = facts.nap as { phones?: string[] } | undefined;
  const phone = nap?.phones?.[0];
  if (!phone) return null;

  return {
    slug: "cta-banner",
    kind: "cta-banner",
    h2: "Ready when you are",
    body_content: `Call ${phone} and talk to ${businessName} directly.`,
    media_asset_ids: [],
    cta: `Call ${phone}`,
    groundingWarnings: [],
  };
}

// process — the highest-risk of the six, matching the shell's existing
// "only if genuinely sequential, never invented" rule. One call, explicit
// NONE sentinel when the real content doesn't describe a real sequence.
export async function generateProcessSection(facts: Facts, context: GenerationContext): Promise<SectionResult> {
  const page = findRelevantPage(facts, "how it works") ?? findRelevantPage(facts, "process") ?? findRelevantPage(facts);
  const relevantPages = findRelevantPages(facts, "how it works process steps");
  const digest = await researchDigest(relevantPages, "the business's real process or steps, if genuinely described");
  const prompt = `Look at this real business's real page content below. If it genuinely describes a numbered/sequential process (e.g. "1. Free estimate 2. We schedule 3. We do the work"), extract 3-5 real steps as JSON: {"steps": [{"title": "...", "description": "..."}]}. If the content does NOT genuinely describe a real sequential process, reply with the exact string NONE and nothing else — never invent a process that isn't really described.\n\nReal facts:\n${buildRichContext(
    facts,
    { relevantPage: page }
  )}${digest ? `\n\nAdditional real research:\n${digest}` : ""}`;

  const raw = await draftCritiqueRevise(prompt, digest, 'valid JSON {"steps": [{"title","description"}]} of 3-5 real steps, or exactly NONE', "NONE");
  if (!raw || raw.trim() === "NONE") return null;

  const parsed = parseJsonResponse(raw);
  const steps = Array.isArray(parsed?.steps) ? (parsed!.steps as unknown[]) : [];
  const validSteps = steps.filter(
    (s): s is { title: string; description: string } =>
      typeof s === "object" && s !== null && typeof (s as { title?: unknown }).title === "string"
  );
  if (validSteps.length < 2) return null;

  const body = validSteps.map((s) => `${s.title}: ${s.description}`).join("\n");
  const { pass, reasons } = validateGrounding(body, facts);
  return {
    slug: "process",
    kind: "process",
    h2: "How it works",
    body_content: body,
    media_asset_ids: [],
    cta: null,
    variant_props: { steps: validSteps },
    groundingWarnings: pass ? [] : reasons,
  };
}

// audience-segments — same shape as process: real or skipped, never invented.
export async function generateAudienceSegmentsSection(facts: Facts, context: GenerationContext): Promise<SectionResult> {
  const homepage = findRelevantPage(facts);
  const digest = await researchDigest(findRelevantPages(facts), "different types of customers this business serves, if genuinely differentiated");
  const prompt = `Look at this real ${context.industryLabel} business's real page content below. If it genuinely differentiates between different types of customers it serves (e.g. residential vs commercial, homeowners vs property managers), extract 2-4 real segments as JSON: {"segments": [{"label": "...", "description": "..."}]}. If the content does NOT genuinely differentiate buyer types, reply with the exact string NONE and nothing else — never invent a segment that isn't really described.\n\nReal facts:\n${buildRichContext(
    facts,
    { relevantPage: homepage }
  )}${digest ? `\n\nAdditional real research:\n${digest}` : ""}`;

  const raw = await draftCritiqueRevise(prompt, digest, 'valid JSON {"segments": [{"label","description"}]} of 2-4 real segments, or exactly NONE', "NONE");
  if (!raw || raw.trim() === "NONE") return null;

  const parsed = parseJsonResponse(raw);
  const segments = Array.isArray(parsed?.segments) ? (parsed!.segments as unknown[]) : [];
  const validSegments = segments.filter(
    (s): s is { label: string; description: string } =>
      typeof s === "object" && s !== null && typeof (s as { label?: unknown }).label === "string"
  );
  if (validSegments.length < 2) return null;

  const body = validSegments.map((s) => `${s.label}: ${s.description}`).join("\n");
  const { pass, reasons } = validateGrounding(body, facts);
  return {
    slug: "audience-segments",
    kind: "audience-segments",
    h2: "Who we serve",
    body_content: body,
    media_asset_ids: [],
    cta: null,
    variant_props: { segments: validSegments },
    groundingWarnings: pass ? [] : reasons,
  };
}

// certifications — hard-gated on a real license/insurance/certification
// mention actually found in the scraped text. Deterministic badge labels
// built only from words genuinely present — never a fabricated "Licensed &
// Insured" claim or an invented partner/manufacturer logo.
const BADGE_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "Insured", pattern: /\binsured\b/i },
  { label: "Licensed", pattern: /\blicensed\b/i },
  { label: "Certified", pattern: /\bcertifi(ed|cation)\b/i },
  { label: "Bonded", pattern: /\bbonded\b/i },
  { label: "BBB Accredited", pattern: /\bbbb accredited\b/i },
];

export function generateCertificationsSection(facts: Facts): SectionResult {
  if (!findLicenseInsuranceMention(facts)) return null;

  const pages = (facts.pages as PageInventory[] | undefined) ?? [];
  const allText = pages.map((p) => p.bodyText).join(" ");
  const badges = BADGE_PATTERNS.filter((b) => b.pattern.test(allText)).map((b) => ({ label: b.label }));
  if (badges.length === 0) return null;

  return {
    slug: "certifications",
    kind: "certifications",
    h2: "",
    body_content: "",
    media_asset_ids: [],
    cta: null,
    variant_props: { badges },
    groundingWarnings: [],
  };
}
