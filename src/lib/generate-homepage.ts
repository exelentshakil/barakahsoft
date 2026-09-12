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
  /** True for stock. The prompt is told these may only carry atmosphere. */
  stock: boolean;
  /** Photographer and library, for the credit line both licences ask for. */
  credit: string | null;
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
    .select("public_url, caption, subject, width, height, usable, source, attribution_name")
    .eq("lead_id", leadId)
    .returns<
      {
        public_url: string;
        caption: string | null;
        subject: string | null;
        width: number | null;
        height: number | null;
        usable: boolean;
        source: string;
        attribution_name: string | null;
      }[]
    >();

  return (data ?? [])
    .filter((a) => a.usable !== false && a.subject !== "logo" && a.subject !== "unusable")
    .filter((a) => typeof a.public_url === "string" && /^https?:\/\//i.test(a.public_url))
    // Biggest first: whatever leads the page needs the resolution.
    .sort((a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0))
    .slice(0, 22)
    .map((a) => ({
      url: a.public_url,
      caption: (a.caption ?? "").trim() || "photograph supplied by the client",
      subject: a.subject ?? "unknown",
      width: a.width,
      height: a.height,
      stock: a.source === "pexels" || a.source === "unsplash" || a.subject === "atmosphere",
      credit:
        a.source === "pexels" || a.source === "unsplash"
          ? `${a.attribution_name ?? "Unknown"} / ${a.source === "pexels" ? "Pexels" : "Unsplash"}`
          : null,
    }));
}

function photoBlock(photos: UsablePhoto[], heroUrl: string | null): string {
  const real = photos.filter((p) => !p.stock);
  const stock = photos.filter((p) => p.stock);

  const list = (items: UsablePhoto[]) =>
    items
      .map((p, i) => {
        const size = p.width && p.height ? `${p.width}x${p.height}` : "size unknown";
        return `${i + 1}. ${p.url}\n   shows: ${p.caption} (${p.subject}, ${size})`;
      })
      .join("\n");

  if (real.length === 0 && stock.length === 0) {
    return `NO PHOTOGRAPHS ARE AVAILABLE.
Design a page with no <img> at all. Carry it on type, rules, colour bands and
the neutral surfaces. Do not link stock libraries, placeholder services, or emit
an <img> with an invented src.`;
  }

  // The operator picks a hero from the client's live site, so the value is that
  // site's URL — while everything here has been mirrored into Storage under a
  // different one. A direct comparison never matched, so the choice was silently
  // ignored on every build. storagePath keeps the last forty characters of the
  // original URL, so the two can still be recognised as the same picture.
  const slug = (url: string) => url.replace(/[^a-z0-9]+/gi, "-").slice(-40).toLowerCase();
  const chosen =
    heroUrl && (photos.find((p) => p.url === heroUrl) ?? photos.find((p) => p.url.includes(slug(heroUrl))));

  return `THE CLIENT'S OWN PHOTOGRAPHS — ${real.length}. Use EVERY one of them.
${real.length ? list(real) : "(none — this business has no usable photographs of its own)"}
${chosen ? `\nTHE OPERATOR CHOSE THE HERO PHOTOGRAPH: ${chosen.url}\nIt leads the page. Do not use it anywhere else.` : ""}

${
    stock.length
      ? `STOCK, FOR ATMOSPHERE ONLY — ${stock.length}:
${list(stock)}

These are stock. They may sit behind a statistics band, as a section texture, or
as a wide break between sections.

STOCK MAY NEVER BE THE HERO. The first photograph on the page is the one the
owner judges everything else by, and a stock city street where his own work
should be is the single fastest way to lose him. If this business has even one
photograph of its own, that is the hero. Only a business with NO photographs at
all gets a stock hero.

They may NEVER appear as this business's team, their van, their premises, their
work, or anything a reader would take as proof.
If in doubt, leave a stock image out — a page that implies a stranger is their
electrician is worse than a shorter page.

If you use ANY of them, put one small credit line in the footer legal row,
exactly: "Stock photography: ${Array.from(new Set(stock.map((p) => p.credit).filter(Boolean))).join(", ")}".
Both libraries ask for it, and a page otherwise claiming to be about one
business should say which pictures are not theirs.`
      : ""
  }

Use no URL that is not listed above. No stock URLs of your own, no placeholder
services, no invented paths. Read each caption and place the image where what it
actually shows belongs — a photograph of a consumer unit does not illustrate a
section about the team.`;
}

