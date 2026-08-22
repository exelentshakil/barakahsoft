import { callOpenAI, bestModelChain } from "@/lib/openai-client";
import { sanitizeBespokeHtml } from "@/lib/sanitize-generated-html";
import { VOCABULARY_REFERENCE, type SiteBrief } from "@/lib/generate-bespoke-site";
import type { DesignDna } from "@/lib/design-dna";
import type { MediaPlan } from "@/lib/media/plan-media";

// One pass. Copy and layout decided together, by one model, once.
//
// This replaces a five-call assembly line — copy, copy critique, markup,
// composition revise, design repair — that took seven and a half minutes and
// produced pages where some sections read well and none read exceptional.
// Two things were wrong with it, and both are structural rather than
// tuneable.
//
// SPLITTING COPY FROM LAYOUT. The copy pass wrote blind to composition and
// the markup pass had to arrange words it was forbidden to change. Good web
// design decides both at once: a headline's length is a layout decision and
// a section's shape is a copy decision. The split fixed a real problem —
// copy that narrated the brief — but it did so by removing the layout
// model's ability to write, and paid for it in composition.
//
// SEQUENTIAL REPAIR FLATTENS. draft, then revise against a critique, then
// repair against the critic. Each pass is a model told "fix these problems",
// and repeated repair converges on safe. Three rewrites is how a page ends
// up inoffensive.
//
// The anti-slop discipline that made the copy pass worth having is kept, as
// rules inside this prompt. The critic still runs, but it reports to the
// operator instead of triggering another rewrite.

// Observed slop, every one from real output. Banned by example, because
// "avoid generic copy" is an instruction models agree with and then ignore.
const BANNED = `
- Counting things in a heading: "Five clear service paths", "Three ways we help"
- Narrating the source data: "lists these exact services", "posted hours", "verified details", "real business details"
- Naming the section instead of saying something: "Direct contact, posted hours, local address", "Specifics customers can act on"
- The legal entity name as the main headline, especially in capitals
- Filler virtue claims: "quality workmanship", "customer satisfaction is our priority", "we go the extra mile", "your trusted local partner", "committed to excellence"
- A number presented as a statistic without meaning, e.g. a stat reading "24" for "open 24 hours"
- Describing the website itself: "each service links to its own page", "browse our services below"`;

function factsBlock(brief: SiteBrief): string {
  const lines: string[] = [
    `Business: ${brief.businessName}`,
    `Trade: ${brief.industry}`,
    `Serves: ${brief.city}${brief.areas.length > 0 ? ` — ${brief.areas.slice(0, 10).join(", ")}` : ""}`,
  ];
  if (brief.founder) lines.push(`Owner: ${brief.founder}`);
  if (brief.phone) lines.push(`Phone (use verbatim, in tel: links): ${brief.phone}`);
  if (brief.email) lines.push(`Email: ${brief.email}`);

  lines.push(
    brief.rating && brief.reviewCount
      ? `Google: ${brief.rating} stars from ${brief.reviewCount} reviews — verified, lead with it`
      : `NO verified rating exists. Do not mention ratings, stars or review counts anywhere.`
  );
  lines.push(
    brief.licensedInsured
      ? `They state on their own site that they are licensed and insured — you may say so.`
      : `No licensing or insurance claim exists on their site. Never claim licensed, insured, bonded or certified.`
  );
  lines.push(`Services (their real ones):\n${brief.services.map((s) => `  - ${s}`).join("\n")}`);

  if (brief.reviews.length > 0) {
    lines.push(
      `Real reviews — quote verbatim or not at all:\n${brief.reviews
        .map((r) => `  "${r.text.slice(0, 260)}" — ${r.author}`)
        .join("\n")}`
    );
  } else {
    lines.push(`No review text available. Include no testimonials of any kind.`);
  }

  lines.push(`\nScraped from their current site:\n${brief.factsDigest.slice(0, 5000)}`);
  return lines.join("\n");
}

export interface SinglePassResult {
  html: string;
  rationale: string;
}

