import { callOpenAI } from "@/lib/openai-client";
import { sanitizeBespokeHtml } from "@/lib/sanitize-generated-html";
import type { DesignDna } from "@/lib/design-dna";

// The bespoke site generator.
//
// Two inputs, kept rigorously apart, exactly as the operator model
// describes them:
//
//   BRIEF  — the real business. Every claim, number, name, service and
//            review on the finished page must trace back to here.
//   DNA    — the visual system, reverse-engineered from a best-in-class
//            reference site. Contributes look only, never content.
//
// The generator writes markup against the closed `bs-*` vocabulary in
// bespoke.css. It cannot express a color, so it cannot go off-brand; it
// cannot reference a class that resolves to nothing, so it cannot render
// broken. That frees the prompt to spend its whole budget on composition
// and copy instead of policing the model's color choices.

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
  /** Real photo URLs. The generator may use these and nothing else. */
  photos: string[];
  heroImage: string | null;
  /** Compact digest of the lead's real scraped page content. */
  factsDigest: string;
  licensedInsured: boolean;
  leadSlug: string;
}

/** Only URLs the lead actually owns can appear in generated markup. */
function stripUnknownImages(html: string, allowed: string[]): string {
  if (allowed.length === 0) return html.replace(/<img\b[^>]*>/gi, "");
  const allowedSet = new Set(allowed);
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    return src && allowedSet.has(src) ? tag : "";
  });
}

/**
 * Internal links must resolve. A generated href pointing at a route that
 * was never built is a dead link on a page whose entire job is to look
 * more credible than what the client already has.
 */
