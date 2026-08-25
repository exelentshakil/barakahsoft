import type { SiteBrief } from "@/lib/generate-bespoke-site";
import type { DesignTokens } from "@/lib/design-tokens";

// The verification gate.
//
// Everything here is MEASURED from the markup and the compiled tokens. No
// model is asked whether the page is good, because a model asked that says
// yes — which is how two unreadable heroes and a page of sitemap filenames
// reached production in this project.
//
// A blocker means the page is not fit to show a client and generation is
// retried. A warning is worth the operator's eye but does not stop anything.
// The point of the distinction is that the operator should only ever be
// looking at warnings; blockers should have been caught and rebuilt before
// they ever saw it.

export interface QualityFinding {
  severity: "blocker" | "warning";
  check: string;
  detail: string;
}

export interface QualityReport {
  findings: QualityFinding[];
  blockers: QualityFinding[];
  passes: boolean;
  /** Fed back into a fresh generation when the gate fails. */
  constraints: string;
}

function textOf(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedText(html: string): string {
  const codePoint = (raw: string, radix: number, fallback: string) => {
    const value = parseInt(raw, radix);
    return Number.isInteger(value) && value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : fallback;
  };
  return textOf(html)
    .replace(/&(amp|quot|apos|lt|gt|nbsp);/gi, (entity, name: string) => ({
      amp: "&",
      quot: '"',
      apos: "'",
      lt: "<",
      gt: ">",
      nbsp: " ",
    })[name.toLowerCase()] ?? entity)
    .replace(/&#(\d+);/g, (entity, value: string) => codePoint(value, 10, entity))
    .replace(/&#x([0-9a-f]+);/gi, (entity, value: string) => codePoint(value, 16, entity))
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Top-level bands, so each can be checked for substance individually. */
function topLevelSections(html: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;

  for (const token of html.matchAll(/<(\/?)(section|div|article|aside|main)\b[^>]*?(\/?)>/gi)) {
    if (token[3] === "/") continue;
    if (token[1] !== "/") {
      if (depth === 0) start = token.index!;
      depth++;
    } else {
      depth--;
      if (depth === 0 && start >= 0) {
        out.push(html.slice(start, token.index! + token[0].length));
        start = -1;
      }
      if (depth < 0) depth = 0;
    }
  }
  return out;
}

function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * ch(parseInt(c.slice(0, 2), 16)) +
    0.7152 * ch(parseInt(c.slice(2, 4), 16)) +
    0.0722 * ch(parseInt(c.slice(4, 6), 16))
  );
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * The premium standard, checked against the stylesheet.
 *
 * These are the things that separate an expensive site from an adequate one,
 * and every one of them is visible in the CSS: whether the page breathes,
 * whether the type has a real scale, whether interactive elements respond,
 * whether a keyboard user can see where they are. A model asked "is this
 * premium?" says yes; the stylesheet cannot lie about whether it declared a
 * focus-visible state.
 */
// Distinct font families actually named in the sheet, ignoring var()
// references (those resolve to the two token families) and generic
// fallbacks. Used to enforce the two-family rule.
function distinctFontFamilies(css: string): string[] {
  const generic = new Set(["sans-serif", "serif", "monospace", "system-ui", "ui-sans-serif", "ui-serif", "ui-monospace", "cursive", "fantasy", "inherit", "initial", "unset"]);
  const seen = new Set<string>();
  for (const decl of css.match(/font-family\s*:[^;}]+/gi) ?? []) {
    const value = decl.split(":").slice(1).join(":");
    if (/var\(/i.test(value)) continue;
    const first = value.split(",")[0].trim().replace(/["']/g, "").toLowerCase();
    if (!first || generic.has(first)) continue;
    seen.add(first);
  }
  return [...seen];
}

// The largest vertical padding the sheet declares, in pixels. clamp() is
// read at its upper bound, which is what a desktop viewer actually gets.
function maxVerticalPaddingPx(css: string): number | null {
  let max: number | null = null;
  const consider = (raw: string) => {
    const px = /rem\s*$/i.test(raw) ? parseFloat(raw) * 16 : /px\s*$/i.test(raw) ? parseFloat(raw) : null;
    if (px !== null && Number.isFinite(px) && (max === null || px > max)) max = px;
  };

  for (const decl of css.match(/padding(?:-block(?:-start|-end)?|-top|-bottom)?\s*:[^;}]+/gi) ?? []) {
    const value = decl.split(":").slice(1).join(":");
    const isShorthand = /padding\s*:/i.test(decl);
    for (const clamped of value.match(/clamp\([^)]*\)/gi) ?? []) {
      const args = clamped.slice(6, -1).split(",");
      if (args.length === 3) consider(args[2].trim());
    }
    const stripped = value.replace(/clamp\([^)]*\)/gi, " ").replace(/var\([^)]*\)/gi, " ");
    const lengths = stripped.match(/-?\d*\.?\d+(?:px|rem)/gi) ?? [];
    // In a shorthand the first value is vertical; a 4-value shorthand also
    // has a vertical third. Horizontal gutters are irrelevant here.
    const vertical = isShorthand ? [lengths[0], lengths[2]] : lengths;
    vertical.forEach((l) => { if (l) consider(l); });
  }
  return max;
}

// Which text tokens are legible on which fill. Anything else in the same
// rule is a contrast failure by construction — these pairings are what the
// compiled palette guarantees, and nothing else is checked for contrast at
// all.
// Tokens that are fills and never text. Note that neither appears in any
// `allowed` list below — the compiled palette has always treated them this
// way, and this set just makes that enforceable for rules that set a colour
// without a background.
const FILL_ONLY_TOKENS = new Set(["--bs-accent", "--bs-primary"]);

const READABLE_ON: { fill: string; allowed: string[]; label: string }[] = [
  {
    fill: "--bs-primary",
    allowed: ["--bs-on-primary"],
    label: "the brand colour",
  },
  {
    fill: "--bs-accent",
    allowed: ["--bs-on-accent"],
    label: "the accent colour",
  },
  {
    fill: "--bs-invert-surface",
    allowed: ["--bs-invert-ink", "--bs-on-primary"],
    label: "an inverted band",
  },
  {
    fill: "--bs-surface",
    allowed: ["--bs-ink", "--bs-ink-muted", "--bs-primary-on-surface"],
    label: "the page background",
  },
  {
    fill: "--bs-surface-alt",
    allowed: ["--bs-ink", "--bs-ink-muted", "--bs-primary-on-surface"],
    label: "the alternate background",
  },
];

/**
 * Read each rule block and check the fill and the text agree.
 *
 * Deliberately conservative: only rules that set BOTH a background and a
 * colour from the token set are judged, because a rule that sets only one
 * inherits the other from a parent this cannot see. That misses some real
 * failures and invents none, which is the correct trade for a gate that
 * blocks a build.
 */
function verifyTokenPairs(css: string): QualityFinding[] {
  const findings: QualityFinding[] = [];
  const seen = new Set<string>();

  // Strip at-rule preludes so nested blocks still parse as plain rules.
  for (const block of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = block[1].trim().split(/\s*,\s*/)[0].slice(0, 60);
    const body = block[2];

    const bg = body.match(/background(?:-color)?\s*:[^;]*var\(\s*(--bs-[a-z-]+)/i)?.[1];
    const fg = body.match(/(?<!-)\bcolor\s*:[^;]*var\(\s*(--bs-[a-z-]+)/i)?.[1];

    // Fill tokens used as text, with no background in the same rule to pair
    // against. This is the case the both-must-be-present rule below cannot
    // judge, and it is how accent-on-white text keeps shipping: the rule
    // inherits its background from a parent, so nothing here sees a
    // mismatch. --bs-accent and --bs-primary are saturated brand fills; at
    // body size on the page ground they are the single most common
    // unreadable-text failure, which is exactly why the palette compiles
    // --bs-primary-on-surface as the contrast-corrected text form.
    if (fg && !bg && FILL_ONLY_TOKENS.has(fg)) {
      const key = `text-only|${fg}`;
      if (!seen.has(key)) {
        seen.add(key);
        findings.push({
          severity: "blocker",
          check: "contrast",
          detail: `\`${selector}\` sets text to ${fg}, which is a fill colour, not a text colour. It inherits whatever background its parent has, so on a light ground this renders low-contrast brand-coloured text. Use --bs-primary-on-surface for accent-coloured text on the page ground, --bs-on-accent only inside an element actually filled with --bs-accent, or --bs-ink for ordinary copy.`,
        });
      }
      continue;
    }

    if (!bg || !fg) continue;

    const pair = READABLE_ON.find((p) => p.fill === bg);
    if (!pair || pair.allowed.includes(fg)) continue;

    const key = `${bg}|${fg}`;
    if (seen.has(key)) continue;
    seen.add(key);

    findings.push({
      severity: "blocker",
      check: "contrast",
      detail: `\`${selector}\` fills with ${bg} and sets text to ${fg}. On ${pair.label} the readable text token is ${pair.allowed[0]} — as written this renders text against a background of nearly the same darkness.`,
    });
  }

  return findings;
}

function verifyStylesheet(css: string): QualityFinding[] {
  const findings: QualityFinding[] = [];
  const add = (severity: QualityFinding["severity"], check: string, detail: string) =>
    findings.push({ severity, check, detail });

  // The floor was 1500, which nothing real ever produces — a working page
  // measured 14152 — so it only ever caught a total failure to generate,
  // never a thin sheet. A homepage here is eight or nine sections, and a
  // section that is genuinely composed costs roughly a kilobyte on its own.
  const length = css.trim().length;
  if (length < 6000) {
    add("blocker", "stylesheet", `Only ${length} characters of CSS for a whole homepage. Sections are being left with token styling rather than a composition of their own.`);
  } else if (length < 11000) {
    add("warning", "stylesheet", `${length} characters of CSS is thin for this many sections — expect some to be styled generically.`);
  }

  // Custom shapes and decorative layers are what stop a page reading as
  // stacked rectangles. These are cheap to detect and were previously not
  // asked for at all.
  // Graduated rather than a single line: three constructs is a floor any
  // page with a repeated primitive clears without trying, and blocking there
  // is what stops the generator settling for stacked rectangles. A page
  // measured before this existed had exactly zero.
  const shaping = (css.match(/clip-path\s*:|border-radius\s*:\s*[^;]*\/|::?(before|after)\b|mask(-image)?\s*:|transform\s*:\s*[^;]*(skew|rotate)/gi) ?? []).length;
  if (shaping < 3) {
    add("blocker", "composition", `Only ${shaping} shaping constructs (clip-path, ::before/::after, skew/rotate, mask). Every section is a plain rectangle — build the recurring primitive and give at least three sections a shaped edge or offset ground.`);
  } else if (shaping < 8) {
    add("warning", "composition", `${shaping} shaping constructs. The page has some geometry but most sections are still plain rectangles.`);
  }

  const decorative = (css.match(/repeating-linear-gradient|radial-gradient|linear-gradient|filter\s*:\s*blur|opacity\s*:\s*0?\.\d/gi) ?? []).length;
  if (decorative < 4) {
    add("warning", "composition", `Only ${decorative} decorative layers (gradients, washes, blurred fields). Focal sections have no depth behind them.`);
  }

  // Whitespace: generous, and scaling with the viewport rather than jumping
  // at breakpoints. clamp() is the signature of a considered spacing scale.
  if (!/clamp\s*\(/i.test(css)) {
    add("warning", "whitespace", "No clamp() anywhere — spacing and type will jump at breakpoints instead of scaling.");
  }
  const paddingRules = css.match(/padding(-block|-inline|-top|-bottom)?\s*:/gi)?.length ?? 0;
  if (paddingRules < 12) {
    add("warning", "whitespace", `Only ${paddingRules} padding declarations. The page is unlikely to breathe.`);
  }

  // Section rhythm. An expensive page is mostly space; a cramped one reads as
  // cheap however good the type is. The largest vertical padding in the sheet
  // is a fair proxy for how a section break lands, and it is measurable in a
  // way "make it feel premium" never was.
  const spacingPx = maxVerticalPaddingPx(css);
  if (spacingPx !== null && spacingPx < 72) {
    add(
      "warning",
      "whitespace",
      `The largest section padding resolves to about ${Math.round(spacingPx)}px. Section breaks should reach 96-128px on desktop.`
    );
  }

  // Touch. A button a thumb misses is a lost enquiry, and small tap targets
  // are the clearest sign a page was designed on a desktop and never tried
  // on a phone — which is where most of these leads actually read it.
  if (!/min-height\s*:\s*(4[4-9]|[5-9]\d|\d{3,})px/i.test(css) && !/min-height\s*:\s*(2\.[89]|[3-9])\w*rem/i.test(css)) {
    add("warning", "mobile", "No interactive element declares a minimum height. Tap targets should clear 44px on mobile.");
  }

  // Typography: two families at most, a real scale, and a readable measure.
  if (!/font-family/i.test(css)) {
    add("warning", "typography", "The stylesheet sets no font-family, so the page falls back to system defaults.");
  }
  const families = distinctFontFamilies(css);
  if (families.length > 2) {
    add(
      "warning",
      "typography",
      `${families.length} different font families (${families.slice(0, 4).join(", ")}). One display face and one body face; a third reads as clutter.`
    );
  }
  if (!/line-height/i.test(css)) {
    add("warning", "typography", "No line-height is set anywhere; body copy will use browser defaults.");
  } else if (!/line-height\s*:\s*1\.[4-8]/i.test(css)) {
    add("warning", "typography", "No line-height between 1.4 and 1.8 anywhere. Squashed body copy is the fastest way a page reads as cheap.");
  }
  if (!/max-width\s*:\s*\d+(ch|ex)/i.test(css) && !/max-width\s*:\s*6\dch/i.test(css)) {
    add("warning", "typography", "No measure constraint (max-width in ch) on body text — long lines are hard to read.");
  }

  // Micro-interaction and accessibility.
  if (!/:hover/i.test(css)) {
    add("blocker", "interaction", "No hover states at all. Nothing on the page will feel responsive.");
  }
  if (!/:focus-visible/i.test(css)) {
    add("blocker", "accessibility", "No :focus-visible styles. A keyboard user cannot see where they are.");
  }
  if (!/transition|animation/i.test(css)) {
    add("warning", "interaction", "No transitions anywhere; every state change will snap.");
  }
  if (/transition|animation/i.test(css) && !/prefers-reduced-motion/i.test(css)) {
    add("warning", "accessibility", "Motion is used without a prefers-reduced-motion guard.");
  }

  // Mobile polish.
  if (!/@media[^{]*max-width|@media[^{]*min-width/i.test(css)) {
    add("blocker", "mobile", "No media queries. The layout cannot be responsive.");
  }

  // The reveal contract: elements must be visible without script.
  if (/data-reveal-armed/.test(css) && !/data-revealed/.test(css)) {
    add("blocker", "interaction", "Reveal start state is styled but the revealed state is not — content will stay hidden.");
  }

  // Colour discipline. Literal colours bypass the contrast-checked palette.
  // Pure black is never the right ink. It maximises contrast to the point of
  // eye fatigue and is the single most recognisable tell of an unconsidered
  // palette; the compiled tokens already carry a soft charcoal instead.
  // Only OPAQUE black. This previously matched any rgba(0,0,0,…), which is
  // how every stylesheet in existence writes a shadow — including the
  // compiled tokens themselves, whose --bs-shadow-card is
  // "rgb(0 0 0 / 0.04), rgb(0 0 0 / 0.12)". The gate was failing builds for
  // using the exact pattern it ships.
  const opaqueBlack =
    /#000(000)?\b/i.test(css) ||
    /rgba?\(\s*0\s*,\s*0\s*,\s*0\s*\)/i.test(css) ||
    /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*1(\.0+)?\s*\)/i.test(css);
  if (opaqueBlack) {
    add("blocker", "colour", "Opaque pure black is used as a colour. Ink comes from the tokens, which carry a softer charcoal for readability. Translucent black in a shadow is fine.");
  }

  const literals = css.match(/#[0-9a-f]{3,8}\b|rgba?\(\s*\d/gi)?.length ?? 0;
  if (literals > 6) {
    add("blocker", "colour", `${literals} literal colour values in the stylesheet. Colour must come from the design tokens.`);
  }

  // ---- The unreadable button ------------------------------------------
  // Every fill token has exactly one text token that is contrast-checked
  // against it. A rule that fills with --bs-primary and then sets text to
  // --bs-ink produces navy-on-navy: invisible, and shipped to a real client
  // more than once. The pairing is mechanical, so it is checked rather than
  // asked for.
  findings.push(...verifyTokenPairs(css));

  // Negative margins between siblings in a grid/flex row can cause overlaps.
  // Flagged as a layout warning.
  if (/margin(?:-(?:top|bottom|left|right|inline(?:-start|-end)?|block(?:-start|-end)?))?\s*:\s*-\d/i.test(css)) {
    add("warning", "layout", "A negative margin was detected in generated stylesheet.");
  }

  return findings;
}

export function verifyHomepage(
  html: string,
  brief: SiteBrief,
  tokens: DesignTokens,
  css?: string | null
): QualityReport {
  const findings: QualityFinding[] = [];
  const add = (severity: QualityFinding["severity"], check: string, detail: string) =>
    findings.push({ severity, check, detail });

  const sections = topLevelSections(html);
  const body = textOf(html);
  const words = body.split(" ").filter(Boolean).length;

  // ---- Substance -------------------------------------------------------
  if (sections.length < 5) {
    add("blocker", "depth", `Only ${sections.length} sections. A homepage this short reads as a placeholder.`);
  }
  if (words < 350) {
    add("blocker", "depth", `Only ${words} words of real copy. There is not enough here to sell anything.`);
  }

  // "No blank spots": a band that renders as an empty stripe is worse than
  // no band, and it is the most common way a generated page looks broken.
  sections.forEach((section, index) => {
    const sectionWords = textOf(section).split(" ").filter(Boolean).length;
    const hasImage = /<img\b/i.test(section);
    if (sectionWords < 12 && !hasImage) {
      add("blocker", "empty-section", `Section ${index + 1} has ${sectionWords} words and no image — it will render as a blank band.`);
    }
  });

  // ---- The fold --------------------------------------------------------
  const hero = sections[0] ?? "";
  if (!/<h1\b/i.test(hero)) {
    add("blocker", "fold", "The first section has no <h1>. A visitor cannot tell what this business does.");
  }
  const heroHasAction =
    /href="tel:/i.test(hero) ||
    [...hero.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi)].some(([, , inner]) =>
      /\b(call|quote|book|schedule|contact|get|start|request|shop|buy|enquir|estimate|consult)\b/i.test(
        inner.replace(/<[^>]+>/g, " ")
      )
    );
  if (!heroHasAction) {
    add("blocker", "fold", "There is no call to action above the fold. The first screen must offer exactly one thing to do.");
  }
  const heroText = textOf(hero).toLowerCase();
  if (brief.city && brief.city !== "the local area" && !heroText.includes(brief.city.toLowerCase())) {
    add("warning", "fold", `The hero does not name ${brief.city}. Local intent is most of the value for this business.`);
  }

  const h1s = html.match(/<h1\b/gi)?.length ?? 0;
  if (h1s !== 1) add("blocker", "hierarchy", `${h1s} <h1> elements; exactly one must carry the promise.`);
  if ((html.match(/<h2\b/gi)?.length ?? 0) < 3) {
    add("warning", "hierarchy", "Fewer than three <h2> sections — the page is likely thin.");
  }

  // ---- Conversion ------------------------------------------------------
  // Any real call to action is a link or button that either dials, or points
  // at contact, or carries an action word. Counting a framework class no
  // longer works now that pages name their own.
  const ACTION_WORDS = /\b(call|quote|book|schedule|contact|get|start|request|shop|buy|enquir|estimate|consult|talk|speak)\b/i;
  const ctas = [...html.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi)].filter(([, , inner], _i, _a) => {
    const text = inner.replace(/<[^>]+>/g, " ").trim();
    return text.length > 0 && text.length < 60 && ACTION_WORDS.test(text);
  }).length;
  if (ctas === 0) add("blocker", "cta", "The page has no call-to-action button at all.");
  else if (ctas < 3) add("blocker", "cta", `Only ${ctas} call(s) to action across the whole page. A visitor should never scroll back to act.`);

  const primaryLabel = brief.intent.primaryLabel.replace(/\s+/g, " ").trim().toLowerCase();
  const inconsistentPrimaryActions = [...html.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi)].filter(
    ([, , attrs, inner]) =>
      textOf(inner).toLowerCase() === primaryLabel &&
      !/\bclass=["'][^"']*\bsite-cta--primary\b/i.test(attrs)
  );
  if (inconsistentPrimaryActions.length > 0) {
    add("blocker", "cta-system", `${inconsistentPrimaryActions.length} primary action(s) do not use the shared site-cta--primary treatment.`);
  }
  const inconsistentPrimaryLabels = [...html.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi)].filter(
    ([, , attrs, inner]) => /\bsite-cta--primary\b/i.test(attrs) && normalizedText(inner) !== primaryLabel
  );
  if (inconsistentPrimaryLabels.length > 0) {
    add("blocker", "cta-system", `${inconsistentPrimaryLabels.length} primary action(s) use wording other than "${brief.intent.primaryLabel}".`);
  }

  if (brief.phone && !/href="tel:/i.test(html)) {
    add("blocker", "cta", "The business has a phone number and the page contains no tel: link.");
  }
  if (brief.intent.primary === "call-now" && (html.match(/href="tel:/gi)?.length ?? 0) < 2) {
    add("blocker", "cta", "This trade converts on the phone; the number must appear at more than one decision point.");
  }

  // The real lead-capture form/modal only activates from an element
  // carrying one of these attributes. A trade whose action is a form,
  // booking or enquiry but never uses either has a CTA that looks like it
  // works and does nothing when clicked.
  const FORM_INTENTS = new Set(["quote-form", "book-appointment", "consultation", "enquiry"]);
  // The negative lookahead matters: data-lead-form-message would otherwise
  // satisfy a \b boundary, so a stray status element with no actual form
  // around it would pass a blocking check.
  const LEAD_FORM_ATTR = /data-lead-form(?![-\w])/i;
  if (FORM_INTENTS.has(brief.intent.primary)) {
    if (!LEAD_FORM_ATTR.test(hero)) {
      add("blocker", "cta", "This trade converts on a quote, booking or enquiry, and the hero has no real lead-capture form (data-lead-form) in it — a button that opens one elsewhere is not enough above the fold.");
    }
  } else if (
    brief.intent.secondary !== null &&
    FORM_INTENTS.has(brief.intent.secondary) &&
    !/data-open-quote-modal/i.test(html) &&
    !LEAD_FORM_ATTR.test(html)
  ) {
    add("blocker", "cta", "This trade's secondary action is a quote/booking/enquiry, and no element on the page carries data-open-quote-modal or data-lead-form — so that CTA leads nowhere.");
  }

  // ---- Truth -----------------------------------------------------------
  if (!brief.rating && /\b\d(\.\d)?\s*(star|★)/i.test(body)) {
    add("blocker", "truth", "The page claims a star rating and no verified rating exists for this business.");
  }
  if (!brief.licensedInsured && /\b(licensed|insured|bonded|certified)\b/i.test(body)) {
    add("blocker", "truth", "The page claims licensing or insurance, which this business does not claim on its own site.");
  }
  if (brief.reviews.length === 0 && /<blockquote/i.test(html)) {
    add("blocker", "truth", "The page shows a testimonial and no real review text was available.");
  }
  if (brief.reviews.length > 0) {
    const reviewSection = sections.find((section) => /\bid=["']reviews["']/i.test(section)) ?? "";
    if (!reviewSection) {
      add("blocker", "reviews", "Real review text exists but the page has no id=\"reviews\" section.");
    } else {
      if (!/data-review-slider/i.test(reviewSection) || !/data-review-track/i.test(reviewSection)) {
        add("blocker", "reviews", "The reviews section is not an accessible horizontal slider.");
      }
      if (!/data-review-prev/i.test(reviewSection) || !/data-review-next/i.test(reviewSection)) {
        add("blocker", "reviews", "The review slider is missing previous/next controls.");
      }
      if (!/[★⭐]{4,}/u.test(reviewSection)) {
        add("blocker", "reviews", "The review slider has no visible star rating, so the cards do not read as testimonials at a glance.");
      }

      const supplied = brief.reviews.map((review) => ({
        quote: normalizedText(review.text),
        author: normalizedText(review.author),
      }));
      const matched = new Set<number>();
      const blocks = [...reviewSection.matchAll(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi)];
      for (const block of blocks) {
        const citation = block[1].match(/<cite\b[^>]*>([\s\S]*?)<\/cite>/i)?.[1] ?? "";
        const quote = normalizedText(block[1].replace(/<cite\b[\s\S]*?<\/cite>/gi, "")).replace(/^[“\"]|[”\"]$/g, "").trim();
        const author = normalizedText(citation);
        const index = supplied.findIndex(
          (review, reviewIndex) =>
            !matched.has(reviewIndex) &&
            (review.author === author || review.quote.includes(quote.slice(0, 30)) || quote.includes(review.quote.slice(0, 30)))
        );
        if (index >= 0) matched.add(index);
      }
      if (blocks.length === 0) {
        add("blocker", "reviews", "The reviews section must contain blockquote testimonials.");
      }
    }
  }

  // ---- Services --------------------------------------------------------
  const missingServices = brief.services.filter((s) => !body.toLowerCase().includes(s.toLowerCase().slice(0, 14)));
  if (missingServices.length > 0 && brief.services.length > 0) {
    add(
      missingServices.length > brief.services.length / 2 ? "blocker" : "warning",
      "services",
      `Not on the page: ${missingServices.join(", ")}.`
    );
  }

  // ---- The owner's own complaints --------------------------------------
  // These are why they filled the form in. A page that does not answer them
  // is not the page they were promised.
  for (const instruction of brief.painInstructions) {
    if (/every screen needs an obvious next step/i.test(instruction) && ctas < 4) {
      add("blocker", "pain-point", `They said they are not getting enough enquiries, and the page has only ${ctas} calls to action.`);
    }
    if (/name the places they serve/i.test(instruction) && brief.areas.length > 0) {
      const named = brief.areas.filter((a) => body.toLowerCase().includes(a.toLowerCase())).length;
      if (named === 0) {
        add("blocker", "pain-point", "They said they are invisible in local search, and the page names none of their service areas.");
      }
    }
    if (/plain, quotable answers/i.test(instruction) && !/faq|frequently asked|question/i.test(body)) {
      add("blocker", "pain-point", "They said they are absent from AI answers, and the page has no FAQ.");
    }
  }

  // ---- Composition -----------------------------------------------------
  // Pages now carry their own stylesheet, so section variety cannot be read
  // from a fixed set of band classes. Distinct class names on the sections
  // themselves are the available signal: a page whose bands all share one
  // class is one that will render as a flat wall.
  const sectionClasses = new Set(
    sections
      .map((section) => section.match(/^<\w+[^>]*\bclass="([^"]*)"/i)?.[1] ?? "")
      .map((c) => c.trim().split(/\s+/)[0])
      .filter(Boolean)
  );
  if (sections.length >= 5 && sectionClasses.size < Math.ceil(sections.length / 2)) {
    add(
      "warning",
      "composition",
      `${sections.length} sections share only ${sectionClasses.size} distinct block class(es) — they are likely to look alike.`
    );
  }

  if (!/\bid=["']about["']/i.test(html)) {
    add("blocker", "composition", "The page has no id=\"about\" story section, so the navigation and trust narrative are incomplete.");
  }
  if (brief.founder) {
    const about = sections.find((section) => /\bid=["']about["']/i.test(section)) ?? "";
    if (about && !textOf(about).toLowerCase().includes(brief.founder.toLowerCase())) {
      add("blocker", "about", `The supplied owner name (${brief.founder}) is absent from the About section.`);
    }
  }

  // An image used twice reads as a stock page.
  const imgs = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)].map((m) => m[1]);
  const dupes = imgs.filter((u, i) => imgs.indexOf(u) !== i);
  if (dupes.length > 0) {
    add("warning", "composition", `${new Set(dupes).size} image(s) appear more than once.`);
  }

  // Layout shift. Without intrinsic dimensions the page jumps as each image
  // arrives, which Google measures and which feels broken under a thumb.
  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const undimensioned = imgTags.filter((tag) => !/\bwidth=/i.test(tag) || !/\bheight=/i.test(tag));
  if (undimensioned.length > 0) {
    add(
      undimensioned.length > imgTags.length / 2 ? "blocker" : "warning",
      "layout-shift",
      `${undimensioned.length} of ${imgTags.length} images have no width and height attributes, so the page shifts while it loads.`
    );
  }

  // Semantic integrity. A page assembled from nothing but nested <div> is
  // unreadable to a crawler and to a screen reader, and it is the shape
  // generated markup collapses into when nobody is measuring.
  const divCount = (html.match(/<div\b/gi) ?? []).length;
  const semanticCount = (html.match(/<(?:section|article|aside|figure|figcaption|blockquote|ul|ol|dl|address|main)\b/gi) ?? []).length;
  if (semanticCount === 0) {
    add("blocker", "semantics", "The markup uses no semantic elements at all — every block is a <div>.");
  } else if (divCount > semanticCount * 8) {
    add("warning", "semantics", `${divCount} <div>s against ${semanticCount} semantic elements. Blocks with meaning should use the element that carries it.`);
  }

  // ---- Palette ---------------------------------------------------------
  const v = tokens.vars;
  const pairs: [string, string, string][] = [
    ["--bs-ink", "--bs-surface", "body text on the page"],
    ["--bs-ink-muted", "--bs-surface", "muted text on the page"],
    ["--bs-on-primary", "--bs-primary", "button text on the brand colour"],
    ["--bs-invert-ink", "--bs-invert-surface", "text on inverted bands"],
  ];
  for (const [fg, bg, label] of pairs) {
    if (!HEX.test(v[fg] ?? "") || !HEX.test(v[bg] ?? "")) continue;
    const ratio = contrast(v[fg], v[bg]);
    if (ratio < 4.5) add("blocker", "contrast", `${label} is ${ratio.toFixed(2)}:1, below 4.5:1.`);
  }

  if (/(?:#[0-9a-f]{3,8}\b|rgba?\()/i.test(html.replace(/<svg[\s\S]*?<\/svg>/gi, ""))) {
    add("blocker", "contrast", "The markup contains literal colour values, bypassing the palette.");
  }

  // ---- Placeholders ----------------------------------------------------
  if (/\b(lorem ipsum|todo|tbd|placeholder|\[insert|your business name|xxx)\b/i.test(body)) {
    add("blocker", "placeholder", "The page contains placeholder text.");
  }

  if (css) findings.push(...verifyStylesheet(css));

  const blockers = findings.filter((f) => f.severity === "blocker");

  return {
    findings,
    blockers,
    passes: blockers.length === 0,
    constraints: blockers.map((b) => `- ${b.detail}`).join("\n"),
  };
}
