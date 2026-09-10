// The static half of the audit.
//
// Parses the CSS a model actually produced and reports where it broke the
// compiled system. Pure and synchronous, so it runs before a browser is
// involved and its findings are cheap enough to gather on every build.
//
// The single most important check is the literal check. The whole design of
// this pipeline rests on the model referencing var(--…) rather than typing
// values, because the moment it types #3a5a45 and 18px it is guessing at
// problems the engines already solved. A regex cannot do this honestly —
// #fff inside a comment, a hex in a data URI, a number inside a var()
// fallback — so this walks a real PostCSS tree.

import postcss, { type Declaration, type Rule } from "postcss";

export type Severity = "blocker" | "finding" | "note";

export interface AuditFinding {
  check: string;
  severity: Severity;
  detail: string;
  selector?: string;
}

export interface StaticAuditInput {
  css: string;
  /** Section ids in document order, for the band check. */
  sectionIds: string[];
  /** From the vertical profile. The law's default is 8–14. */
  sectionBand?: [number, number];
  /** Spacing values the compiled system offers, in px. */
  spacingScale: number[];
}

const DEFAULT_BAND: [number, number] = [8, 14];

// Properties where a literal is a design decision the engines own. Deliberately
// not every property: a `border-width: 1px` or `flex: 1` is structural, and
// reporting those buries the findings that matter under noise.
const COLOUR_PROPS = /^(color|background|background-color|background-image|border(-[a-z]+)?-color|border|outline|outline-color|fill|stroke|box-shadow|text-shadow|caret-color|text-decoration-color)$/;
const SIZE_PROPS = /^(font-size|line-height|letter-spacing|padding|padding-[a-z-]+|margin|margin-[a-z-]+|gap|row-gap|column-gap|border-radius|max-width|min-height)$/;

const LITERAL_COLOUR = /(#[0-9a-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(|\boklch\s*\(|\b(?:red|blue|green|black|white|grey|gray|orange|purple|pink|yellow|brown|navy|teal|maroon|olive|silver|gold)\b)/i;
const LITERAL_LENGTH = /(?<![\w-])(\d+(?:\.\d+)?)(px|rem|em)(?![\w-])/g;

/** Values that are legitimately literal wherever they appear. */
const HARMLESS = /^(0|0px|auto|none|inherit|initial|unset|currentcolor|transparent|1px|2px|100%|100vw|100vh|1|1\.0)$/i;

function stripVarFallbacks(value: string): string {
  // `var(--x, 18px)` — the fallback is the engine's own value repeated, not a
  // guess, so counting it as a literal produces a finding on correct code.
  let out = value;
  let previous = "";
  while (out !== previous) {
    previous = out;
    out = out.replace(/var\(\s*(--[\w-]+)\s*,[^()]*\)/g, "var($1)");
  }
  return out;
}

function stripUrls(value: string): string {
  return value.replace(/url\([^)]*\)/gi, "url()");
}

export function auditStatic(input: StaticAuditInput): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const band = input.sectionBand ?? DEFAULT_BAND;

  let root: postcss.Root;
  try {
    root = postcss.parse(input.css);
  } catch (error) {
    return [{ check: "css-parse", severity: "blocker", detail: `CSS did not parse: ${(error as Error).message}` }];
  }

  const literalColours: string[] = [];
  const literalSizes: string[] = [];
  const radii = new Set<string>();
  const offScale: string[] = [];
  let cardGrids = 0;

  root.walkDecls((decl: Declaration) => {
    const parent = decl.parent as Rule | undefined;
    const selector = parent && "selector" in parent ? parent.selector : "";

    // The token block is where literals belong — it IS the compiled system.
    if (decl.prop.startsWith("--")) return;

    const value = stripUrls(stripVarFallbacks(decl.value));
    if (HARMLESS.test(value.trim())) return;

    if (COLOUR_PROPS.test(decl.prop) && LITERAL_COLOUR.test(value)) {
      literalColours.push(`${selector} { ${decl.prop}: ${decl.value} }`);
    }

    if (SIZE_PROPS.test(decl.prop)) {
      const matches = [...value.matchAll(LITERAL_LENGTH)];
      for (const match of matches) {
        const px = match[2] === "px" ? Number(match[1]) : Number(match[1]) * 16;
        if (px === 0 || px === 1 || px === 2) continue;
        literalSizes.push(`${selector} { ${decl.prop}: ${decl.value} }`);
        if (/^(padding|margin|gap|row-gap|column-gap)/.test(decl.prop)) {
          const onScale = input.spacingScale.some((step) => Math.abs(step - px) < 1.5);
          if (!onScale) offScale.push(`${decl.prop}: ${match[0]}`);
        }
        break;
      }
    }

    if (decl.prop === "border-radius" && !decl.value.includes("var(")) radii.add(decl.value.trim());
  });

  root.walkRules((rule: Rule) => {
    if (/grid-template-columns/.test(rule.toString()) && /card/i.test(rule.selector)) cardGrids += 1;
  });

  if (literalColours.length) {
    findings.push({
      check: "literal-colour",
      severity: "finding",
      detail:
        `${literalColours.length} colour literal(s) outside the token block. Every colour is a solved token; ` +
        `a literal is a guess at a contrast pair the palette already answered. First: ${literalColours[0]}`,
    });
  }

  if (literalSizes.length > 3) {
    findings.push({
      check: "literal-size",
      severity: "finding",
      detail: `${literalSizes.length} size literal(s) bypassing the type and space scales. First: ${literalSizes[0]}`,
    });
  }

  if (offScale.length) {
    findings.push({
      check: "off-scale-spacing",
      severity: "finding",
      detail:
        `${offScale.length} spacing value(s) off the compiled scale. Drift between 84px here and 90px there is ` +
        `what the eye reads as sloppiness. Offenders: ${offScale.slice(0, 4).join(", ")}`,
    });
  }

  if (radii.size > 2) {
    findings.push({
      check: "radius-drift",
      severity: "finding",
      detail: `${radii.size} distinct literal radii (${[...radii].slice(0, 5).join(", ")}). The law allows one, two at most.`,
    });
  }

  if (cardGrids > 3) {
    findings.push({
      check: "card-soup",
      severity: "finding",
      detail: `${cardGrids} card grids. A card has to earn itself; a page of them is the default cheap move.`,
    });
  }

  const count = input.sectionIds.length;
  if (count < band[0] || count > band[1]) {
    findings.push({
      check: "section-band",
      severity: "finding",
      detail: `${count} sections, outside the ${band[0]}–${band[1]} band for this industry. ${
        count < band[0] ? "A brochure, not a homepage." : "A scroll of filler."
      }`,
    });
  }

  const duplicates = input.sectionIds.filter((id, i) => input.sectionIds.indexOf(id) !== i);
  if (duplicates.length) {
    findings.push({
      check: "duplicate-section-id",
      severity: "blocker",
      detail: `Repeated section id(s): ${[...new Set(duplicates)].join(", ")}. Per-section repair addresses sections by id.`,
    });
  }

  return findings;
}

/** A 0–100 score for the queue, weighted so blockers dominate. */
export function scoreOf(findings: AuditFinding[]): number {
  const cost = { blocker: 34, finding: 9, note: 2 } as const;
  const total = findings.reduce((sum, f) => sum + cost[f.severity], 0);
  return Math.max(0, 100 - total);
}