function rewriteInternalLinks(html: string, brief: SiteBrief, knownPaths: Set<string>): string {
  const base = `/s/${brief.leadSlug}`;
  return html.replace(/href\s*=\s*["']([^"']+)["']/gi, (match, href: string) => {
    if (/^(https?:|tel:|mailto:|#)/i.test(href)) return match;
    const path = href.startsWith("/") ? href : `/${href}`;
    const normalised = path.startsWith(base) ? path.slice(base.length) || "/" : path;
    const clean = normalised.replace(/\/+$/, "") || "/";
    if (clean === "/" ) return `href="${base}"`;
    if (knownPaths.has(clean)) return `href="${base}${clean}"`;
    // Unknown route — collapse to the contact page rather than 404.
    return `href="${base}/contact"`;
  });
}

function dnaBlock(dna: DesignDna): string {
  return `DESIGN DIRECTION (reverse-engineered from a best-in-class reference site — this governs how the page LOOKS, and contributes nothing to what it SAYS):
- Overall mood: ${dna.mood}
- Hero treatment: ${dna.layout.heroTreatment}
- Section rhythm: ${dna.layout.sectionRhythm}
- Image density: ${dna.layout.imageDensity}
- Service presentation: ${dna.layout.serviceLayout}
- Proof presentation: ${dna.layout.proofStyle}
- Type scale: ${dna.typography.scale}, headings ${dna.typography.headingCase}
- Geometry: ${dna.geometry.radius} corners, ${dna.geometry.elevation} elevation
- Signature motifs to actually build, not just gesture at: ${dna.motifs.join("; ") || "none specified"}
- What makes the reference read premium: ${dna.rationale}`;
}

function briefBlock(brief: SiteBrief): string {
  const lines: string[] = [
    `Business name: ${brief.businessName}`,
    `Industry: ${brief.industry}`,
    `Primary city / service area: ${brief.city}`,
  ];
  if (brief.founder) lines.push(`Owner / founder: ${brief.founder}`);
  if (brief.phone) lines.push(`Real phone (use verbatim, in tel: links): ${brief.phone}`);
  if (brief.email) lines.push(`Real email: ${brief.email}`);
  if (brief.rating && brief.reviewCount) {
    lines.push(`Verified Google rating: ${brief.rating} stars from ${brief.reviewCount} reviews`);
  } else {
    lines.push(`Google rating: NOT VERIFIED — you must not state any rating, star count, or review count anywhere.`);
  }
  lines.push(
    brief.licensedInsured
      ? `The business states on its own site that it is licensed/insured — you may say so.`
      : `No licensing or insurance claim appears on the business's own site — you must NOT claim licensed, insured, bonded, or certified.`
  );
  lines.push(`Real services (use these exact names):\n${brief.services.map((s) => `  - ${s}`).join("\n")}`);
  if (brief.areas.length > 0) lines.push(`Real service areas:\n${brief.areas.map((a) => `  - ${a}`).join("\n")}`);
  if (brief.reviews.length > 0) {
    lines.push(
      `Real customer reviews (quote these verbatim or not at all — never write a new one):\n${brief.reviews
        .map((r) => `  - "${r.text.slice(0, 260)}" — ${r.author} (${r.rating}★)`)
        .join("\n")}`
    );
  } else {
    lines.push(`No review text is available — do NOT include testimonial quotes of any kind.`);
  }
  lines.push(`\nReal scraped content from the business's existing site:\n${brief.factsDigest}`);
  return lines.join("\n");
}

const VOCABULARY = `You write HTML using ONLY the class vocabulary below. Any class outside this list is stripped before render, so a page that invents class names renders unstyled. There are no Tailwind classes here and no inline colors — the palette, fonts, radii and spacing are already bound to this vocabulary for this specific business.

LAYOUT
  bs-section            a full page section (vertical rhythm + side padding)
  bs-section-tight      same, reduced vertical rhythm
  bs-wrap               centered max-width container (put inside bs-section)
  bs-wrap-narrow        centered narrow container, for prose
  bs-stack / bs-stack-sm / bs-stack-lg    vertical flex with small/normal/large gap
  bs-row                horizontal flex, wraps, vertically centered
  bs-row-between        horizontal flex, space-between
  bs-center             centers text (and any bs-row inside it)
  bs-grid-2 / bs-grid-3 / bs-grid-4       responsive equal grids
  bs-split              two-column split, stacks on mobile
  bs-split-wide         two-column split, wider first column
  bs-split-reverse      add alongside bs-split to flip column order on desktop
  bs-rows               editorial numbered rows (each child is one row)
  bs-bento              irregular bento grid (first child spans 2x2)

SURFACES
  bs-band-alt           subtle alternate background (on bs-section)
  bs-band-primary       solid brand-color band
  bs-band-gradient      brand gradient band
  bs-band-invert        high-contrast inverted band (dark on a light page)
  bs-card               elevated card with hover lift
  bs-card-flush         card with no padding (wrap inner content in bs-card-body)
  bs-card-body          padded body inside bs-card-flush
  bs-card-invert        inverted card
  bs-card-primary       brand-colored card

TYPE & ACCENTS
  bs-eyebrow            small uppercase label above a heading
  bs-lead               larger intro paragraph
  bs-muted              de-emphasised text
  bs-highlight          brand-colored text
  bs-accent-text        accent-colored text
  bs-pill               small rounded chip (trust signals, tags)
  bs-numeral            oversized ghosted number
  bs-divider            horizontal rule
  bs-rule-accent        short accent bar under a heading

BUTTONS
  bs-btn                base button (always combine with a variant)
  bs-btn-primary / bs-btn-accent / bs-btn-ghost
  bs-btn-lg             larger button
  bs-btn-block          full-width button

HERO
  bs-hero               hero section (use with bs-section)
  bs-hero-center        centered hero variant
  bs-hero-media         absolutely-positioned background image layer
  bs-hero-scrim         contrast scrim over bs-hero-media
  bs-hero-content       content layer above the scrim
  bs-hero-over          light-on-dark text, for content over an image

MEDIA
  bs-media              rounded, clipped image frame
  bs-ratio-square / bs-ratio-photo / bs-ratio-wide / bs-ratio-portrait

PROOF
  bs-stat / bs-stat-value / bs-stat-label     big number + caption
  bs-quote              left-bordered pull quote
  bs-stars              star row

LISTS
  bs-list               bulleted list with accent dots
  bs-list-plain         list with no bullets
  bs-faq-item           one question/answer block

DECOR
  bs-icon-badge         square badge for an inline SVG icon
  bs-edge-diagonal / bs-edge-diagonal-bottom    diagonal section edge
  bs-decor-orb + bs-decor-orb-tr / bs-decor-orb-bl   soft blurred glow

Inline style="" is permitted for LAYOUT ONLY (grid-template-columns, gap, aspect-ratio, max-width, text-align, order). Any color, background, font or shadow in a style attribute is stripped.`;

function homepagePrompt(brief: SiteBrief, dna: DesignDna, knownPaths: string[]): string {
  return `You are a senior web designer building the homepage for a real business. This page has one job: when the owner opens it, it must look so obviously better than the site they have now that it sells itself on sight. It goes to a human reviewer before the client ever sees it, so make confident, committed design decisions — a timid, evenly-spaced page of identical cards is the exact failure mode to avoid.

${dnaBlock(dna)}

THE REAL BUSINESS — every claim, number, name and quote on this page must come from here and nowhere else. Inventing a statistic, a certification, a guarantee, a years-in-business figure, a testimonial or a price is the single worst thing you can do:
${briefBlock(brief)}

REAL PHOTOS — these are the only image URLs that may appear in an <img src>. Any other URL is deleted before render. Use them generously if the design direction calls for image density:
${brief.photos.length > 0 ? brief.photos.map((u) => `  - ${u}`).join("\n") : "  (none available — build a strong page with NO <img> tags at all, using type, color bands and layout for impact)"}

INTERNAL LINKS — these are the only routes that exist. Link services to their own pages so the page feels like a real site, not a one-pager:
${knownPaths.map((p) => `  - ${p}`).join("\n")}
Write them as relative paths exactly as listed (e.g. href="/services/panel-upgrades"). Phone links must be tel: links.

${VOCABULARY}

STRUCTURE — build a complete homepage. Do NOT output a <header>, top nav, logo, or <footer>: those are real, separately-rendered components and anything you write there is deleted. Start at the hero, end at the final call-to-action.

Cover, in whatever order and treatment the design direction above genuinely calls for:
  1. A hero that commits to the specified hero treatment, with a headline naming this specific business's real trade and real city — not a generic industry slogan.
  2. A trust strip, but ONLY with signals that are real per the brief.
  3. The real services, presented in the specified service layout, each linking to its real service page.
  4. A substantive "why this business" section built from the real scraped content — specific, not "quality workmanship and customer satisfaction".
  5. Real proof in the specified proof style, only if real reviews or a real verified rating exist.
  6. The real service areas, if any.
  7. A genuinely useful FAQ answering what a real customer of this trade would ask, answered only from real facts.
  8. A closing call-to-action band with the real phone number.

SECTION ANCHORS — the real navigation links to these ids, so they must exist on the sections that carry that content, or those nav links scroll nowhere:
  id="services" on the services section
  id="about" on the "why this business" section
  id="reviews" on the proof section (only if you built one)
  id="faq" on the FAQ section
  id="contact" on the closing call-to-action section

QUALITY BAR — these are the things that separate a premium page from a template:
  - Vary your section surfaces. A page where every section is the same background is the template look you are replacing. Use bs-band-alt, bs-band-invert, bs-band-primary and bs-band-gradient deliberately.
  - Vary your layouts. Do not use bs-grid-3 for every section. Split layouts, editorial rows and bento grids exist for this reason.
  - Actually build the signature motifs listed in the design direction.
  - Write real, specific copy. Every sentence a competitor in this trade could paste onto their own site unchanged is a sentence that has failed.
  - Headlines should be short and confident. Body copy should be concrete.

Reply with EXACTLY this format:
RATIONALE: one sentence on the design decisions you committed to
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
 * One critique/revise cycle on the generated markup.
 *
 * Deliberately bounded to a single pass. The measurable wins here are
 * catching invented claims and catching the "every section looks the same"
 * regression; further passes mostly churn wording while doubling cost.
 */
async function critiqueAndRevise(html: string, brief: SiteBrief, dna: DesignDna): Promise<string> {
  const critique = await callOpenAI(
    `Review this generated homepage against its brief. Be specific and terse. Reply with exactly "APPROVED" if it passes everything, otherwise list only the concrete problems.

Check for:
1. INVENTED FACTS — any statistic, certification, guarantee, years-in-business, award, price or testimonial not present in the brief below. This is the most serious failure.
2. MONOTONY — does every section use the same background and the same grid? A premium page varies surface and layout.
3. GENERIC COPY — sentences a competitor could reuse verbatim ("quality workmanship", "customer satisfaction is our priority", "we go the extra mile").
4. DESIGN DIRECTION — were the specified hero treatment, service layout, proof style and signature motifs actually built?
5. Empty or placeholder content ("Lorem", "TODO", "[insert]", empty headings).

BRIEF:
${briefBlock(brief)}

DESIGN DIRECTION:
${dnaBlock(dna)}

PAGE:
${html.slice(0, 60000)}`,
    { maxTokens: 1500, temperature: 0.2 }
  );

  if (!critique || critique.trim().toUpperCase().startsWith("APPROVED")) return html;

  const revised = await callOpenAI(
    `Revise this homepage to fix the problems listed. Keep everything that already works — this is a targeted fix, not a rewrite. Stay strictly within the same class vocabulary, and never add a fact that is not in the brief.

PROBLEMS TO FIX:
${critique}

BRIEF (the only permitted source of facts):
${briefBlock(brief)}

CURRENT PAGE:
${html}

Reply with the corrected HTML body fragment only — no rationale line, no markdown fences.`,
    { maxTokens: 20000, temperature: 0.5 }
  );

  if (!revised) return html;
  return revised.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

export interface BespokeResult {
  html: string;
  rationale: string;
}

export async function generateBespokeHomepage(
  brief: SiteBrief,
  dna: DesignDna,
  knownPaths: string[]
): Promise<BespokeResult | null> {
  const raw = await callOpenAI(homepagePrompt(brief, dna, knownPaths), {
    maxTokens: 24000,
    temperature: 0.85,
    system:
      "You are a senior web designer who writes production HTML. You never invent facts about a business. You never use classes outside the vocabulary you are given.",
  });
  if (!raw) return null;

  const { rationale, html } = splitRationale(raw);
  if (!html) return null;

  const revised = await critiqueAndRevise(html, brief, dna);
  const pathSet = new Set(knownPaths);

  const finalHtml = sanitizeBespokeHtml(
    rewriteInternalLinks(stripUnknownImages(revised, brief.photos), brief, pathSet)
  );

  if (finalHtml.replace(/<[^>]+>/g, "").trim().length < 200) return null;

  return {
    html: finalHtml,
    rationale: rationale || `Bespoke homepage built to a ${dna.mood} direction drawn from ${dna.sourceName}.`,
  };
}

/**
 * Inner pages. Deliberately a single pass with no critique cycle — they are
 * shorter, lower-stakes, and there are many of them per site. The homepage
 * is where the generation budget belongs.
 */
export async function generateBespokePage(
  brief: SiteBrief,
  dna: DesignDna,
  knownPaths: string[],
  page: { kind: "service" | "area" | "about" | "faq" | "contact"; title: string; subject?: string }
): Promise<string | null> {
  const intent: Record<typeof page.kind, string> = {
    service: `A dedicated page for the real service "${page.subject}". Explain what it actually involves for a customer in ${brief.city}, what the process looks like, and who it is for — grounded only in the brief. Include a short FAQ specific to this service and a strong closing call to action.`,
    area: `A local page for "${page.subject}". Explain the real services offered there and why a local customer would choose this business. Never invent landmarks, population figures, or local claims not in the brief.`,
    about: `The About page. Tell this business's real story using only what the brief contains${brief.founder ? `, centred on ${brief.founder}` : ""}. If the brief is thin, write a short honest page rather than padding it with invented history.`,
    faq: `A full FAQ page answering what real customers of this trade ask. Answer only from the brief; omit any question the brief cannot honestly answer.`,
    contact: `The Contact page. Make the real phone number and email unmissable, state the real service areas, and set a clear expectation about getting in touch. Do not invent opening hours.`,
  };

  const raw = await callOpenAI(
    `You are building the "${page.title}" page for a real business's website. It must feel like it belongs to the same site as the homepage — same design system, same voice.

${dnaBlock(dna)}

PAGE INTENT: ${intent[page.kind]}

THE REAL BUSINESS — the only permitted source of facts:
${briefBlock(brief)}

REAL PHOTOS (the only usable image URLs):
${brief.photos.length > 0 ? brief.photos.slice(0, 10).map((u) => `  - ${u}`).join("\n") : "  (none — use no <img> tags)"}

INTERNAL LINKS that exist:
${knownPaths.map((p) => `  - ${p}`).join("\n")}

${VOCABULARY}

Begin with a page-opening section carrying the page title as an <h1>, then the real content, then a closing call-to-action band with the real phone number. No <header>, no nav, no <footer>.

Reply with the HTML body fragment only — no rationale, no markdown fences.`,
    { maxTokens: 12000, temperature: 0.75, system: "You are a senior web designer who writes production HTML and never invents facts." }
  );

  if (!raw) return null;
  const cleaned = raw.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const finalHtml = sanitizeBespokeHtml(
    rewriteInternalLinks(stripUnknownImages(cleaned, brief.photos), brief, new Set(knownPaths))
  );
  return finalHtml.replace(/<[^>]+>/g, "").trim().length < 120 ? null : finalHtml;
}
