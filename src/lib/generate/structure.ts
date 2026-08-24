import { callBestModel, type GenerationProvider } from "@/lib/generate/model";
import type { SiteBrief } from "@/lib/generate-bespoke-site";
import type { DesignDna } from "@/lib/design-dna";
import type { MediaPlan } from "@/lib/media/plan-media";
import type { PlannedSection, SitePlan } from "@/lib/generate/site-plan";
import {
  STANCE,
  SPACE_STANDARD,
  PSYCHOLOGY_STANDARD,
  CONVERSION_STANDARD,
  PREMIUM_COMPOSITION_STANDARD,
  aboutDirectionFor,
  HYGIENE_STANDARD,
  INTERACTION_CONTRACT,
  truthStandard,
} from "@/lib/generate/standard";

export { INTERACTION_CONTRACT };

function factsBlock(brief: SiteBrief): string {
  const lines: string[] = [
    `Business: ${brief.businessName}`,
    `Trade: ${brief.industry}`,
    `Serves: ${brief.city}${brief.areas.length > 0 ? ` — ${brief.areas.slice(0, 10).join(", ")}` : ""}`,
  ];
  if (brief.founder) lines.push(`Owner: ${brief.founder}`);
  if (brief.phone) lines.push(`Phone (verbatim, in tel: links): ${brief.phone}`);
  if (brief.email) lines.push(`Email: ${brief.email}`);
  lines.push(
    brief.rating && brief.reviewCount
      ? `Google: ${brief.rating} stars from ${brief.reviewCount} reviews — verified`
      : "NO verified aggregate rating exists. Never mention ratings, stars or review counts."
  );
  lines.push(
    brief.licensedInsured
      ? "They state on their own site that they are licensed and insured — you may say so."
      : "No licensing or insurance claim exists. Never claim licensed, insured, bonded or certified."
  );
  lines.push(`Their real services:\n${brief.services.map((service) => `  - ${service}`).join("\n")}`);
  lines.push(
    brief.reviews.length > 0
      ? `Real reviews — quote verbatim or not at all:\n${brief.reviews.map((review) => `  ${review.rating}/5 — "${review.text}" — ${review.author}`).join("\n")}`
      : "No review text available. Include no testimonials of any kind."
  );
  lines.push(`\nScraped from their current site:\n${brief.factsDigest.slice(0, 5000)}`);
  return lines.join("\n");
}

export interface GeneratedSection {
  id: string;
  kind: PlannedSection["kind"];
  label: string;
  html: string;
}

function parseSections(raw: string, batch: PlannedSection[]): GeneratedSection[] | null {
  const cleaned = raw.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const generated: GeneratedSection[] = [];
  for (const section of batch) {
    const escaped = section.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = cleaned.match(new RegExp(`<!--\\s*SECTION:${escaped}\\s*-->([\\s\\S]*?)<!--\\s*\\/SECTION:${escaped}\\s*-->`, "i"));
    const html = match?.[1]?.trim();
    const rootId = html?.match(/^<section\b[^>]*\bid=["']([^"']+)["']/i)?.[1];
    if (!html || rootId !== section.id || html.replace(/<[^>]+>/g, " ").trim().length < 80) return null;
    generated.push({ id: section.id, kind: section.kind, label: section.label, html });
  }
  return generated;
}

