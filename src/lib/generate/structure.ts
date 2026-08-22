import { callOpenAI, bestModelChain } from "@/lib/openai-client";
import type { SiteBrief } from "@/lib/generate-bespoke-site";
import type { DesignDna } from "@/lib/design-dna";
import type { MediaPlan } from "@/lib/media/plan-media";

// Pass one: the page itself — structure and words together.
//
// Copy and layout are decided in the same call because they are the same
// decision: a headline's length constrains a hero, and a section's shape
// determines how much can be said in it. Splitting them, which this
// codebase tried, produced strong copy arranged badly.
//
// What changed here is that the model now names its own classes. It used to
// compose from a fixed vocabulary, which capped layout quality at whatever
// had been pre-built — content came out good and the arrangement did not.
// The stylesheet pass writes rules for exactly these class names, so the
// old failure mode of a class resolving to nothing cannot occur.

export const INTERACTION_CONTRACT = `INTERACTIONS — the page gets motion and behaviour by requesting it with data attributes. A reviewed script in the application implements these. Do not write <script> tags; they are stripped.

  data-reveal                  fade and rise this element when it scrolls into view
  data-reveal-delay="120"      stagger, in milliseconds — use on siblings for a sequence
  data-count-to="273"          animate a number up to this value on first view.
                               Put the FINAL value in the element's text as well, so it is
                               correct without script and for search engines.
  data-count-suffix="+"        appended to the counted number
  data-accordion               a group; each child with data-accordion-item opens one at a time
  data-accordion-item          one item; it gets data-open="true|false" which you style
  data-accordion-trigger       the clickable header inside an item
  data-bar="4.9"               a proportional bar; pair with data-bar-max="5"
  data-bar-fill                the inner element whose width is animated

The page root also gets data-scrolled="true" once scrolled past 40px, which you may style against.

Use these deliberately and sparingly. A reveal on every element is noise; a reveal on section headings and a staggered service grid is craft.`;

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
      ? `Google: ${brief.rating} stars from ${brief.reviewCount} reviews — verified, lead with it`
      : `NO verified rating exists. Never mention ratings, stars or review counts.`
  );
  lines.push(
    brief.licensedInsured
      ? `They state on their own site that they are licensed and insured — you may say so.`
      : `No licensing or insurance claim exists. Never claim licensed, insured, bonded or certified.`
  );
  lines.push(`Their real services:\n${brief.services.map((s) => `  - ${s}`).join("\n")}`);

  lines.push(
    brief.reviews.length > 0
      ? `Real reviews — quote verbatim or not at all:\n${brief.reviews.map((r) => `  "${r.text.slice(0, 260)}" — ${r.author}`).join("\n")}`
      : `No review text available. Include no testimonials of any kind.`
  );

  lines.push(`\nScraped from their current site:\n${brief.factsDigest.slice(0, 5000)}`);
  return lines.join("\n");
}

export interface StructureResult {
  html: string;
  /** What the model intended, so the stylesheet pass builds the same page. */
  designNotes: string;
}

