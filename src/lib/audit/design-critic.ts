import { callOpenAI } from "@/lib/openai-client";
import type { DesignTokens } from "@/lib/design-tokens";
import type { ConversionIntent } from "@/lib/conversion-intent";

// The design critic.
//
// Two passes, and the split matters. Contrast, heading hierarchy and
// call-to-action coverage are MEASURABLE — they are computed from the markup
// and the tokens, and a model's opinion about them is strictly worse than
// arithmetic. Rhythm, balance and whether a page reads as expensive are
// genuinely judgement, and those go to a model.
//
// Asking a model "is the contrast good" produces confident agreement almost
// every time, which is why the low-contrast heroes in this project shipped.
// Anything that can be calculated is calculated.

export interface DesignIssue {
  severity: "blocker" | "warning";
  area: "contrast" | "hierarchy" | "cta" | "spacing" | "alignment" | "typography" | "composition";
  detail: string;
}

export interface DesignVerdict {
  issues: DesignIssue[];
  /** True when nothing is a blocker. Warnings are worth fixing, not fatal. */
  passes: boolean;
}

function luminance(hex: string): number {
  const clean = hex.replace("#", "");
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(parseInt(clean.slice(0, 2), 16)) +
    0.7152 * channel(parseInt(clean.slice(2, 4), 16)) +
    0.0722 * channel(parseInt(clean.slice(4, 6), 16))
  );
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Contrast pairs that the token set itself guarantees, checked as arithmetic. */
function auditTokens(tokens: DesignTokens): DesignIssue[] {
  const issues: DesignIssue[] = [];
  const v = tokens.vars;

  const pairs: { fg: string; bg: string; label: string; min: number }[] = [
    { fg: "--bs-ink", bg: "--bs-surface", label: "body text on the page background", min: 4.5 },
    { fg: "--bs-ink-muted", bg: "--bs-surface", label: "muted text on the page background", min: 4.5 },
    { fg: "--bs-ink", bg: "--bs-surface-alt", label: "body text on alternate bands", min: 4.5 },
    { fg: "--bs-on-primary", bg: "--bs-primary", label: "button text on the brand colour", min: 4.5 },
    { fg: "--bs-on-accent", bg: "--bs-accent", label: "text on the accent colour", min: 4.5 },
    { fg: "--bs-invert-ink", bg: "--bs-invert-surface", label: "text on inverted bands", min: 4.5 },
    { fg: "--bs-primary-on-surface", bg: "--bs-surface", label: "accent text on the page background", min: 4.5 },
  ];

  for (const pair of pairs) {
    const fg = v[pair.fg];
    const bg = v[pair.bg];
    if (!HEX.test(fg ?? "") || !HEX.test(bg ?? "")) continue;

    const ratio = contrast(fg, bg);
    if (ratio < pair.min) {
      issues.push({
        severity: "blocker",
        area: "contrast",
        detail: `${pair.label} is ${ratio.toFixed(2)}:1, below the ${pair.min}:1 minimum (${fg} on ${bg}).`,
      });
    }
  }

  return issues;
}

