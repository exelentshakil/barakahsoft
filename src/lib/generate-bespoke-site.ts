import { callOpenAI } from "@/lib/openai-client";
import { sanitizeBespokeHtml } from "@/lib/sanitize-generated-html";
import type { DesignDna } from "@/lib/design-dna";
import type { CopyPlan } from "@/lib/generate-copy-plan";
import type { MediaPlan } from "@/lib/media/plan-media";

// The markup pass.
//
// Three inputs, each decided by a step whose only job was that decision:
//
//   COPY  — what the page says (generate-copy-plan.ts, already critiqued)
//   DNA   — how it looks (design-dna.ts, from a reference site)
//   MEDIA — which image goes in which slot, and what each one shows
//           (media/plan-media.ts, captioned by vision)
//
// This step lays those out. It does not write copy and it does not choose
// images, because a single call asked to do all three did none of them
// well: it narrated the brief instead of selling, and placed photographs by
// position instead of by subject.

export interface SiteBrief {
  businessName: string;
  industry: string;
  city: string;
  founder: string | null;
  phone: string | null;
  email: string | null;
  services: string[];
  areas: string[];
  rating: number | null;
  reviewCount: number | null;
  reviews: { author: string; rating: number; text: string }[];
  /** Real photo URLs from the client's own site and Google profile. */
  photos: string[];
  heroImage: string | null;
  /** Compact digest of the lead's real scraped page content. */
  factsDigest: string;
  licensedInsured: boolean;
  leadSlug: string;
}

/** Only Storage URLs planned for this page may appear in its markup. */
function stripUnplannedImages(html: string, allowed: string[]): string {
  if (allowed.length === 0) return html.replace(/<img\b[^>]*>/gi, "");
  const allowedSet = new Set(allowed);
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    return src && allowedSet.has(src) ? tag : "";
  });
}

/**
 * Internal links must resolve. A dead link on a page whose entire job is to
 * look more credible than the client's current site is self-defeating.
 */