export async function generateStructure(
  brief: SiteBrief,
  dna: DesignDna,
  media: MediaPlan,
  knownPaths: string[],
  previousFailures?: string
): Promise<StructureResult | null> {
  const prompt = `You are a senior web designer and conversion copywriter. Write the complete homepage for a real ${brief.industry} business in ${brief.city}.

The owner opens this page and decides in about four seconds whether you are better than whoever built their current site. Make committed decisions — a timid page of evenly-spaced identical cards is the failure to avoid.

This is pass one of two. You write the HTML and the words. A second pass writes a bespoke stylesheet for exactly the class names you choose, so name them clearly and describe your intent.

═══ THE BUSINESS — every claim comes from here and nowhere else ═══
${factsBlock(brief)}

═══ WHAT THIS PAGE IS FOR ═══
Primary action: ${brief.intent.primaryLabel}
${brief.intent.guidance}
${brief.intent.secondaryLabel ? `Secondary action: ${brief.intent.secondaryLabel}` : ""}

${
  brief.painInstructions.length > 0
    ? `═══ WHAT THE OWNER SAID IS WRONG — the page must visibly fix each ═══\n${brief.painInstructions.map((p) => `- ${p}`).join("\n")}`
    : ""
}

═══ DESIGN DIRECTION — from a best-in-class site in this trade ═══
Mood: ${dna.mood} · Rhythm: ${dna.layout.sectionRhythm} · Hero: ${dna.layout.heroTreatment}
Services as: ${dna.layout.serviceLayout} · Proof as: ${dna.layout.proofStyle}
Geometry: ${dna.geometry.radius} corners, ${dna.geometry.elevation} elevation
Type: ${dna.typography.displayFamily} display, ${dna.typography.bodyFamily} body, ${dna.typography.scale} scale
Build these motifs rather than gesturing at them: ${dna.motifs.join("; ") || "none specified"}
Why the reference reads premium: ${dna.rationale}

═══ IMAGES — only these URLs. Any other src is deleted ═══
${
  media.length > 0
    ? media.map((m) => `[${m.slot}] ${m.url}\n    shows: ${m.caption}`).join("\n")
    : "None. Build with type, colour and layout alone, and make that a deliberate editorial choice rather than a page with holes in it. Output no <img> tags."
}

═══ LINKS THAT EXIST ═══
${knownPaths.map((p) => `  ${p}`).join("\n")}
Anything else becomes an on-page anchor. Give each service block an id of its slug.
${brief.phone ? `Phone links: tel:${brief.phone.replace(/[^\d+]/g, "")}` : ""}

═══ HOW TO WRITE THE MARKUP ═══
Semantic HTML5. <section> for bands, real <h1>/<h2>/<h3> hierarchy, <ul> for lists, <figure> for images with captions, <blockquote> for real quotes.

Name classes descriptively and consistently, block-then-element:
  hero, hero__inner, hero__title, hero__actions
  services, services__grid, service-card, service-card__title
The stylesheet pass styles exactly what you name, so be consistent — do not invent three names for the same kind of thing.

Every <img> needs width, height, alt and loading="lazy" except the hero image, which takes loading="eager" and fetchpriority="high".

NO <style> and NO <script> — both are stripped. NO inline style attributes for anything visual. NO <header>, <nav> or <footer>: those are separate real components rendered around your output.

${INTERACTION_CONTRACT}

═══ THE RULE ON TRUTH ═══
Every FACT must be true — never a price, a founding year, a certification, an award, a guarantee, a rating or a testimonial that is not above.
The FRAMING is yours. If the hours say open 24 hours you may write "Someone picks up at 3am." If they hold ${brief.rating ?? "4.9"} stars across ${brief.reviewCount ?? "273"} reviews you may write that as a sentence with force.
Never write about the source data or about the website itself.

NEVER write anything like these — each came from real failed output:
- Counting things in a heading: "Five clear service paths", "Three ways we help"
- Narrating the data: "lists these exact services", "posted hours", "verified details"
- Naming the section instead of saying something: "Direct contact, posted hours, local address"
- The legal name as the headline, especially in capitals
- Filler: "quality workmanship", "customer satisfaction is our priority", "we go the extra mile", "committed to excellence"
- A number with no meaning, e.g. a stat reading "24" for "open 24 hours"

═══ WHAT THE PAGE MUST DO ═══
ABOVE THE FOLD a visitor must know what this business does, where, and exactly one thing to do next.

Then, in whatever order the design direction genuinely calls for: real trust signals the facts support, the real services, a substantive reason to choose them built from their real content, real proof if real reviews exist, service areas if real, a genuinely useful FAQ, and a closing call to action carrying the real phone number.

Section ids the real navigation links to: services, about, reviews, faq, contact

Aim for eight to twelve sections. Enough that the page feels like a real site, never padded with a section that says nothing.
${
  previousFailures
    ? `\n═══ A PREVIOUS ATTEMPT WAS REJECTED ═══\nThis is a fresh build, not a repair. Just make sure none of these are true of yours:\n${previousFailures}\n`
    : ""
}
Reply in EXACTLY this format:
DESIGN NOTES: three or four sentences describing the visual system you intend — the hero treatment, how sections alternate, where the accent colour lands, what carries the eye down the page. The stylesheet pass reads this.
---PAGE---
<the HTML body fragment, no markdown fences>`;

  const raw = await callOpenAI(prompt, {
    maxTokens: 60000,
    temperature: 0.85,
    modelChain: bestModelChain(),
    system:
      "You are a senior web designer and conversion copywriter writing production HTML. You never invent facts about a business, and you name classes consistently because someone else is writing the CSS.",
  });

  if (!raw) return null;

  const trimmed = raw.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const match = trimmed.match(/^DESIGN NOTES:\s*([\s\S]*?)\n+---PAGE---\s*\n/i);
  const designNotes = match ? match[1].trim() : "";
  const html = match ? trimmed.slice(match[0].length).trim() : trimmed;

  if (!html || html.replace(/<[^>]+>/g, "").trim().length < 400) return null;

  return { html, designNotes };
}