export async function generateStructureBatch(
  brief: SiteBrief,
  dna: DesignDna,
  media: MediaPlan,
  knownPaths: string[],
  plan: SitePlan,
  batch: PlannedSection[],
  provider: GenerationProvider = "openai"
): Promise<GeneratedSection[] | null> {
  const prompt = `${STANCE}

Write only the assigned homepage sections for a real ${brief.industry} business in ${brief.city}. Other batches are being written separately, so follow the shared plan and contracts exactly. Do not write or repeat sections outside this batch.

═══ GROUNDED BUSINESS FACTS — every claim comes from here ═══
${factsBlock(brief)}

Primary action: ${brief.intent.primaryLabel}
${brief.intent.guidance}
${brief.intent.secondaryLabel ? `Secondary action: ${brief.intent.secondaryLabel}` : ""}
${brief.painInstructions.length ? `Owner-reported problems this page must solve:\n${brief.painInstructions.map((item) => `- ${item}`).join("\n")}` : ""}

═══ APPROVED PAGE RESEARCH AND PLAN ═══
Diagnosis: ${plan.diagnosis}
Strategic lens: ${plan.strategyLens}
Composition: ${plan.designNotes}
Recurring graphic primitive: ${plan.recurringPrimitive}
Owner-problem coverage:
${plan.painCoverage.map((coverage) => `- ${coverage.problem} => ${coverage.response} in ${coverage.sectionIds.join(", ")}`).join("\n") || "No owner-selected problems were supplied."}
Complete ordered page:
${plan.sections.map((section, index) => `${index + 1}. ${section.id} [${section.kind}] — ${section.archetype}; solves: ${section.visitorProblem}; purpose: ${section.purpose}`).join("\n")}

THIS BATCH ONLY:
${JSON.stringify(batch, null, 2)}

═══ ONE DESIGN SYSTEM ACROSS EVERY BATCH ═══
- Every section root is <section id="the-plan-id" class="site-section descriptive-section-class"> and contains a site-shell wrapper.
- Every repetition of the primary action uses the exact text "${brief.intent.primaryLabel}" and classes "site-cta site-cta--primary". Do not invent another primary button class, colour or label.
- Secondary actions use "site-cta site-cta--secondary" and remain visually subordinate.
- Shared components keep shared classes across sections. Use descriptive block__element classes only for section-specific composition.
- Keep generous whitespace and clear separation between content groups. Do not fill empty space with extra cards, badges or copy.
- The About section must visibly balance authentic imagery or brand treatment, ${brief.founder ? `owner identity (${brief.founder}, supported role: owner)` : "business identity"}, concise story and supported trust evidence. Use a real owner portrait as a balanced profile image when supplied; otherwise use honest project/team imagery without implying it depicts the owner. Preserve the image's natural proportions with an intentional square, 4:5 or editorial crop, never a stretched fixed-height box. Do not invent a logo, title, years of experience or metric.
- Credentials such as “licensed and insured” are a compact reassurance line or badge near the action. Never place that long phrase in an equal-width numeric metric cell beside a rating and review count.
- If this batch contains reviews, make it unmistakably testimonial content: build one accessible slider whose section has data-review-slider, a viewport with data-review-track, one slide article per supplied review, and previous/next buttons with data-review-prev and data-review-next plus aria-labels. Each slide shows the supplied rating visibly as repeated ★ characters, followed by a semantic blockquote containing only the verbatim quote in a <p> and supplied author in a <cite>. JavaScript-off fallback remains horizontally scrollable.
- Primary CTAs have enough inline space for the full label, never wrap word-by-word, and never share a narrow stats-grid column.
- If this batch contains FAQ, use the reviewed accordion data attributes from the interaction contract.
- No adjacent section may copy the same skeleton. Follow the planned archetypes and colour cadence, but leave all visual styling to the stylesheet pass.

═══ DESIGN DIRECTION ═══
Mood: ${dna.mood}; rhythm: ${dna.layout.sectionRhythm}; hero: ${dna.layout.heroTreatment}; services: ${dna.layout.serviceLayout}; proof: ${dna.layout.proofStyle}
Motifs: ${dna.motifs.join("; ") || "none specified"}
Why it works: ${dna.rationale}

═══ AVAILABLE IMAGES — exact URLs only, each at most once on the whole page ═══
${media.length ? media.map((item) => `[${item.slot}] ${item.url}\norigin: ${item.origin}; shows: ${item.caption}`).join("\n") : "None. Output no img tags."}
Only use media slots assigned to this batch's plan entries. Every image needs width, height, meaningful alt, and lazy loading except the hero.

═══ LINKS THAT EXIST ═══
${knownPaths.join("\n")}
Anything else becomes an on-page anchor. ${brief.phone ? `Phone links use tel:${brief.phone.replace(/[^\d+]/g, "")}.` : ""}

${HYGIENE_STANDARD}

${SPACE_STANDARD}

${PSYCHOLOGY_STANDARD}

${CONVERSION_STANDARD}

${PREMIUM_COMPOSITION_STANDARD}

ABOUT DIRECTION FOR THIS LEAD
${aboutDirectionFor(`${brief.businessName}|${brief.industry}|${brief.city}`)}

${INTERACTION_CONTRACT}

${truthStandard(brief.rating, brief.reviewCount)}

${
  brief.intent.primary !== "call-now" && brief.intent.primary !== "shop"
    ? `If this batch contains the hero, put one real data-lead-form inside it. Every later primary CTA uses data-open-quote-modal.`
    : brief.intent.secondary && brief.intent.secondary !== "call-now" && brief.intent.secondary !== "shop"
      ? `The secondary action uses data-open-quote-modal.`
      : ""
}

Reply with every assigned section exactly once, in batch order, using these exact delimiters and no prose or markdown fences:
${batch.map((section) => `<!-- SECTION:${section.id} -->\n<section id="${section.id}" class="site-section ...">...</section>\n<!-- /SECTION:${section.id} -->`).join("\n")}`;

  const raw = await callBestModel(prompt, {
    maxTokens: 16000,
    temperature: 0.65,
    system: "You are a senior web designer, conversion strategist and copywriter producing grounded semantic HTML. You execute an approved plan, preserve one shared component system across batches, and never invent facts.",
  }, provider);
  return raw ? parseSections(raw, batch) : null;
}