function rewriteInternalLinks(html: string, brief: SiteBrief, knownPaths: Set<string>): string {
  const base = `/s/${brief.leadSlug}`;
  return html.replace(/href\s*=\s*["']([^"']+)["']/gi, (match, href: string) => {
    if (/^(https?:|tel:|mailto:|#)/i.test(href)) return match;
    const path = href.startsWith("/") ? href : `/${href}`;
    const normalised = path.startsWith(base) ? path.slice(base.length) || "/" : path;
    const clean = normalised.replace(/\/+$/, "") || "/";
    if (clean === "/") return `href="${base}"`;
    if (knownPaths.has(clean)) return `href="${base}${clean}"`;

    // A route that has not been built yet becomes an anchor to the matching
    // homepage section rather than a link to a 404 or a catch-all redirect.
    // During the sales window the homepage IS the site, so every nav target
    // has to resolve to something real on the page in front of the client.
    const slug = clean.split("/").filter(Boolean).pop();
    return slug ? `href="#${slug}"` : `href="${base}"`;
  });
}

function dnaBlock(dna: DesignDna): string {
  return `DESIGN DIRECTION — drawn from a best-in-class reference site. This governs layout and treatment only:
- Mood: ${dna.mood}
- Hero treatment: ${dna.layout.heroTreatment}
- Section rhythm: ${dna.layout.sectionRhythm}
- Image density: ${dna.layout.imageDensity}
- Service presentation: ${dna.layout.serviceLayout}
- Proof presentation: ${dna.layout.proofStyle}
- Type scale: ${dna.typography.scale}, headings ${dna.typography.headingCase}
- Geometry: ${dna.geometry.radius} corners, ${dna.geometry.elevation} elevation
- Signature motifs you must actually build, not gesture at: ${dna.motifs.join("; ") || "none specified"}`;
}

function mediaBlock(media: MediaPlan): string {
  if (media.length === 0) {
    return `IMAGES: none are available for this page. Build it with type, colour bands and layout alone — and make that a deliberate editorial choice rather than a page with gaps where photos should be. Do not output any <img> tag.`;
  }
  return `IMAGES — these exact URLs, each already matched to a slot, with a description of what it genuinely shows. Use the image whose subject fits the section you are building. Never place an image in a section it does not depict, and never reuse the same image twice on one page. Any src not in this list is deleted before render:
${media.map((m) => `  [${m.slot}] ${m.url}\n      shows: ${m.caption}`).join("\n")}

Every <img> needs a real alt attribute describing what the photo shows.`;
}

const VOCABULARY = `CLASS VOCABULARY — you may use only these. Any other class is stripped, so invented class names render unstyled. There are no Tailwind classes and no colours here: palette, fonts, radii and spacing are already bound to this vocabulary for this specific business.

LAYOUT
  bs-section            a page section (vertical rhythm + side padding)
  bs-section-tight      same, reduced vertical rhythm
  bs-wrap               centered max-width container (goes inside bs-section)
  bs-wrap-narrow        centered narrow container, for prose
  bs-stack / bs-stack-sm / bs-stack-lg    vertical flex, small/normal/large gap
  bs-row                horizontal flex, wraps, vertically centered
  bs-row-between        horizontal flex, space-between
  bs-center             centers text (and any bs-row inside it)
  bs-grid-2 / bs-grid-3 / bs-grid-4       responsive equal grids
  bs-split              two-column split, stacks on mobile
  bs-split-wide         two-column split, wider first column
  bs-split-reverse      with bs-split, flips column order on desktop
  bs-rows               editorial rows (each child is one row)
  bs-bento              irregular bento grid (first child spans 2x2)

SURFACES
  bs-band-alt / bs-band-primary / bs-band-gradient / bs-band-invert
  bs-card / bs-card-flush (+ bs-card-body) / bs-card-invert / bs-card-primary

TYPE & ACCENTS
  bs-eyebrow  bs-lead  bs-muted  bs-highlight  bs-accent-text
  bs-pill  bs-numeral  bs-divider  bs-rule-accent

BUTTONS
  bs-btn (always with a variant) + bs-btn-primary | bs-btn-accent | bs-btn-ghost
  bs-btn-lg  bs-btn-block

HERO
  bs-hero  bs-hero-center  bs-hero-media  bs-hero-scrim  bs-hero-content  bs-hero-over

MEDIA
  bs-media  bs-ratio-square  bs-ratio-photo  bs-ratio-wide  bs-ratio-portrait

PROOF
  bs-stat  bs-stat-value  bs-stat-label  bs-quote  bs-stars

LISTS
  bs-list  bs-list-plain  bs-faq-item

DECOR
  bs-icon-badge  bs-edge-diagonal  bs-edge-diagonal-bottom
  bs-decor-orb (+ bs-decor-orb-tr | bs-decor-orb-bl)

inline style="" is allowed for LAYOUT ONLY (grid-template-columns, gap, aspect-ratio, max-width, text-align, order). Colours, fonts and shadows in a style attribute are stripped.`;

const ANCHORS = `SECTION ANCHORS — the site's real navigation links to these ids, so they must appear on the section carrying that content or those links scroll nowhere:
  id="services"  id="about"  id="reviews"  id="faq"  id="contact"`;

function copyBlock(copy: CopyPlan): string {
  return `THE COPY — this is written and approved. Lay it out. You may not rewrite it, shorten it into fragments, or add new sentences of your own. Headings, body copy and button labels appear exactly as given.

Headline: ${copy.headline}
Subhead: ${copy.subhead}
Hero button: ${copy.heroCta}
${copy.trustChips.length > 0 ? `Trust chips: ${copy.trustChips.join(" | ")}` : "Trust chips: none — do not invent any"}

Sections, in the order you judge best for this design direction:
${copy.sections
  .map(
    (s) =>
      `  [${s.id}]\n    eyebrow: ${s.eyebrow}\n    heading: ${s.heading}\n    body: ${s.body}${
        s.bullets.length > 0 ? `\n    bullets:\n${s.bullets.map((b) => `      - ${b}`).join("\n")}` : ""
      }`
  )
  .join("\n")}

${
  copy.services.length > 0
    ? `Services, each linking to its own page:\n${copy.services.map((s) => `  - ${s.name}: ${s.blurb}`).join("\n")}`
    : "No service list."
}

${copy.faq.length > 0 ? `FAQ:\n${copy.faq.map((f) => `  Q: ${f.question}\n  A: ${f.answer}`).join("\n")}` : "No FAQ."}

Closing call to action:
  heading: ${copy.closing.heading}
  body: ${copy.closing.body}
  button: ${copy.closing.cta}`;
}

function homepagePrompt(brief: SiteBrief, copy: CopyPlan, dna: DesignDna, media: MediaPlan, knownPaths: string[]): string {
  return `You are a senior web designer building the homepage for a real ${brief.industry} business in ${brief.city}. The copy is already written and the photography is already chosen. Your job is composition: turn this into a page that looks unmistakably more expensive than whatever this business has now.

${dnaBlock(dna)}

${copyBlock(copy)}

${mediaBlock(media)}

INTERNAL LINKS — the only routes that exist. Write them exactly as listed:
${knownPaths.map((p) => `  - ${p}`).join("\n")}
${brief.phone ? `Phone links must be tel:${brief.phone.replace(/[^\d+]/g, "")}` : "There is no phone number — use the contact page for every call to action."}

${VOCABULARY}

${ANCHORS}

SERVICE ANCHORS — the service pages are not built yet, so each service links to its own section on THIS page. Give every service block an id of its slug (lowercase, hyphenated, e.g. id="panel-upgrades") and link to it with href="#panel-upgrades". The client must be able to click any nav item and land somewhere real.

Do NOT output a <header>, nav, logo or <footer>. Those are separate real components rendered around your output, and anything you write there is deleted. Begin at the hero, end at the closing call to action.

COMPOSITION BAR — this is what separates a premium page from a template:
  - Vary section surfaces deliberately. A page where every section sits on the same background is the template look being replaced. Use bs-band-alt, bs-band-invert, bs-band-primary and bs-band-gradient with intent.
  - Vary layout. Do not reach for bs-grid-3 every time. Splits, editorial rows and bento grids exist precisely so consecutive sections do not rhyme.
  - Build the signature motifs named in the design direction.
  - Give the hero real presence. It is the whole first impression.
  - Place every image in the section its description actually matches.
  - Whitespace is structural, not leftover. Sections should breathe according to the specified rhythm.

Reply with EXACTLY this format:
RATIONALE: one sentence on the composition decisions you committed to
---PAGE---
<the HTML body fragment, nothing else, no markdown fences>`;
}

const RATIONALE_PREFIX = /^RATIONALE:\s*(.*?)\s*\n+---PAGE---\s*\n/i;

function splitRationale(raw: string): { rationale: string; html: string } {
  const trimmed = raw.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const match = trimmed.match(RATIONALE_PREFIX);
  if (!match) return { rationale: "", html: trimmed };
  return { rationale: match[1].trim(), html: trimmed.slice(match[0].length).trim() };
}

/**
 * One critique/revise cycle on COMPOSITION only.
 *
 * The copy was already written and edited by a pass whose sole job was
 * voice, and the images were already matched by subject. Re-litigating
 * either here produced a reviewer that graded everything shallowly and
 * caught nothing. This pass looks at layout, surface variety, image
 * placement and whether the design direction was actually executed.
 */
async function critiqueComposition(html: string, dna: DesignDna, media: MediaPlan): Promise<string> {
  const critique = await callOpenAI(
    `Review this generated homepage as a design director. Reply with exactly "APPROVED" if it passes, otherwise list only the concrete problems, briefly.

Check:
1. MONOTONY — do consecutive sections use the same background and the same grid? Does the page rhyme with itself?
2. DESIGN DIRECTION — were the specified hero treatment, service layout, proof style and signature motifs actually built, or only gestured at?
3. IMAGE PLACEMENT — is any image in a section its description does not match? Is any image used twice?
4. HERO — does it have real presence, or is it a headline on a plain background?
5. STRUCTURE — empty sections, headings with no content beneath them, a section anchor id that is missing.

${dnaBlock(dna)}

IMAGE DESCRIPTIONS:
${media.map((m) => `  ${m.url} shows: ${m.caption}`).join("\n") || "  none"}

PAGE:
${html.slice(0, 70000)}`,
    { maxTokens: 12000, temperature: 0.2 }
  );

  if (!critique || critique.trim().toUpperCase().startsWith("APPROVED")) return html;

  const revised = await callOpenAI(
    `Fix these composition problems. This is a targeted revision, not a rewrite — keep everything that already works, and do not change any of the wording.

PROBLEMS:
${critique}

CURRENT PAGE:
${html}

Reply with the corrected HTML body fragment only — no rationale line, no markdown fences.`,
    { maxTokens: 40000, temperature: 0.5 }
  );

  if (!revised) return html;
  return revised.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

export interface BespokeResult {
  html: string;
  rationale: string;
}

function finalise(html: string, brief: SiteBrief, media: MediaPlan, knownPaths: string[]): string {
  return sanitizeBespokeHtml(
    rewriteInternalLinks(
      stripUnplannedImages(html, media.map((m) => m.url)),
      brief,
      new Set(knownPaths)
    )
  );
}

export async function generateBespokeHomepage(
  brief: SiteBrief,
  copy: CopyPlan,
  dna: DesignDna,
  media: MediaPlan,
  knownPaths: string[]
): Promise<BespokeResult | null> {
  const raw = await callOpenAI(homepagePrompt(brief, copy, dna, media, knownPaths), {
    maxTokens: 48000,
    temperature: 0.8,
    system:
      "You are a senior web designer who writes production HTML. You lay out copy exactly as given without rewriting it, and you use only the class vocabulary you are handed.",
  });
  if (!raw) return null;

  const { rationale, html } = splitRationale(raw);
  if (!html) return null;

  const finalHtml = finalise(await critiqueComposition(html, dna, media), brief, media, knownPaths);
  if (finalHtml.replace(/<[^>]+>/g, "").trim().length < 400) return null;

  return {
    html: finalHtml,
    rationale: rationale || `Composed to a ${dna.mood} direction drawn from ${dna.sourceName}.`,
  };
}

export type InnerPageKind = "service" | "area" | "location-service" | "about" | "faq" | "contact" | "blog-index" | "blog-post";

export interface InnerPageRequest {
  kind: InnerPageKind;
  title: string;
  subject?: string;
  area?: string;
}

/**
 * Inner pages.
 *
 * Copy and layout in one call here, deliberately: an inner page is a
 * narrower brief with a settled house voice already demonstrated by the
 * homepage, and there are many of them per site. The homepage is where the
 * multi-pass budget belongs.
 */
export async function generateBespokePage(
  brief: SiteBrief,
  copy: CopyPlan,
  dna: DesignDna,
  media: MediaPlan,
  knownPaths: string[],
  page: InnerPageRequest
): Promise<string | null> {
  const intent: Record<InnerPageKind, string> = {
    service: `A page dedicated to "${page.subject}". Explain what it actually involves for a customer in ${brief.city}: what happens, what it solves, who needs it, what to expect when they call. Include a short FAQ specific to this service.`,
    area: `A local page for ${page.area}. Cover the real services offered there and why a local customer would choose this business. Never invent landmarks, population figures or local history.`,
    "location-service": `A page for "${page.subject}" specifically in ${page.area}. Write for someone in ${page.area} searching for exactly this. Keep it genuinely useful rather than a find-and-replace of the main service page — lead with what is different about doing this work in this area, drawn only from real facts.`,
    about: `The About page. Tell this business's real story from the facts${brief.founder ? `, centred on ${brief.founder}` : ""}. If the facts are thin, write a short honest page rather than padding it with invented history.`,
    faq: `A full FAQ answering what real customers of this trade ask before calling. Answer from the facts; omit any question the facts cannot honestly answer.`,
    contact: `The Contact page. Make the real phone number and email unmissable and state the real service areas. Do not invent opening hours.`,
    "blog-index": `An index of the articles listed below. A short intro, then the articles as cards linking to their own pages.`,
    "blog-post": `An article titled "${page.title}". Genuinely useful, specific to this trade, written for a homeowner or business owner researching the problem. Never present a business claim as fact unless it is in the facts below.`,
  };

  const raw = await callOpenAI(
    `You are building the "${page.title}" page for a real ${brief.industry} business in ${brief.city}. It must feel like the same site as the homepage — same design system, same voice.

VOICE REFERENCE — the homepage's approved copy, for tone only. Do not repeat it:
  Headline: ${copy.headline}
  Subhead: ${copy.subhead}

${dnaBlock(dna)}

PAGE INTENT: ${intent[page.kind]}

THE FACTS — the only permitted source of claims. Never state a price, a certification, a guarantee, a rating or a testimonial that is not here:
  Business: ${brief.businessName}${brief.founder ? `, owner ${brief.founder}` : ""}
  Serves: ${brief.city}${brief.areas.length > 0 ? ` and ${brief.areas.slice(0, 10).join(", ")}` : ""}
  ${brief.phone ? `Phone: ${brief.phone}` : "No phone number available"}
  ${brief.email ? `Email: ${brief.email}` : ""}
  ${brief.rating && brief.reviewCount ? `Google: ${brief.rating} stars from ${brief.reviewCount} reviews` : "No verified rating — never mention ratings or reviews"}
  ${brief.licensedInsured ? "States it is licensed and insured on its own site" : "No licensing or insurance claim exists — never claim it"}
  Services: ${brief.services.join(" | ")}

${brief.factsDigest.slice(0, 3000)}

${mediaBlock(media)}

INTERNAL LINKS that exist:
${knownPaths.map((p) => `  - ${p}`).join("\n")}

${VOCABULARY}

Write real copy — never narrate the business's data, never count things in a heading, never use filler like "quality workmanship" or "committed to excellence". Open with a section carrying the page title as an <h1>, then the real content, then a closing call to action.

No <header>, no nav, no <footer>. Reply with the HTML body fragment only — no markdown fences.`,
    {
      maxTokens: 28000,
      temperature: 0.8,
      system: "You are a senior web designer and copywriter. You never invent facts and you never write filler.",
    }
  );

  if (!raw) return null;
  const cleaned = raw.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const finalHtml = finalise(cleaned, brief, media, knownPaths);
  return finalHtml.replace(/<[^>]+>/g, "").trim().length < 200 ? null : finalHtml;
}
