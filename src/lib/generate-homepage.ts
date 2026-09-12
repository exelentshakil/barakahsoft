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

const RULES = `HARD RULES

1. Return ONE complete HTML document. It starts with <!doctype html> and ends
   with </html>. All CSS goes in a single <style> in the <head>. Any JavaScript
   goes in one <script> before </body>. Nothing is loaded from anywhere except
   the Google Fonts link given to you and the photograph URLs given to you.

2. Build on the CSS custom properties supplied below and do not introduce
   colours outside them. Body copy is var(--ink) on var(--bg) or var(--invert)
   on var(--ink) — never anything else, and never on a coloured background.
   var(--brand) is for accents only: buttons, an eyebrow label, a rating mark,
   a link, an underline, a small piece of a logotype. If you fill a large area
   with var(--brand), you have made a mistake. Text sitting on var(--brand) is
   always var(--on-brand).

3. Every <img> carries a data-slot attribute with a short stable name —
   data-slot="hero", data-slot="about", data-slot="service-0" — and the src is
   copied EXACTLY from the supplied list. Every <img> also needs width, height,
   loading="lazy" (except the first) and a real alt written from its caption.

4. Invent nothing. No review you were not given, no rating, no price, no year
   founded, no accreditation, no statistic, no team member, no address. If you
   want a fact the brief does not contain, write the section without it. A
   sentence that cannot be sourced from this brief does not go on the page.

5. Write like the business, not like a brochure. No "unlock", "seamless",
   "elevate", "in today's fast-paced world", "we pride ourselves". Short
   sentences. Say the specific true thing.

6. Responsive down to 360px, with a real mobile navigation. Semantic landmarks,
   one <h1>, meaningful heading order, focus states on every interactive
   element, and prefers-reduced-motion respected.

7. BUILD A FULL PAGE, NOT A LANDING SKELETON. Nine to twelve sections. A page
   with a hero, three service cards, one testimonial and a footer is the page
   every template generator produces and it will not win this business. The
   owner has to scroll and keep finding things about their own company.

8. EVERY SECTION EARNS ITS PLACE. Each one needs a real heading, at least forty
   words of real body copy, and a concrete detail taken from the brief — a
   service by name, an area by name, a review in their customer's own words,
   their hours, their phone, a number they actually published. A section that
   could appear on a competitor's page has failed and should be replaced with
   one that could not.

9. SPEND EVERY PHOTOGRAPH. If you have more photographs than obvious homes for
   them, build somewhere for them to live: a gallery, a full-bleed band, a
   two-column split, a before-and-after. An unused photograph is a wasted
   section.

OUTPUT SHAPE

First, a short plan, exactly this and nothing more:

PLAN
- <section name> — <what it proves> — <which photo, or none>
(one line per section, NINE TO TWELVE sections)

Then, immediately, the document, beginning <!doctype html>. No markdown fences,
no commentary before or after, no explanation of your choices.`;

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

function buildPrompt(
  brief: SiteBrief,
  photos: UsablePhoto[],
  brandHex: string,
  branding: unknown,
  current: CurrentSite | null
): string {
  const font = fontPairFor(brief.industry, brief.services);
  const brand = resolveBrand(brandHex);

  return `You are designing the homepage of ${brief.businessName}, a ${brief.industry} business in ${brief.city}.

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

${currentSiteBlock(current)}

${brandingBlock(branding)}

TYPE — use exactly this pairing, nothing else:
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${font.href}" rel="stylesheet">
Headings: "${font.display}". Body, buttons and labels: "${font.text}".
Always give both a real fallback stack.

COLOUR — paste this into your stylesheet verbatim and build on it:
${themeCss(brand)}

The palette is deliberately almost entirely neutral. ${brand} is this client's
own colour and it appears in small, deliberate places. This is not a limitation
to work around, it is the reason the page will look expensive.

${RULES}`;
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
  /** Surfaced to the operator: a thin page is visible as a number, not a vibe. */
  bytes: number;
  sections: number;
}

export async function generateHomepage(
  brief: SiteBrief,
  photos: UsablePhoto[],
  brandHex: string,
  branding: unknown = null,
  current: CurrentSite | null = null
): Promise<GeneratedHomepage> {
  const prompt = buildPrompt(brief, photos, brandHex, branding, current);

  const raw = await callDesignModel(prompt, {
    json: false,
    // A twelve-section page plus its stylesheet runs past 40k output tokens.
    // Asking for less is asking for a page that stops halfway down, and the
    // truncation guard below exists precisely for the ones that still do.
    maxTokens: 96000,
    temperature: 0.75,
    timeoutMs: 600_000,
    label: "homepage",
  });

  if (!raw) throw new Error("Both providers returned nothing for the homepage.");

  const { plan, html } = extractDocument(raw);
  if (!html) throw new Error("The model returned no markup.");

  let document = ensureDocument(html, brief, brandHex);
  let continued = false;
  if (!isComplete(document)) {
    console.warn(`[homepage] truncated at ${document.length} chars — continuing`);
    document = await continueDocument(document, brief);
    continued = true;
    if (!isComplete(document)) document += "\n</body>\n</html>";
  }

  const used = photos.filter((p) => document.includes(p.url)).length;
  if (photos.length > 0 && used === 0) {
    console.warn(`[homepage] ${photos.length} photos supplied, none placed`);
  }

  const sections = (document.match(/<section\b/gi) ?? []).length;
  console.log(
    `[homepage] ${Math.round(document.length / 1024)}KB · ${sections} sections · ` +
      `${used}/${photos.length} photos${continued ? " · continued" : ""}`
  );

  return { html: document, plan, photosUsed: used, continued, bytes: document.length, sections };
}

/** The neutral scale, for anything that needs to match the generated page. */
export { NEUTRALS };
