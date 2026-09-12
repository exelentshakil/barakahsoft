import { createAdminClient } from "@/lib/supabase/admin";
import { callDesignModel } from "@/lib/generate/model";
import { themeCss, resolveBrand, fontPairFor, NEUTRALS } from "@/lib/theme";
import type { SiteBrief } from "@/lib/build-site-brief";

// One brief, one call, one homepage.
//
// This is the whole generator. What it replaces was fourteen Inngest steps: an
// intake spec, a model-written PRD, five deterministic design engines, a media
// plan, two authoring calls, an assemble pass, a static audit, a rendered audit
// in headless Chromium, a repair loop and a visual-QA worker — around fifteen
// thousand lines that still produced pages needing repair.
//
// The three things in that pipeline that genuinely earned their keep are kept,
// and they cost about eighty lines between them:
//
//   1. Plan before writing.  The PRD's value was never its 470 lines, it was
//      making the model decide the page's argument before spending 40k tokens
//      of output on markup. Here it does that in the same response, which is
//      free and keeps this a single call.
//   2. Name the type.  Unspecified fonts mean system-ui, and system-ui means
//      the mockup looks cheap regardless of layout. See lib/theme.ts.
//   3. Survive the length.  A rich homepage is 30-40k output tokens, which is
//      exactly why the old code split chrome from body. Truncation is checked
//      for and continued from, because the pages that truncate are the good
//      ones.

export interface UsablePhoto {
  url: string;
  caption: string;
  subject: string;
  width: number | null;
  height: number | null;
}

/**
 * The photographs the operator has approved for this lead.
 *
 * Ingest and captioning happen at scrape time now, not here, so by the moment
 * this runs the operator has already seen every image, deleted the bad ones and
 * uploaded whatever was missing. The generator gets a curated set or it gets
 * nothing — it never goes looking for images mid-build.
 */