/**
 * What the hero asks the visitor to do.
 *
 * A 2am emergency electrician and a cosmetic dental clinic want opposite
 * things: one needs the phone answered above everything, the other is a
 * considered purchase nobody rings a stranger about. Shipping the same hero to
 * both is how a page converts for neither.
 */
function conversionBlock(brief: SiteBrief): string {
  const urgent = /electric|plumb|drain|locksmith|boiler|heating|hvac|roof|glaz|pest|emergency|flood|damp|garage|towing|restoration/i.test(
    `${brief.industry} ${brief.services.join(" ")}`
  );
  const phone = brief.phone;

  if (urgent && phone) {
    return `THE HERO'S JOB — this is an urgent trade

The phone is the conversion. Lead with a large primary button that dials
${phone} (a real tel: link), and put a short form beside or beneath it as the
second option for people who cannot talk right now.

THE HERO STILL CARRIES A PHOTOGRAPH. A form floating in a coloured box with no
image is the single cheapest-looking hero there is. Use the strongest photograph
full-bleed behind the whole hero with a dark scrim over it, or split the hero
with the photograph filling one side edge to edge. The form sits on top of that,
never instead of it.

The form is three fields and nothing more: name, phone, and one line describing
the problem. Label the button for the outcome, not the mechanism — "Get a free
estimate", never "Submit". It posts nowhere; give it an onsubmit that shows a
thank-you message in place of the fields, because this is a mockup and a dead
form that appears to hang is worse than one that plainly responds.`;
  }

  return `THE HERO'S JOB — this is a considered purchase

Nobody rings a stranger about this, so the form is the conversion and it belongs
in the hero, visible without scrolling — but the hero still carries a
photograph, full-bleed behind it with a scrim, or filling one half of a split. A
form alone in a coloured box is the cheapest-looking hero there is. Four fields at most: name, phone or
email, and what they are asking about. Label the button for the outcome —
"Book a consultation", "Request a callback" — never "Submit".
${phone ? `Offer ${phone} as the secondary option beneath it, as a real tel: link.` : "There is no phone number, so the form is the only route — do not print one."}

It posts nowhere; give it an onsubmit that replaces the fields with a thank-you
message, because this is a mockup and a form that appears to hang is worse than
one that plainly responds.`;
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
   <head> with charset, viewport, title, meta description, the Google Fonts link
   given to you, and a single EMPTY <style></style> element. Put no CSS
   anywhere. A stylesheet is written separately against this exact markup, so
   every rule you write here would be thrown away.

2. STRUCTURE IS THE PRODUCT HERE. Ten to fourteen <section> elements, each with
   a class naming what it is — class="hero", class="trust-band", class="services",
   class="areas", class="reviews", class="faq". Those class names are the
   contract the stylesheet is written against, so make them descriptive and give
   every meaningful element one.

3. THE HEADER. Logo (or wordmark), navigation anchoring to real sections on this
   page, the phone as a tel: link, AND a primary call-to-action button. A header
   whose only action is a phone number in grey text has no call to action. It
   must work as a mobile menu with a real button toggle.

4. THE FOOTER IS A REAL FOOTER, NOT A COPYRIGHT LINE. Four columns: the services
   by name as anchor links, the areas served as anchor links, the company (about,
   reviews, FAQ), and contact (address, tel: link, hours). Then the legal line.
   A footer holding only a logo and a copyright is a defect.

5. NEVER PRINT A DATE YOU WERE NOT GIVEN. Not a founding year, not a copyright
   year — models write "© 2024" from habit and it is wrong and visibly careless.
   Write the copyright with no year at all unless the brief contains one.

6. EVERY SECTION EARNS ITS PLACE. Each needs a real heading, at least forty words
   of body copy, and a concrete detail from the brief — a service by name, an
   area by name, a review in the customer's own words, their hours, their phone.
   A section that could sit on a competitor's page has failed.

7. BALANCE EVERY SPLIT. A two-column section must have enough on BOTH sides to
   fill it — image left, then a heading plus real paragraphs plus a list or a
   stat row plus a button on the right. An image beside two short sentences
   leaves a dead column, which is the single most common way these pages look
   unfinished. If one side has nothing more to say, make the section full-width
   instead.

8. Repeated things are one object. Service cards, review cards, area tiles: each
   carries the SAME elements in the same order — heading, body, and where one has
   a link or an image they all do. Do not give one card three bullet points and
   its neighbour none; the stylesheet will equalise their heights and the short
   one will be visibly padded.

9. REVIEWS ARE A SLIDER WITH VISIBLE ARROWS. A horizontal track of review cards
   carrying the reviewer's real name, their star rating and their words
   verbatim. Above or beside the track, two round arrow buttons — a left and a
   right — each with an inline SVG chevron, a real aria-label, and a click
   handler that scrolls the track by one card
   (\`track.scrollBy({left: card.offsetWidth + gap, behavior: "smooth"})\`).
   Arrows are not optional: a track that only scrolls by dragging reads as
   broken on a desktop, and most people will never discover it. Disable the
   arrow at each end rather than hiding it. Quote only the reviews you were
   given.

10. Every <img> carries data-slot with a short stable name — data-slot="hero",
   data-slot="service-0" — an src copied EXACTLY from the supplied list, real
   width and height attributes (this prevents layout shift), loading="lazy"
   except the first, and an alt written from its caption.

${TRUTH_RULES}

WRITTEN FOR AI SEARCH AS WELL AS PEOPLE

11. ANSWER FIRST. Open every section with the direct answer in the first two
   sentences, then expand. A section that warms up for a paragraph before saying
   anything is a section an AI summariser will skip.

12. HEADINGS ARE THE QUESTIONS REAL PEOPLE ASK. "What does an emergency
   call-out cost?" beats "Pricing". "Which areas do you cover?" beats "Service
   Areas". "Are you licensed and insured?" beats "Credentials". This is what
   gets a business quoted in an AI answer.

13. SAY WHAT, WHO, WHERE AND WHY PLAINLY. Somewhere in the first screen a reader
   — human or machine — must be able to extract exactly what this business does,
   who it serves, which town, and what makes it credible. No slogans standing in
   for facts.

14. INCLUDE ONE REAL TABLE. A service-and-what-is-included table, a
   response-time table, an areas-and-coverage table — whatever the brief actually
   supports. AI answers lift structured comparisons far more readily than prose.
   Do not invent figures to fill it.

15. FAQ ANSWERS ARE VISIBLE TEXT. Use <details>/<summary> if you want them
   collapsible, but the answer must be real text in the document, never injected
   by script. Six to eight questions, in the words a customer would use.

16. STRUCTURED DATA, in one <script type="application/ld+json"> before </body>:
   LocalBusiness (name, telephone, address, url, openingHours, and
   aggregateRating ONLY if you were given a real rating), FAQPage matching your
   FAQ section exactly, and Service entries for the named services. Add sameAs
   with the social profiles if the brief lists any. Every value must match
   visible text on the page — schema that contradicts the page is worse than no
   schema.

OUTPUT SHAPE

First, a short plan, exactly this and nothing more:

PLAN
- <section name> — <what it proves> — <which photo, or none>
(one line per section, TEN TO FOURTEEN sections)

Then, immediately, the document, beginning <!doctype html>. No markdown fences,
no commentary before or after.`;

const DESIGN_RULES = `WHAT SEPARATES THIS FROM A TEMPLATE

Look at what keeps coming back, because it is not a missing feature — it is a
missing idea. Header. Eyebrow, centred heading, centred paragraph. Three cards.
Image left, text right. Eyebrow, centred heading, centred paragraph. Image
right, text left. Cards. Footer. Every section the same width, the same padding,
the same centred stack, in alternating white and pale grey. Nothing is wrong
with it. Nobody would pay twenty thousand dollars for it, because it is a
brochure with the right words in it.

An expensive page is recognisable in five seconds, and this is what does it.

A. COMPOSE IN VARIED TREATMENTS, NEVER ONE REPEATED
   Pick each section's treatment from this set, and NEVER use the same one
   twice in a row:
     1. Full-bleed image band, text laid over it with a scrim
     2. Editorial split — asymmetric, the image running off one edge of the
        viewport rather than stopping at the container
     3. Contained card grid
     4. Narrow measure — one column of prose at about 62ch, left-aligned, set
        large, with real air around it
     5. Inverted band — full-bleed dark, breaking the light rhythm
     6. Data — the table or a stat row, set precisely, tabular figures
     7. Oversized pull quote from a real review, given a whole section
   AT MOST THREE CENTRED HEADINGS ON THE ENTIRE PAGE. Left-aligned headings
   against an asymmetric grid are what separate designed from assembled.
   AT LEAST TWO sections must bleed to the viewport edge. A page where every
   element obeys one max-width is flat, whatever else is right about it.

B. TYPE THAT COMMITS
   Hero heading \`clamp(3rem, 7vw, 5.75rem)\`, \`letter-spacing: -0.035em\`,
   \`line-height: 1.0\`. Section headings \`clamp(2rem, 3.6vw, 3.25rem)\`. If your
   largest heading renders under 56px on a desktop you have built a brochure.
   Body copy at 17-18px with \`line-height: 1.7\`. Never 15px everywhere.

C. SCALE CONTRAST
   An 11px uppercase label with \`letter-spacing: .14em\` sitting directly above
   a 76px heading. That jump is most of what reads as designed. Small type must
   be genuinely small and confident, not timid.

D. LET THINGS OVERLAP
   One image should cross a section boundary — pulled up with a negative margin
   over the band above, or extending below its own section. One card or panel
   should sit over the edge of an image. Flat pages have no overlaps; expensive
   pages always have one or two.

E. ONE SIGNATURE DETAIL, REPEATED
   Choose a single move and use it everywhere: a hairline rule above every
   eyebrow, oversized tabular section numbers in the left margin, one corner
   squared while the rest are round, a thin accent bar under every heading.
   Repeating one idea is what makes a page feel authored.

F. VERTICAL RHYTHM VARIES
   A twelve-item grid and a single pull quote must not share a padding value.
   The quote wants air — \`clamp(7rem, 12vw, 11rem)\` — and the grid does not.
   Uniform section padding is the clearest fingerprint of generated work.

G. THE HERO IS NOT A BOX ON A COLOUR
   Full-bleed photograph with a scrim, or a split where the image runs to the
   viewport edge. The headline sits large and left over it. A form or a button
   group floats on top — never a centred stack on a flat colour field.

HARD RULES — STYLESHEET
HARD RULES — STYLESHEET

1. Return CSS ONLY. No markdown fences, no HTML, no commentary, no explanation.
   Your entire answer is dropped verbatim between <style> and </style>.

2. Build on the custom properties supplied and introduce no colour outside them.
   Body copy is var(--ink) on var(--bg), or var(--invert) on var(--ink) — never
   anything else, and never on a coloured background. var(--brand) is for accents
   only: buttons, an eyebrow label, a rating mark, a link, an underline, a sliver
   of a logotype. Filling a large area with var(--brand) is a mistake. Text
   sitting on var(--brand) is always var(--on-brand).

3. THIS IS WHERE THE PAGE IS WON. Style EVERY class in the markup — leave
   nothing to default browser styling. Measured against real builds: a
   stylesheet under 16KB produces the forgettable page described above; the ones
   that read as expensive run past 30KB. That is not padding, it is the
   difference between styling the twelve obvious elements and styling all of
   them — hover states, focus rings, the mobile menu, the slider arrows, the
   table, the FAQ markers, every breakpoint. Write the long version.

4. NO DEAD SPACE. This is the most common way these pages fail. Specifically:
   - Two-column sections use \`align-items: center\` so the shorter column is
     centred against the taller one rather than stranded at the top.
   - An image column gets \`height: 100%\` with \`object-fit: cover\` so it fills
     its side instead of leaving a gap beneath it.
   - Section padding is proportional to what the section holds. A band with one
     line of text does not get the same vertical padding as a twelve-item grid.
   - Never centre a short paragraph in a wide container and let it float in
     white space — constrain the measure (\`max-width: 62ch\`) and align it.

5. CARDS IN A ROW ARE THE SAME HEIGHT, ALWAYS. Grid rows stretch by default —
   keep that, and make the card itself \`display: flex; flex-direction: column\`
   with the button or link pushed down by \`margin-top: auto\`. Every card's inner
   padding, heading size and image aspect ratio is identical to its neighbours.
   A row of cards with ragged bottoms is a defect.

6. THE REVIEWS SLIDER. A horizontal flex track with
   \`overflow-x: auto; scroll-snap-type: x mandatory\`, each card
   \`scroll-snap-align: start\` and a fixed width (about 340px, full width on
   mobile). Hide the scrollbar, style the previous/next buttons properly, and
   give the track \`scroll-behavior: smooth\` outside reduced-motion.

7. Give it real design: a type scale with clamp(), vertical rhythm that varies by
   section, full-bleed bands alternating with contained ones, asymmetric grids
   rather than three equal cards every time, considered hover and focus states,
   hairline rules, generous line-height on body copy and tight tracking on
   display type.

8. The header is sticky, with a solid background and a real shadow or hairline
   once scrolled. Its primary button is visibly a button.

9. Responsive to 360px with real breakpoints, a working mobile navigation, and
   @media (prefers-reduced-motion: reduce) honoured. Motion is subtle or absent —
   no carousels that move by themselves, no parallax.

10. Selectors must match the markup you were given, exactly. Do not invent class
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
It is a brand mark, not a photograph. Give it NO data-slot attribute — that
attribute marks swappable photography, and a logo appearing in the operator's
photo grid as something to replace is a defect. No crop, no filter, no rounding.`;
}

/** Everything both passes need to know about the business. */
function contextBlock(
  brief: SiteBrief,
  photos: UsablePhoto[],
  current: CurrentSite | null,
  marks: BrandMarks | null
): string {
  return `You are building the homepage of ${brief.businessName}, a ${brief.industry} business in ${brief.city}.

This page is a mockup shown to the owner to win a full website build, and it has
to carry itself as the work of an expensive agency that looked at their business
properly. Three things follow from that:

- It looks more considered than what they have now.
- It is unmistakably about THEM: their service names, their reviews, their
  photographs, their town. A page that could belong to any business in this
  trade has failed.
- It is built to be found. Structured data, question-shaped headings and direct
  answers are not decoration here — being quotable by an AI search engine is
  most of what this rebuild is worth to them.

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
${photoBlock(photos, brief.heroImage)}

${brandBlock(marks)}

${conversionBlock(brief)}

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
own colour and it belongs in small, deliberate places.

But restraint is not the same as timidity, and this is where these pages keep
failing. A page of white sections alternating with pale grey, modest headings,
neat rows of equal cards and a blue button every few screens is CORRECT and
completely forgettable. It reads as a template with the right words in it. The
restraint is in the PALETTE — it is not permission for the layout and the
typography to be safe as well. Spend nothing on colour and everything on scale,
weight and composition.

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
