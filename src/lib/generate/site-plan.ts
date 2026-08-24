import { z } from "zod";
import { callBestModel, type GenerationProvider } from "@/lib/generate/model";
import { parseJsonResponse } from "@/lib/parse-json-response";
import type { SiteBrief } from "@/lib/generate-bespoke-site";
import type { DesignDna } from "@/lib/design-dna";
import type { MediaPlan } from "@/lib/media/plan-media";

const SectionKindSchema = z.enum([
  "hero",
  "problem",
  "services",
  "process",
  "proof",
  "about",
  "reviews",
  "areas",
  "faq",
  "contact",
  "cta",
]);

const PlannedSectionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/).max(50),
  kind: SectionKindSchema,
  label: z.string().min(2).max(80),
  visitorProblem: z.string().min(8).max(240),
  purpose: z.string().min(8).max(300),
  archetype: z.string().min(3).max(120),
  evidence: z.array(z.string().min(2).max(180)).max(6).default([]),
  mediaSlot: z.string().max(60).nullable().default(null),
});

export const SitePlanSchema = z.object({
  diagnosis: z.string().min(20).max(1200),
  designNotes: z.string().min(20).max(1800),
  recurringPrimitive: z.string().min(3).max(160),
  services: z.array(z.object({ name: z.string().min(1).max(120), blurb: z.string().max(320) })).max(12).default([]),
  sections: z.array(PlannedSectionSchema).min(7).max(20),
});

export type SitePlan = z.infer<typeof SitePlanSchema>;
export type PlannedSection = z.infer<typeof PlannedSectionSchema>;

function fallbackPlan(brief: SiteBrief, media: MediaPlan): SitePlan {
  const sections: PlannedSection[] = [
    {
      id: "hero",
      kind: "hero",
      label: "Hero",
      visitorProblem: `Confirm immediately that ${brief.businessName} handles the required work in ${brief.city}.`,
      purpose: `State the customer outcome, location and ${brief.intent.primaryLabel} action above the fold.`,
      archetype: "asymmetric promise, proof and conversion panel",
      evidence: [brief.industry, brief.city],
      mediaSlot: media.some((item) => item.slot === "hero") ? "hero" : null,
    },
    {
      id: "services",
      kind: "services",
      label: "Services",
      visitorProblem: "Help visitors identify whether the business handles their specific job.",
      purpose: "Connect every real service to the practical problem it resolves.",
      archetype: "editorial service index with one featured work image",
      evidence: brief.services,
      mediaSlot: media.some((item) => item.slot === "service-0") ? "service-0" : null,
    },
    {
      id: "process",
      kind: "process",
      label: "What happens next",
      visitorProblem: "Remove uncertainty about starting an enquiry.",
      purpose: "Explain only the supported next steps and make contacting the business feel simple.",
      archetype: "numbered horizontal sequence",
      evidence: [],
      mediaSlot: null,
    },
    {
      id: "proof",
      kind: "proof",
      label: "Why choose this business",
      visitorProblem: "Distinguish real evidence from generic claims made by competitors.",
      purpose: "Place only supported proof beside the decision it validates.",
      archetype: "asymmetric proof band with one strong visual anchor",
      evidence: [brief.rating && brief.reviewCount ? `${brief.rating} from ${brief.reviewCount} reviews` : null, brief.licensedInsured ? "Licensed and insured claim" : null].filter((value): value is string => Boolean(value)),
      mediaSlot: media.some((item) => item.slot === "proof") ? "proof" : null,
    },
    {
      id: "about",
      kind: "about",
      label: "About",
      visitorProblem: "Show who is behind the work and why inviting them in is credible.",
      purpose: "Balance a concise company story, authentic imagery and supported trust evidence.",
      archetype: "owner or team editorial profile with integrated evidence",
      evidence: [brief.founder, brief.licensedInsured ? "Licensed and insured claim" : null].filter((value): value is string => Boolean(value)),
      mediaSlot: media.some((item) => item.slot === "about") ? "about" : null,
    },
  ];

  if (brief.reviews.length > 0) {
    sections.push({
      id: "reviews",
      kind: "reviews",
      label: "Customer reviews",
      visitorProblem: "Provide credible reassurance from people who have already hired the business.",
      purpose: "Present real attributed review text in an accessible horizontal slider.",
      archetype: "full-width review slider with one dominant quote per view",
      evidence: brief.reviews.map((review) => `${review.author}: ${review.text.slice(0, 100)}`),
      mediaSlot: null,
    });
  }

  if (brief.areas.length > 0) {
    sections.push({
      id: "areas",
      kind: "areas",
      label: "Service areas",
      visitorProblem: "Confirm that the visitor's location is covered.",
      purpose: "Make real service locations easy to scan and useful for local relevance.",
      archetype: "location field with repeated pin primitive",
      evidence: brief.areas,
      mediaSlot: null,
    });
  }

  sections.push(
    {
      id: "faq",
      kind: "faq",
      label: "Frequently asked questions",
      visitorProblem: "Answer high-intent questions without inventing policy, pricing or timing.",
      purpose: "Resolve remaining factual objections before the visitor contacts the business.",
      archetype: "two-column introduction and accessible accordion",
      evidence: [],
      mediaSlot: null,
    },
    {
      id: "contact",
      kind: "contact",
      label: "Contact",
      visitorProblem: "Make the final action obvious without scrolling back.",
      purpose: `Resolve the page with the same ${brief.intent.primaryLabel} action and real contact details.`,
      archetype: "substantial closing split with contact proof",
      evidence: [brief.phone, brief.email].filter((value): value is string => Boolean(value)),
      mediaSlot: null,
    }
  );

  return {
    diagnosis: `Visitors need to recognise the right ${brief.industry} service in ${brief.city}, trust the people doing it and understand how to start without friction.`,
    designNotes: `Build one spacious visual argument with varied section silhouettes, controlled colour cadence and a consistent action treatment. Keep customer outcomes and real evidence close together. Make the About composition substantial rather than a small portrait beside a wall of copy.`,
    recurringPrimitive: "a restrained brand-colour rule and numbered marker",
    services: brief.services.slice(0, 12).map((name) => ({ name, blurb: `${name} for customers in ${brief.city}.` })),
    sections,
  };
}