export async function usablePhotos(leadId: string): Promise<UsablePhoto[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("media_assets")
    .select("public_url, caption, subject, width, height, usable")
    .eq("lead_id", leadId)
    .returns<
      { public_url: string; caption: string | null; subject: string | null; width: number | null; height: number | null; usable: boolean }[]
    >();

  return (data ?? [])
    .filter((a) => a.usable !== false && a.subject !== "logo" && a.subject !== "unusable")
    .filter((a) => typeof a.public_url === "string" && /^https?:\/\//i.test(a.public_url))
    // Biggest first: whatever leads the page needs the resolution.
    .sort((a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0))
    .slice(0, 20)
    .map((a) => ({
      url: a.public_url,
      caption: (a.caption ?? "").trim() || "photograph supplied by the client",
      subject: a.subject ?? "unknown",
      width: a.width,
      height: a.height,
    }));
}

function photoBlock(photos: UsablePhoto[]): string {
  if (photos.length === 0) {
    return `NO PHOTOGRAPHS ARE AVAILABLE.
Design a page that does not contain a single <img>. Carry it on type, space, rule
lines and the neutral surfaces. Do not link to stock libraries, do not use
placeholder services, do not emit an <img> with an invented src.`;
  }
  const lines = photos
    .map((p, i) => {
      const size = p.width && p.height ? `${p.width}x${p.height}` : "size unknown";
      return `${i + 1}. ${p.url}\n   shows: ${p.caption} (${p.subject}, ${size})`;
    })
    .join("\n");
  return `THE ${photos.length} PHOTOGRAPH(S) YOU MAY USE — these are the client's own:
${lines}

Use every one of them somewhere on the page. Use no others: no stock URLs, no
placeholder services, no invented paths. Read each caption and place the image
where what it actually shows makes sense — a photograph of a van does not belong
in a section about the team.`;
}

function reviewBlock(brief: SiteBrief): string {
  if (brief.reviews.length === 0) return "No review text was found. Do not invent any.";
  return brief.reviews
    .slice(0, 5)
    .map((r) => `- ${r.author} (${r.rating}/5${r.when ? `, ${r.when}` : ""}): "${r.text.replace(/\s+/g, " ").slice(0, 320)}"`)
    .join("\n");
}

function brandingBlock(branding: unknown): string {
  if (!branding || typeof branding !== "object") return "";
  // Trimmed rather than dumped: the whole object runs to several thousand
  // tokens of spacing scales and component recipes, and what actually carries
  // a visual direction is the character of the reference, not its border radii.
  const b = branding as Record<string, unknown>;
  const keep = {
    personality: b.personality,
    layout: b.layout,
    colorScheme: b.colorScheme,
    fonts: Array.isArray(b.fonts) ? (b.fonts as unknown[]).slice(0, 4) : undefined,
  };
  const json = JSON.stringify(keep, null, 1);
  if (json.length < 40) return "";
  return `VISUAL DIRECTION, read from a reference site in this trade.
This is direction only — never a source of copy, claims, prices or facts. Take
the feel, the density, the confidence. Take nothing it says as true of this
client:
${json}`;
}

// Two calls, not one — and not fourteen.
//
// The pipeline this replaced wrote its stylesheet in a separate pass, which is
// why `artifacts.bespoke_css` exists and why those pages carried 124KB of CSS.
// Collapsing everything into a single call produced pages with about 8KB: one
// call given one budget spends it on structure and starves the styling, and a
// starved stylesheet is exactly what "looks like AI made it" means.
//
// So the markup pass writes semantic HTML with real class names and no styling
// at all, and the design pass is handed that exact markup and asked for nothing
// but CSS. Each gets a full output budget for one job. Roughly $0.85 a page
// against $0.61, which is the cheapest quality has ever been bought.

const TRUTH_RULES = `WHAT IS TRUE

1. Invent nothing. No review you were not given, no rating, no price, no year
   founded, no accreditation, no statistic, no team member, no address. If you
   want a fact the brief does not contain, write the section without it. A
   sentence that cannot be sourced from this brief does not go on the page.

2. Write like the business, not like a brochure. No "unlock", "seamless",
   "elevate", "in today's fast-paced world", "we pride ourselves". Short
   sentences. Say the specific true thing.`;

const MARKUP_RULES = `HARD RULES — MARKUP

1. Return ONE complete HTML document: <!doctype html> through </html>. It has a
   <head> with charset, viewport, title, meta description, the Google Fonts
   link given to you, and a single EMPTY <style></style> element. Put no CSS
   anywhere. A stylesheet is written separately against this exact markup, so
   every rule you write here would be thrown away.

2. STRUCTURE IS THE PRODUCT HERE. Ten to fourteen <section> elements, each with
   a class naming what it is — class="hero", class="proof-band",
   class="services", class="areas", class="faq". Those class names are the
   contract the stylesheet is written against, so make them descriptive and
   give every meaningful element one. Use real landmarks, one <h1>, sane
   heading order.

3. EVERY SECTION EARNS ITS PLACE. Each needs a real heading, at least forty
   words of real body copy, and a concrete detail from the brief — a service by
   name, an area by name, a review in the customer's own words, their hours,
   their phone, a number they published. A section that could sit on a
   competitor's page has failed; replace it with one that could not.

4. Every <img> carries data-slot with a short stable name — data-slot="hero",
   data-slot="service-0" — an src copied EXACTLY from the supplied list, real
   width and height, loading="lazy" except the first, and an alt written from
   its caption. SPEND EVERY PHOTOGRAPH: if you have more than you have obvious
   homes for, build a gallery, a full-bleed band or a split to hold them.

5. Any JavaScript goes in one <script> before </body> — a mobile menu, an
   accordion. Nothing else loads from anywhere.

${TRUTH_RULES}

OUTPUT SHAPE

First, a short plan, exactly this and nothing more:

PLAN
- <section name> — <what it proves> — <which photo, or none>
(one line per section, TEN TO FOURTEEN sections)

Then, immediately, the document, beginning <!doctype html>. No markdown fences,
no commentary before or after.`;

const DESIGN_RULES = `HARD RULES — STYLESHEET

1. Return CSS ONLY. No markdown fences, no HTML, no commentary, no explanation.
   Your entire answer is dropped verbatim between <style> and </style>.

2. Build on the custom properties supplied and introduce no colour outside them.
   Body copy is var(--ink) on var(--bg), or var(--invert) on var(--ink) — never
   anything else, and never on a coloured background. var(--brand) is for
   accents only: buttons, an eyebrow label, a rating mark, a link, an underline,
   a sliver of a logotype. Filling a large area with var(--brand) is a mistake.
   Text sitting on var(--brand) is always var(--on-brand).

3. THIS IS WHERE THE PAGE IS WON. Style EVERY class in the markup above — do not
   leave sections to default browser styling. A generous, deliberate stylesheet
   is the entire difference between a page that reads as expensive and one that
   reads as generated. Expect to write a lot of CSS; a thin stylesheet is the
   failure mode.

4. Give it real design: a type scale with clamp(), rhythm and vertical spacing
   that varies by section, full-bleed bands alternating with contained ones,
   asymmetric grids rather than three equal cards every time, considered
   hover and focus states, hairline rules, generous line-height on body copy
   and tight tracking on display type.

5. Responsive to 360px with real breakpoints, a working mobile navigation, and
   @media (prefers-reduced-motion: reduce) honoured. Motion is subtle or absent
   — no carousels, no parallax, nothing that moves without being asked.

6. Selectors must match the markup you were given, exactly. Do not invent class
   names that are not in it.`;

/**
 * What this page has to beat.
 *
 * The generator has never been shown the site it is replacing, which is an odd
 * omission for a redesign: "make it better" is unanswerable without "than
 * what". A mobile PageSpeed score and the owner's own current copy are enough
 * for the model to aim above them rather than at nothing.
 */
function currentSiteBlock(current: CurrentSite | null): string {
  if (!current) return "";
  const lines: string[] = [];
  if (current.url) lines.push(`Their site today: ${current.url}`);
  if (typeof current.pagespeedMobile === "number") {
    lines.push(`It scores ${current.pagespeedMobile}/100 on mobile PageSpeed.`);
  }
  if (current.headline) lines.push(`Its headline is: "${current.headline}"`);
  if (lines.length === 0) return "";
  return `WHAT YOU ARE REPLACING
${lines.join("\n")}

The owner is going to open your page next to that one. Yours has to look like it
cost more, say more, and prove more. Do not mimic its structure — it is the
reason they need a new site.`;
}

export interface CurrentSite {
  url: string | null;
  pagespeedMobile: number | null;
  headline: string | null;
}

/**
 * The client's own marks.
 *
 * Resolved by lib/brand-assets.ts and then, for a while, passed to nobody: the
 * generator had no idea a logo existed, so every page it wrote set the business
 * name in type and called it a logotype. A real mark in the header is most of
 * the difference between "a redesign of my site" and "a template with my name
 * in it".
 */
export interface BrandMarks {
  logoUrl: string | null;
  /** A transparent version for dark footers, when the operator supplied one. */
  footerLogoUrl: string | null;
}

function brandBlock(marks: BrandMarks | null): string {
  if (!marks?.logoUrl) {
    return `NO LOGO IS AVAILABLE. Set the business name as a wordmark — real
typography, tracked and weighted deliberately. Do not draw a fake logo, do not
invent an icon, do not put initials in a coloured circle.`;
  }
  return `THEIR LOGO — use this exact URL in the header, never a text substitute:
${marks.logoUrl}
${marks.footerLogoUrl && marks.footerLogoUrl !== marks.logoUrl ? `Footer version (transparent, for a dark band): ${marks.footerLogoUrl}` : "Reuse the same file in the footer."}
Give it a sensible height (28-40px in the header), width auto, and a real alt.
It is a brand mark, not a photograph: no data-slot, no crop, no filter.`;
}

/** Everything both passes need to know about the business. */
function contextBlock(
  brief: SiteBrief,
  photos: UsablePhoto[],
  current: CurrentSite | null,
  marks: BrandMarks | null
): string {
  return `You are building the homepage of ${brief.businessName}, a ${brief.industry} business in ${brief.city}.

This page is a mockup shown to the owner to win a full website build. It has to
look more expensive than what they have now and it has to be about THEM — their
services, their reviews, their photographs, their town. A page that could belong
to any business in this trade has failed.

THE BUSINESS
Name: ${brief.businessName}
Trade: ${brief.industry}
Town: ${brief.city}
${brief.founder ? `Owner/founder: ${brief.founder}\n` : ""}Phone: ${brief.phone ?? "none — do not print or link a phone number"}
Email: ${brief.email ?? "none — do not print an email address"}
${brief.address ? `Address: ${brief.address}\n` : ""}${brief.licensedInsured ? "They state publicly that they are licensed and insured.\n" : ""}${brief.certifications.length ? `Accreditations (operator-verified, safe to print): ${brief.certifications.join(", ")}\n` : ""}
SERVICES (real, from their own site — use these words)
${brief.services.map((s) => `- ${s}`).join("\n") || "- none found"}

AREAS SERVED
${brief.areas.length ? brief.areas.join(", ") : "none found — do not invent any"}

PROOF
${brief.rating ? `Google rating ${brief.rating} from ${brief.reviewCount ?? "?"} reviews.` : "No Google rating — do not print one."}
${brief.facebookRating ? `Facebook rating ${brief.facebookRating} from ${brief.facebookReviewCount ?? "?"} reviews.` : ""}
${brief.googleReviewUrl ? `Read-all-reviews link: ${brief.googleReviewUrl}` : ""}
Review text you may quote verbatim:
${reviewBlock(brief)}

${brief.entities.length ? `SPECIFIC THINGS THIS BUSINESS HAS (each read from their own pages — this is what stops the page being generic)\n${brief.entities.slice(0, 30).map((e) => `- ${e.kind}: ${e.label}${e.detail ? ` — ${e.detail}` : ""}`).join("\n")}\n` : ""}
${brief.aboutContent ? `IN THEIR OWN WORDS\n${brief.aboutContent.slice(0, 1400)}\n` : ""}
${brief.factsDigest ? `SCRAPED CONTENT (source of truth — everything on the page must trace back to here or to the fields above)\n${brief.factsDigest.slice(0, 5000)}\n` : ""}
${brief.painInstructions.length ? `WHAT THE OWNER SAID IS WRONG WITH THEIR CURRENT SITE — fix each of these\n${brief.painInstructions.map((p) => `- ${p}`).join("\n")}\n` : ""}
${photoBlock(photos)}

${brandBlock(marks)}

${currentSiteBlock(current)}`;
}

function markupPrompt(
  brief: SiteBrief,
  photos: UsablePhoto[],
  current: CurrentSite | null,
  marks: BrandMarks | null
): string {
  const font = fontPairFor(brief.industry, brief.services);
  return `${contextBlock(brief, photos, current, marks)}

TYPE — put exactly this in the <head>, nothing else:
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${font.href}" rel="stylesheet">

${MARKUP_RULES}`;
}

function designPrompt(
  brief: SiteBrief,
  brandHex: string,
  branding: unknown,
  markup: string
): string {
  const font = fontPairFor(brief.industry, brief.services);
  const brand = resolveBrand(brandHex);

  return `Write the stylesheet for the homepage of ${brief.businessName}, a ${brief.industry} business in ${brief.city}.

This page is a mockup shown to the owner to win a full website build. The markup
is already written and is below. Your stylesheet is the whole of the design, and
it is the only thing standing between this and looking like every other page a
model has ever produced.

${brandingBlock(branding)}

TYPE — already linked in the markup, use exactly these:
Headings: "${font.display}". Body, buttons and labels: "${font.text}".
Give both a real fallback stack.

COLOUR — open your stylesheet with this verbatim and build on it:
${themeCss(brand)}

The palette is deliberately almost entirely neutral. ${brand} is this client's
own colour and it belongs in small, deliberate places. That restraint is not a
limitation to work around — it is the reason the page will look expensive.

THE MARKUP YOU ARE STYLING
${markup}

${DESIGN_RULES}`;
}

/** Everything from <!doctype html> onward, with the plan and any fencing removed. */
function extractDocument(raw: string): { plan: string; html: string } {
  const cleaned = raw.replace(/^\s*```(?:html)?\s*/i, "").replace(/```\s*$/i, "");
  const start = cleaned.search(/<!doctype\s+html/i);
  if (start < 0) {
    // No doctype: the model returned a fragment. Take it as the body and let
    // the caller's wrapper make a document of it rather than failing the build.
    return { plan: "", html: cleaned.trim() };
  }
  return { plan: cleaned.slice(0, start).trim(), html: cleaned.slice(start).trim() };
}

function isComplete(html: string): boolean {
  return /<\/html\s*>\s*$/i.test(html.trim());
}

/**
 * Wrap a fragment, or repair a document that never opened properly.
 *
 * Only reached when the model ignored the output shape. Cheaper than another
 * round-trip and it guarantees the renderer always receives a real document.
 */
function ensureDocument(html: string, brief: SiteBrief, brandHex: string): string {
  if (/<html[\s>]/i.test(html)) return html;
  const font = fontPairFor(brief.industry, brief.services);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${brief.businessName}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${font.href}" rel="stylesheet">
<style>
${themeCss(brandHex)}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"${font.text}",system-ui,sans-serif;line-height:1.6}
img{max-width:100%;height:auto;display:block}
h1,h2,h3{font-family:"${font.display}",Georgia,serif;line-height:1.15}
</style>
</head>
<body>
${html}
</body>
</html>`;
}

/**
 * Finish a document the model ran out of room for.
 *
 * Handing back the tail rather than the whole page keeps the continuation
 * prompt small, and asking for a resume "from exactly this point" is far more
 * reliable than asking it to regenerate and hope it fits the second time.
 */
async function continueDocument(partial: string, brief: SiteBrief): Promise<string> {
  const tail = partial.slice(-3000);
  const prompt = `You were writing the homepage of ${brief.businessName} as one HTML document and your output was cut off mid-way.

Here are the last characters you produced:

${tail}

Continue from EXACTLY that point and finish the document, ending with </html>.
Do not repeat anything above. Do not restart the document. Do not open a new
<style> block unless the one you were in was closed. Output only the remaining
markup, with no commentary and no markdown fences.`;

  const more = await callDesignModel(prompt, {
    json: false,
    maxTokens: 32000,
    temperature: 0.5,
    timeoutMs: 600_000,
    label: "homepage-continue",
  });

  if (!more) return partial;
  const cleaned = more.replace(/^\s*```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trimStart();
  return partial + cleaned;
}

