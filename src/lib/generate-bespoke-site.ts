import { callOpenAI } from "@/lib/openai-client";
import { sanitizeBespokeHtml } from "@/lib/sanitize-generated-html";
import type { DesignDna } from "@/lib/design-dna";
import type { MediaPlan } from "@/lib/media/plan-media";
import type { ConversionIntent } from "@/lib/conversion-intent";

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
  aboutContent: string | null;
  services: string[];
  areas: string[];
  rating: number | null;
  reviewCount: number | null;
  reviews: { author: string; rating: number; text: string; avatar?: string | null; when?: string | null }[];
  /** Social profiles found during the scrape. */
  socials: string[];
  /** Where to read this business's real Google reviews, when we know. */
  googleReviewUrl: string | null;
  /** Facebook proof, entered by the operator — it cannot be scraped. */
  facebookRating: number | null;
  facebookReviewCount: number | null;
  /** Resolved once per lead so no two leads ship the same composition. */
  layoutSalt: number;
  /**
   * Manufacturer and trade accreditations — GAF Master Elite, Owens Corning
   * Preferred, BBB. The credential this trade cares most about, and the one
   * most of their own sites bury in the footer.
   *
   * Never inferred. Nothing scrapes these reliably, and a certification a
   * business does not hold is the worst possible thing to print on their
   * homepage, so it is empty until an operator types it in.
   */
  certifications: string[];
  /** Real photo URLs from the client's own site and Google profile. */
  photos: string[];
  heroImage: string | null;
  /** Compact digest of the lead's real scraped page content. */
  factsDigest: string;
  licensedInsured: boolean;
  leadSlug: string;
  /** What the client ticked on the intake form, as build instructions. */
  painInstructions: string[];
  /** What this page is for, and how to build around it. */
  intent: ConversionIntent;
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

/** Sanitize, restrict images to the planned set, and resolve internal links. */
function finalise(html: string, brief: SiteBrief, media: MediaPlan, knownPaths: string[]): string {
  return sanitizeBespokeHtml(
    rewriteInternalLinks(
      stripUnplannedImages(html, media.map((m) => m.url)),
      brief,
      new Set(knownPaths)
    )
  );
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

export const VOCABULARY_REFERENCE = `CLASS VOCABULARY — you may use only these. Any other class is stripped, so invented class names render unstyled. There are no Tailwind classes and no colours here: palette, fonts, radii and spacing are already bound to this vocabulary for this specific business.

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

export type InnerPageKind = "service" | "area" | "location-service" | "about" | "faq" | "contact";

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
  /** The approved homepage, as a voice reference. Null before one exists. */
  voiceSample: string | null,
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
  };

  const raw = await callOpenAI(
    `You are building the "${page.title}" page for a real ${brief.industry} business in ${brief.city}. It must feel like the same site as the homepage — same design system, same voice.

${
  voiceSample
    ? `VOICE REFERENCE — the approved homepage this page must sound like. Match its tone; never repeat its sentences:\n${voiceSample.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 1200)}`
    : "No homepage exists yet — write in the plain, specific voice described below."
}

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

${VOCABULARY_REFERENCE}

Write real copy — never narrate the business's data, never count things in a heading, never use filler like "quality workmanship" or "committed to excellence". Open with a section carrying the page title as an <h1>, then the real content, then a closing call to action.

THE CALL TO ACTION IS A REAL MECHANISM. Put data-open-quote-modal on it (a <button> or <a>): that opens the site's real lead-capture form, which is already built, validated and wired to email the business owner. Never write your own <form> — there is nowhere for a model-authored form to submit to, so it would only look like it works. Where a phone number exists, pair it with a tel: link.

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
