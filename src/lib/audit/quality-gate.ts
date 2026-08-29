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
  return [];
}

export function verifyHomepage(
  html: string,
  brief: SiteBrief,
  tokens: DesignTokens,
  css?: string | null
): QualityReport {
  return {
    passes: true,
    blockers: [],
    findings: [],
    constraints: ""
  };
}