export interface GeneratedHomepage {
  html: string;
  plan: string;
  photosUsed: number;
  continued: boolean;
  /** Surfaced to the operator: a thin page is a number, not a vibe. */
  bytes: number;
  cssBytes: number;
  sections: number;
}

/** Drop the model's CSS into the empty <style> the markup pass left for it. */
function injectStylesheet(document: string, css: string): string {
  const clean = css
    .replace(/^\s*```(?:css)?\s*/i, "")
    .replace(/```\s*$/i, "")
    // A model told "CSS only" occasionally opens with a <style> tag anyway.
    .replace(/^\s*<style[^>]*>/i, "")
    .replace(/<\/style>\s*$/i, "")
    .trim();

  if (!clean) return document;
  if (/<style[^>]*>\s*<\/style>/i.test(document)) {
    return document.replace(/<style([^>]*)>\s*<\/style>/i, `<style$1>\n${clean}\n</style>`);
  }
  // No empty element to fill: append one rather than lose the stylesheet.
  if (/<\/head>/i.test(document)) {
    return document.replace(/<\/head>/i, `<style>\n${clean}\n</style>\n</head>`);
  }
  return `<style>\n${clean}\n</style>\n${document}`;
}

export async function generateHomepage(
  brief: SiteBrief,
  photos: UsablePhoto[],
  brandHex: string,
  branding: unknown = null,
  current: CurrentSite | null = null,
  marks: BrandMarks | null = null
): Promise<GeneratedHomepage> {
  // ---- pass 1: what the page says and how it is organised -----------------
  const raw = await callDesignModel(markupPrompt(brief, photos, current, marks), {
    json: false,
    maxTokens: 48000,
    temperature: 0.8,
    timeoutMs: 600_000,
    label: "homepage-markup",
  });
  if (!raw) throw new Error("Both providers returned nothing for the markup.");

  const { plan, html } = extractDocument(raw);
  if (!html) throw new Error("The model returned no markup.");

  let document = ensureDocument(html, brief, brandHex);
  let continued = false;
  if (!isComplete(document)) {
    console.warn(`[homepage] markup truncated at ${document.length} chars — continuing`);
    document = await continueDocument(document, brief);
    continued = true;
    if (!isComplete(document)) document += "\n</body>\n</html>";
  }

  // ---- pass 2: the design ---------------------------------------------------
  //
  // Its own call and its own budget, because that is the whole point. A failure
  // here is not fatal: the markup already carries the font link and the theme
  // custom properties, so an unstyled page is recoverable by rebuilding rather
  // than a lost build.
  const css = await callDesignModel(designPrompt(brief, brandHex, branding, document), {
    json: false,
    maxTokens: 64000,
    temperature: 0.7,
    timeoutMs: 600_000,
    label: "homepage-design",
  });

  if (css) document = injectStylesheet(document, css);
  else console.error("[homepage] the design pass returned nothing — page is unstyled");

  const used = photos.filter((p) => document.includes(p.url)).length;
  if (photos.length > 0 && used === 0) {
    console.warn(`[homepage] ${photos.length} photos supplied, none placed`);
  }

  const sections = (document.match(/<section\b/gi) ?? []).length;
  const cssBytes = (document.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] ?? "").length;
  console.log(
    `[homepage] ${Math.round(document.length / 1024)}KB · ${Math.round(cssBytes / 1024)}KB css · ` +
      `${sections} sections · ${used}/${photos.length} photos${continued ? " · continued" : ""}`
  );

  return { html: document, plan, photosUsed: used, continued, bytes: document.length, cssBytes, sections };
}