export async function generateSitePlan(
  brief: SiteBrief,
  dna: DesignDna,
  media: MediaPlan,
  provider: GenerationProvider = "openai"
): Promise<SitePlan> {
  const prompt = `Diagnose and plan a homepage for a real ${brief.industry} business. This is the research and strategy pass: decide every section before any HTML is written.

BUSINESS FACTS
- Business: ${brief.businessName}
- Location: ${brief.city}${brief.areas.length ? `; areas: ${brief.areas.slice(0, 12).join(", ")}` : ""}
- Owner: ${brief.founder ?? "not supplied"}
- Services: ${brief.services.join(" | ")}
- Primary action: ${brief.intent.primaryLabel}
- Verified aggregate review proof: ${brief.rating && brief.reviewCount ? `${brief.rating} from ${brief.reviewCount} reviews` : "none"}
- Real attributed review text: ${brief.reviews.length ? brief.reviews.map((review) => `${review.author}: ${review.text.slice(0, 220)}`).join(" | ") : "none"}
- Licensed/insured claim: ${brief.licensedInsured ? "supported" : "not supplied"}
- Owner-reported website problems: ${brief.painInstructions.join(" | ") || "none supplied"}
- Current-site fact digest: ${brief.factsDigest.slice(0, 5000)}

AVAILABLE MEDIA
${media.map((item) => `${item.slot}: ${item.caption}`).join("\n") || "No usable media."}

VISUAL RESEARCH DIRECTION
- Mood: ${dna.mood}
- Rhythm: ${dna.layout.sectionRhythm}
- Hero: ${dna.layout.heroTreatment}
- Services: ${dna.layout.serviceLayout}
- Proof: ${dna.layout.proofStyle}
- Motifs: ${dna.motifs.join("; ") || "none"}
- Why it works: ${dna.rationale}

PLAN RULES
- Use 7-12 sections normally. Use up to 20 only when distinct evidence and buying problems justify them. Never pad.
- Every section must solve one named visitor problem and have a conversion purpose grounded in the supplied facts.
- Hero is first. Include services, about, FAQ and a substantial final contact/CTA section.
- If real review text exists, reviews is mandatory and its archetype must be an accessible horizontal slider. If none exists, omit reviews.
- About must balance visual mass among authentic owner/team/work imagery, the business identity, owner name when supplied, concise story and supported trust evidence. Never invent a title, experience, logo, metric or credential.
- No two adjacent sections use the same archetype. Plan quiet/focal/reset cadence instead of alternating coloured rectangles.
- Select media only by the supplied slot and subject. A slot may be used once.
- The primary action wording and treatment are identical everywhere.
- IDs are lowercase slugs. Navigation IDs must be exactly services, about, reviews, faq and contact where those sections exist.

Return strict JSON only:
{"diagnosis":"...","designNotes":"...","recurringPrimitive":"...","services":[{"name":"exact service name","blurb":"customer problem it addresses"}],"sections":[{"id":"hero","kind":"hero|problem|services|process|proof|about|reviews|areas|faq|contact|cta","label":"...","visitorProblem":"...","purpose":"...","archetype":"...","evidence":["supported fact"],"mediaSlot":"hero or null"}]}`;

  const raw = await callBestModel(prompt, {
    maxTokens: 8000,
    temperature: 0.35,
    system: "You are a conversion researcher and senior information architect. Diagnose from supplied evidence, make decisive section choices, never invent facts, and return valid JSON only.",
  }, provider);
  const parsed = raw ? SitePlanSchema.safeParse(parseJsonResponse(raw)) : null;
  if (!parsed?.success) {
    console.warn("[site-plan] model plan was unavailable or invalid; using the grounded deterministic plan");
    return fallbackPlan(brief, media);
  }

  const ids = new Set(parsed.data.sections.map((section) => section.id));
  const hasRequired = ["hero", "services", "about", "faq", "contact"].every((id) => ids.has(id));
  const reviewRule = brief.reviews.length > 0 ? ids.has("reviews") : !ids.has("reviews");
  const validOrder = parsed.data.sections[0]?.id === "hero" && ids.size === parsed.data.sections.length;
  if (!hasRequired || !reviewRule || !validOrder) return fallbackPlan(brief, media);

  const availableSlots = new Set(media.map((item) => item.slot));
  const usedSlots = new Set<string>();
  const sections = parsed.data.sections.map((section) => {
    const slot = section.mediaSlot;
    if (!slot || !availableSlots.has(slot) || usedSlots.has(slot)) return { ...section, mediaSlot: null };
    usedSlots.add(slot);
    return section;
  });
  const generatedBlurbs = new Map(parsed.data.services.map((service) => [service.name.toLowerCase(), service.blurb]));
  const services = brief.services.slice(0, 12).map((name) => ({
    name,
    blurb: generatedBlurbs.get(name.toLowerCase()) ?? `${name} for customers in ${brief.city}.`,
  }));
  return { ...parsed.data, sections, services };
}

export function sectionBatches(sections: PlannedSection[], size = 4): PlannedSection[][] {
  const batches: PlannedSection[][] = [];
  for (let index = 0; index < sections.length; index += size) batches.push(sections.slice(index, index + size));
  return batches;
}
