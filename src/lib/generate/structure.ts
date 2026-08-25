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
  MASTER_HERO_STANDARD,
  MASTER_ABOUT_STANDARD,
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
  provider: GenerationProvider = "openai",
  model?: string
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
- Every section root is <section id="the-plan-id" class="site-section {name}"> where {name} is a class YOU choose describing that section, e.g. class="site-section hero-split" or class="site-section services-index". Never emit the word "descriptive-section-class" — it is a placeholder, not a class name, and every section carrying it is how nine sections end up sharing one block class and looking identical.
- Every repetition of the primary action uses the exact text "${brief.intent.primaryLabel}" and classes "site-cta site-cta--primary". Do not invent another primary button class, colour or label.
- Secondary actions use "site-cta site-cta--secondary" and remain visually subordinate.
- Shared components keep shared classes across sections. Use descriptive block__element classes only for section-specific composition.
- Keep generous whitespace and clear separation between content groups. Do not fill empty space with extra cards, badges or copy.
- The About section must visibly balance authentic imagery or brand treatment, ${brief.founder ? `owner identity (${brief.founder}, supported role: owner)` : "business identity"}, concise story and supported trust evidence. Use a real owner portrait as a balanced profile image when supplied; otherwise use honest project/team imagery without implying it depicts the owner. Preserve the image's natural proportions with an intentional square, 4:5 or editorial crop, never a stretched fixed-height box. Do not invent a logo, title, years of experience or metric.
- Credentials such as “licensed and insured” are a compact reassurance line or badge near the action. Never place that long phrase in an equal-width numeric metric cell beside a rating and review count.
- If this batch contains reviews, make it unmistakably testimonial content: build one accessible slider whose section has data-review-slider, a header with section title and sleek circular arrow icon buttons:
  - Previous button: <button type="button" data-review-prev aria-label="Previous review" class="site-slider-btn site-slider-btn--prev"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
  - Next button: <button type="button" data-review-next aria-label="Next review" class="site-slider-btn site-slider-btn--next"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
  NEVER write the raw text words "Previous" or "Next" inside review buttons — use the vector SVG arrow icons above.
  Each slide is an equal-height card (display: flex; flex-direction: column; justify-content: space-between) showing the supplied rating as ★★★★★ in gold (#f59e0b), followed by a semantic blockquote containing only the verbatim quote in a <p>, and an author block in a <cite> with a verified customer badge. JavaScript-off fallback remains horizontally scrollable.
- If this batch contains areas, build a high-impact 2-column territory section: left column lists the headline, dispatch reassurance, and interactive location badges/pills for every target city/area (${brief.areas.join(", ") || brief.city}); right column renders a live Google Maps embed: <iframe src="https://maps.google.com/maps?q=${encodeURIComponent(brief.city + (brief.areas.length ? ' ' + brief.areas[0] : ''))}&t=&z=10&ie=UTF8&iwloc=&output=embed" width="100%" height="400" style="border:0; border-radius: 16px;" loading="lazy" title="${brief.businessName} Service Territory Map"></iframe>. Never draw fake dots or abstract yellow boxes.
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

${MASTER_HERO_STANDARD}

${MASTER_ABOUT_STANDARD}

${HYGIENE_STANDARD}

${SPACE_STANDARD}

${PSYCHOLOGY_STANDARD}

${CONVERSION_STANDARD}

${PREMIUM_COMPOSITION_STANDARD}

${INTERACTION_CONTRACT}

${truthStandard(brief.rating, brief.reviewCount)}

═══ HERO & LEAD CONVERSION REQUIREMENT ═══
If this batch contains the hero section (id="hero"):
${
  brief.intent.primary === "shop"
    ? `- For this e-commerce business, feature high-impact product collection CTAs: <a href="#products" class="site-cta site-cta--primary">${brief.intent.primaryLabel}</a> paired with <a href="#about" class="site-cta site-cta--secondary">Learn More</a>.`
    : `- For this service/appointment/contractor business, include a high-converting, styled lead capture form ([data-lead-form]) in the hero left column above the fold!
  Form fields:
    name="name" (text, required, placeholder="Your Full Name")
    name="phone" (tel, required, placeholder="Phone Number")
    name="email" (email, optional, placeholder="Email Address")
    name="service" (<select> with the business's real services, optional)
    <button type="submit" class="site-cta site-cta--primary">${brief.intent.primaryLabel || "Get Free Quote / Fast Callback"}</button>
    <div data-lead-form-message></div>
- Pair with direct click-to-call phone link: <a href="tel:${brief.phone ? brief.phone.replace(/[^\d+]/g, "") : ""}" class="site-cta site-cta--secondary">Call ${brief.phone || "(XXX) XXX-XXXX"}</a>.`
}
- Every later primary CTA button further down the page uses data-open-quote-modal.

Reply with every assigned section exactly once, in batch order, using these exact delimiters and no prose or markdown fences:
${batch.map((section) => `<!-- SECTION:${section.id} -->\n<section id="${section.id}" class="site-section ...">...</section>\n<!-- /SECTION:${section.id} -->`).join("\n")}`;

  const raw = await callBestModel(prompt, {
    maxTokens: 16000,
    temperature: 0.65,
    system: "You are a senior web designer, conversion strategist and copywriter producing grounded semantic HTML. You execute an approved plan, preserve one shared component system across batches, and never invent facts.",
    model,
  }, provider);
  return raw ? parseSections(raw, batch) : null;
}