export async function generateSinglePass(
  brief: SiteBrief,
  dna: DesignDna,
  media: MediaPlan,
  knownPaths: string[],
  /**
   * Failures from a previous attempt.
   *
   * Passed as constraints on a FRESH build, never as edits to the page that
   * failed. Patching a page repeatedly converges on safe — a rebuild that
   * knows what went wrong does not.
   */
  previousFailures?: string
): Promise<SinglePassResult | null> {
  const prompt = `You are a senior web designer AND the copywriter. Build the complete homepage for a real ${brief.industry} business in ${brief.city}.

The owner will open this page and decide in about four seconds whether you are better than whoever built their current site. It goes to a human reviewer before they ever see it, so make confident, committed decisions. A timid page of evenly-spaced identical cards is the failure to avoid.

You are writing the words AND arranging them. Those are one job: a headline's length is a layout decision, and a section's shape is a copy decision.

═══ THE BUSINESS — every claim must come from here and nowhere else ═══
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
Build these motifs, do not merely gesture at them: ${dna.motifs.join("; ") || "none specified"}
Why the reference reads premium: ${dna.rationale}

═══ IMAGES — only these URLs. Any other src is deleted ═══
${
  media.length > 0
    ? media.map((m) => `[${m.slot}] ${m.url}\n    shows: ${m.caption}`).join("\n")
    : "None available. Build with type, colour bands and layout alone, and make that a deliberate editorial choice rather than a page with holes in it. Output no <img> tags."
}

═══ LINKS THAT EXIST ═══
${knownPaths.map((p) => `  ${p}`).join("\n")}
Anything else becomes an on-page anchor. Give each service block an id of its slug so nav anchors resolve.
${brief.phone ? `Phone links: tel:${brief.phone.replace(/[^\d+]/g, "")}` : ""}

${VOCABULARY_REFERENCE}

═══ THE RULE ON TRUTH ═══
Every FACT must be true — never a price, a year founded, a certification, an award, a guarantee, a rating or a testimonial that is not above.
The FRAMING is yours. If the hours say open 24 hours you may write "Someone picks up at 3am." If they hold 4.9 stars across 273 reviews you may write "273 people rated them 4.9." That is persuasion built on truth, and it is what is wanted.
Never write about the source data or about the website itself. The reader does not know a brief exists.

NEVER WRITE ANYTHING LIKE THESE — each appeared in real failed output:${BANNED}

═══ WHAT THE PAGE MUST DO ═══
ABOVE THE FOLD, without scrolling, a visitor must know: what this business does, where it operates, and exactly one thing to do next. If they read nothing else they should know whether to call.

Then, in whatever order and treatment the design direction genuinely calls for: real trust signals (only ones the facts support), the real services each linking to its own page, a substantive reason to choose them built from their real content, real proof if real reviews exist, service areas if real, a genuinely useful FAQ, and a closing call to action carrying the real phone number.

Section anchors the real navigation links to: id="services" id="about" id="reviews" id="faq" id="contact"

═══ THE QUALITY BAR ═══
- Vary section surfaces deliberately. A page where every band shares one background is the template look you are replacing. Use bs-band-alt, bs-band-invert, bs-band-primary and bs-band-gradient with intent.
- Vary layout. Not bs-grid-3 every time. Splits, editorial rows and bento grids exist so consecutive sections do not rhyme.
- The hero carries the whole first impression. Give it real presence.
- Every image goes in the section its description actually matches. Never reuse one.
- Headlines short and confident. Body copy concrete. Any sentence a competitor could paste onto their own site unchanged has failed.
- Whitespace is structural, not leftover.

Do NOT output a <header>, nav, logo or <footer> — those are separate real components rendered around your output, and anything you write there is deleted. Begin at the hero, end at the closing call to action.

${
  previousFailures
    ? `═══ A PREVIOUS ATTEMPT WAS REJECTED ═══\nIt failed these checks. This is a fresh build, not a repair — do not try to reproduce that page. Just make sure none of these are true of yours:\n${previousFailures}\n`
    : ""
}
Reply with EXACTLY this format:
RATIONALE: one sentence on the decisions you committed to
---PAGE---
<the HTML body fragment, no markdown fences>`;

  const raw = await callOpenAI(prompt, {
    // One large budget spent once, rather than five smaller ones spent
    // sequentially. On a reasoning model this covers reasoning and output.
    maxTokens: 60000,
    // The strongest model available. This is the one call where output
    // quality is the entire product; everything else runs on the standard
    // chain where a pro model buys nothing and costs real time.
    modelChain: bestModelChain(),
    temperature: 0.85,
    system:
      "You are a senior web designer and conversion copywriter. You write production HTML using only the class vocabulary you are given, and you never invent facts about a business.",
  });

  if (!raw) return null;

  const trimmed = raw.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const match = trimmed.match(/^RATIONALE:\s*(.*?)\s*\n+---PAGE---\s*\n/i);
  const rationale = match ? match[1].trim() : "";
  const html = match ? trimmed.slice(match[0].length).trim() : trimmed;

  if (!html) return null;

  const clean = sanitizeBespokeHtml(html);
  if (clean.replace(/<[^>]+>/g, "").trim().length < 400) return null;

  return {
    html: clean,
    rationale: rationale || `Built to a ${dna.mood} direction drawn from ${dna.sourceName}.`,
  };
}