/** Structural checks on the markup itself. */
function auditMarkup(html: string, intent: ConversionIntent, hasPhone: boolean): DesignIssue[] {
  const issues: DesignIssue[] = [];

  const h1s = html.match(/<h1\b/gi)?.length ?? 0;
  if (h1s === 0) {
    issues.push({ severity: "blocker", area: "hierarchy", detail: "The page has no <h1>." });
  } else if (h1s > 1) {
    issues.push({
      severity: "warning",
      area: "hierarchy",
      detail: `The page has ${h1s} <h1> elements; exactly one should carry the main promise.`,
    });
  }

  if ((html.match(/<h2\b/gi)?.length ?? 0) < 2) {
    issues.push({
      severity: "warning",
      area: "hierarchy",
      detail: "Fewer than two <h2> sections — the page is likely too thin to read as a real site.",
    });
  }

  // The primary action has to exist, and be reachable more than once.
  const ctaCount = [...html.matchAll(/<(?:a|button)\b([^>]*)>/gi)].filter((match) =>
    /\b(?:bs-btn|site-cta)\b|data-open-quote-modal|href=["']tel:/i.test(match[1])
  ).length;
  if (ctaCount === 0) {
    issues.push({ severity: "blocker", area: "cta", detail: "The page has no call-to-action button at all." });
  } else if (ctaCount < 3) {
    issues.push({
      severity: "warning",
      area: "cta",
      detail: `Only ${ctaCount} call(s) to action. A visitor should never have to scroll back to act.`,
    });
  }

  if (intent.primary === "call-now" && hasPhone && !/href="tel:/i.test(html)) {
    issues.push({
      severity: "blocker",
      area: "cta",
      detail: "This trade converts on the phone and the page has no tel: link.",
    });
  }

  // New bespoke pages name their own section classes and ship matching CSS;
  // legacy pages use bs-band-* treatments. Judge either vocabulary rather
  // than declaring every modern page a flat wall.
  const sections = [...html.matchAll(/<section\b([^>]*)>/gi)];
  const treatments = new Set(
    sections.map((match) => {
      const classes = match[1].match(/class=["']([^"']+)["']/i)?.[1].split(/\s+/) ?? [];
      return classes.find((name) => name !== "site-section" && name !== "bs-section") ?? classes[0] ?? "";
    }).filter(Boolean)
  );
  if (sections.length >= 5 && treatments.size < Math.ceil(sections.length / 2)) {
    issues.push({
      severity: "warning",
      area: "composition",
      detail: `${sections.length} sections share only ${treatments.size} distinct section treatment(s) — the page may read as one flat wall.`,
    });
  }

  // Colours cannot be expressed through the vocabulary, so any that appear
  // came from somewhere the token contract does not control.
  if (/(?:#[0-9a-f]{3,8}\b|rgba?\()/i.test(html.replace(/<svg[\s\S]*?<\/svg>/gi, ""))) {
    issues.push({
      severity: "blocker",
      area: "contrast",
      detail: "The markup contains literal colour values, which bypass the palette entirely.",
    });
  }

  return issues;
}

/**
 * The judgement pass, on what arithmetic cannot settle.
 *
 * Deliberately given the things it is actually good at, and explicitly not
 * asked about contrast — a model asked to check contrast agrees that it is
 * fine, which is how unreadable heroes reach production.
 */
async function auditComposition(html: string, intent: ConversionIntent): Promise<DesignIssue[]> {
  const raw = await callOpenAI(
    `You are a design director reviewing a homepage before it is sent to a paying client. Judge it against the standard of an expensive agency site, not an acceptable one.

Look only at these, and be specific about WHERE each problem is:
- Visual hierarchy: does the eye land on the right thing first in each section, or is everything competing?
- Spacing and rhythm: are sections breathing consistently, or does the page lurch between cramped and empty?
- Alignment: is anything visually orphaned — a stray element, an odd column, a lone item in a grid built for three?
- Typographic scale: are there too many sizes, or headings that do not step down cleanly?
- Conversion clarity: the primary action is "${intent.primaryLabel}". Is it unmistakable on every screen?

Do NOT comment on colour contrast — that is measured separately and your opinion on it is not wanted.

Report ONLY real problems. A page with none is normal and "issues": [] is the correct answer for good work — do not invent criticism to seem thorough.

Return strict JSON:
{"issues":[{"severity":"blocker|warning","area":"hierarchy|spacing|alignment|typography|cta|composition","detail":"what is wrong and where"}]}

PAGE:
${html.slice(0, 60000)}`,
    { json: true, maxTokens: 12000, temperature: 0.3 }
  );

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, ""));
    const issues = Array.isArray(parsed.issues) ? parsed.issues : [];
    return issues
      .filter((i: unknown): i is DesignIssue => !!i && typeof (i as DesignIssue).detail === "string")
      .map((i: DesignIssue) => ({
        severity: i.severity === "blocker" ? "blocker" : "warning",
        area: i.area ?? "composition",
        detail: i.detail,
      }))
      .slice(0, 10);
  } catch {
    return [];
  }
}

export async function criticiseDesign(
  html: string,
  tokens: DesignTokens,
  intent: ConversionIntent,
  hasPhone: boolean
): Promise<DesignVerdict> {
  const measured = [...auditTokens(tokens), ...auditMarkup(html, intent, hasPhone)];
  const judged = await auditComposition(html, intent);
  const issues = [...measured, ...judged];

  return { issues, passes: !issues.some((i) => i.severity === "blocker") };
}

/** Issues rendered as repair instructions for a revision pass. */
export function issuesAsInstructions(issues: DesignIssue[]): string {
  return issues
    .map((i) => `- [${i.severity}] ${i.area}: ${i.detail}`)
    .join("\n");
}
