// Engine 1 — colour.
//
// The model never names a colour. It states intent (a hue, how saturated, how
// warm the ground should feel) and this file emits every literal value the
// page will use, derived in OKLCH.
//
// Two properties matter and neither survives a model guessing hex codes:
//
// PERCEPTUAL EVENNESS. The neutral ramp steps by a constant delta-L in OKLCH,
// so the gap between step 3 and 4 looks the same size as the gap between 9 and
// 10. Ramps picked by eye (or by a model) bunch up in the midtones and read as
// muddy; that bunching is most of the difference between a palette that looks
// considered and one that looks chosen.
//
// SOLVED CONTRAST. Every "text on X" token is computed by walking lightness
// until it clears its required ratio, so an unreadable pair is not something
// the palette can express. The old pipeline let the model pick and then had a
// gate catch it afterwards, which is how white-on-white shipped once.

import { oklch, formatHex, wcagContrast, clampChroma, type Oklch } from "culori";

export type ChromaLevel = "muted" | "moderate" | "vivid";
export type Warmth = "cool" | "neutral" | "warm";

export interface ColourIntent {
  /** The client's real brand colour when the scrape found one. Wins over `hue`. */
  brandHex?: string | null;
  /** Fallback hue in degrees when there is no brand colour to anchor on. */
  hue?: number | null;
  chroma?: ChromaLevel;
  warmth?: Warmth;
  /** An optional second accent. The law caps the page at two hues. */
  accentHex?: string | null;
}

export interface Palette {
  tokens: Record<string, string>;
  meta: {
    brandHue: number;
    neutralHue: number;
    warmth: Warmth;
    chroma: ChromaLevel;
    /** Lightness of each neutral step, lightest first. Asserted on in tests. */
    rampL: number[];
  };
}

/** Body text floor. Half one of the design law. */
export const BODY_RATIO = 7;
/** Large display floor. */
export const DISPLAY_RATIO = 4.5;

const RAMP_STEPS = 13;
const RAMP_L_MAX = 0.985;
const RAMP_L_MIN = 0.145;

const CHROMA_PEAK: Record<ChromaLevel, number> = { muted: 0.075, moderate: 0.135, vivid: 0.2 };
const NEUTRAL_TINT: Record<Warmth, { h: number; c: number }> = {
  warm: { h: 68, c: 0.009 },
  neutral: { h: 0, c: 0.0 },
  cool: { h: 248, c: 0.008 },
};

function hex(l: number, c: number, h: number): string {
  const colour = clampChroma({ mode: "oklch", l, c, h } as Oklch, "oklch");
  return formatHex(colour) ?? "#000000";
}

function readHue(input: string | null | undefined, fallback: number): { h: number; c: number } | null {
  if (!input) return null;
  const parsed = oklch(input);
  if (!parsed || typeof parsed.l !== "number") return null;
  return { h: parsed.h ?? fallback, c: parsed.c ?? 0 };
}

function ratio(a: string, b: string): number {
  return wcagContrast(a, b) ?? 1;
}

/**
 * Guarantee a colour clears a ratio, starting from the lightness the design
 * actually wants.
 *
 * The naive version of this — walk from a neutral start until the floor is
 * met, take the first hit — is a trap. It returns minimum-viable contrast
 * every time, so `--ink` comes out a washed grey-brown at 7.4:1 instead of a
 * near-black at 16:1, and the page reads timid before a single section has
 * been composed. The floor is a floor, not a target.
 *
 * So: begin at `targetL`, the lightness a designer would choose, and only
 * move if it fails. Most calls never move at all.
 */
function ensureOn(ground: string, targetL: number, h: number, c: number, min: number, direction: "darker" | "lighter"): string {
  const step = direction === "darker" ? -0.015 : 0.015;
  const limit = direction === "darker" ? 0.05 : 0.995;

  for (let l = targetL; direction === "darker" ? l >= limit : l <= limit; l += step) {
    // Chroma cannot survive at the extremes; forcing it produces a muddy cast.
    const taper = 1 - Math.abs(l - 0.55) / 0.55;
    const candidate = hex(l, Math.max(0, c * Math.max(0.2, taper)), h);
    if (ratio(candidate, ground) >= min) return candidate;
  }
  return direction === "darker" ? hex(0.05, 0, h) : hex(0.995, 0, h);
}

/** rgb triplet for `rgb(var(--x) / 40%)` style alpha compositing in generated CSS. */
function triplet(value: string): string {
  const m = value.replace("#", "");
  const n = m.length === 3 ? m.split("").map((d) => d + d).join("") : m;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)).join(" ");
}

export function buildPalette(intent: ColourIntent): Palette {
  const chroma = intent.chroma ?? "moderate";
  const warmth = intent.warmth ?? "neutral";

  const brand = readHue(intent.brandHex, 25);
  const brandHue = brand?.h ?? intent.hue ?? 25;
  const brandChroma = Math.max(CHROMA_PEAK[chroma], brand?.c ?? 0);

  const tint = NEUTRAL_TINT[warmth];
  const neutralHue = warmth === "neutral" ? brandHue : tint.h;

  // ── the neutral ramp: constant delta-L, lightest first ──
  const delta = (RAMP_L_MAX - RAMP_L_MIN) / (RAMP_STEPS - 1);
  const rampL: number[] = [];
  const tokens: Record<string, string> = {};
  for (let i = 0; i < RAMP_STEPS; i += 1) {
    const l = RAMP_L_MAX - delta * i;
    rampL.push(Number(l.toFixed(4)));
    tokens[`--n-${i}`] = hex(l, tint.c, neutralHue);
  }

  // Surface tokens are NOT ramp steps. The ramp steps by 0.07 so that it reads
  // evenly across its whole length, but adjacent page surfaces need to differ
  // by far less than that — a section ground a whole ramp step away from the
  // page ground reads as a grey box sitting on the page rather than as a
  // change of ground. These are deliberate small deltas.
  const paper = hex(0.985, tint.c, neutralHue);
  const paper2 = hex(0.958, tint.c, neutralHue);
  const paper3 = hex(0.925, tint.c, neutralHue);
  const dark = hex(0.17, tint.c * 1.4, neutralHue);
  const dark2 = hex(0.235, tint.c * 1.4, neutralHue);

  tokens["--paper"] = paper;
  tokens["--paper-2"] = paper2;
  tokens["--paper-3"] = paper3;
  tokens["--dark"] = dark;
  tokens["--dark-2"] = dark2;

  // Text, at the lightness the design wants, guaranteed to clear its floor.
  tokens["--ink"] = ensureOn(paper, 0.22, neutralHue, tint.c * 2, BODY_RATIO, "darker");
  tokens["--ink-2"] = ensureOn(paper, 0.42, neutralHue, tint.c * 2, BODY_RATIO, "darker");
  tokens["--ink-3"] = ensureOn(paper, 0.56, neutralHue, tint.c * 2, DISPLAY_RATIO, "darker");
  tokens["--on-dark"] = ensureOn(dark, 0.98, neutralHue, tint.c, BODY_RATIO, "lighter");
  tokens["--on-dark-2"] = ensureOn(dark, 0.82, neutralHue, tint.c * 2, BODY_RATIO, "lighter");

  // Brand. `--brand` is the fill; `--brand-ink` is the same hue made legible
  // as TEXT on paper, nearly always darker. Painting body copy in the fill was
  // the single most common contrast failure in the old pipeline.
  const brandFill = hex(0.58, brandChroma, brandHue);
  tokens["--brand"] = brandFill;
  tokens["--brand-hover"] = hex(0.52, brandChroma, brandHue);
  tokens["--brand-ink"] = ensureOn(paper, 0.5, brandHue, brandChroma, BODY_RATIO, "darker");
  tokens["--brand-ink-lg"] = ensureOn(paper, 0.55, brandHue, brandChroma, DISPLAY_RATIO, "darker");
  tokens["--brand-on-dark"] = ensureOn(dark, 0.68, brandHue, brandChroma, DISPLAY_RATIO, "lighter");
  tokens["--brand-wash"] = hex(0.95, brandChroma * 0.28, brandHue);
  tokens["--on-brand"] =
    ratio("#ffffff", brandFill) >= DISPLAY_RATIO ? "#ffffff" : ensureOn(brandFill, 0.15, brandHue, 0, DISPLAY_RATIO, "darker");

  // A brand GROUND is a different problem from a brand fill, and conflating
  // them is a contrast failure waiting to happen. The fill sits under a button
  // label — large, bold, 4.5:1 is the right floor. A ground sits under
  // paragraphs, and body copy needs 7:1, which a vivid mid-lightness hue
  // cannot give to white OR to black: #ED1C24 at L 0.58 measures 4.84 against
  // white and about 4.3 against near-black. Neither text colour can fix it,
  // because the ground itself is in the wrong place.
  //
  // So the ground is searched for rather than assumed: walk the brand hue away
  // from mid-lightness until some on-colour clears the body floor, and pair
  // them. The band a page paints paragraphs on is a deeper brand than the one
  // on its buttons, which is what a designer would have done anyway.
  let groundL = 0.58;
  let groundHex = brandFill;
  let onGround = "#ffffff";
  for (let step = 0; step <= 26; step += 1) {
    const candidate = hex(0.58 - step * 0.018, brandChroma * (1 - step * 0.012), brandHue);
    const white = ratio("#ffffff", candidate);
    if (white >= BODY_RATIO) {
      groundL = 0.58 - step * 0.018;
      groundHex = candidate;
      onGround = "#ffffff";
      break;
    }
  }
  tokens["--brand-ground"] = groundHex;
  tokens["--on-brand-ground"] = onGround;
  tokens["--brand-ground-muted"] = ensureOn(groundHex, Math.min(0.92, groundL + 0.5), brandHue, brandChroma * 0.15, BODY_RATIO, "lighter");

  // ── optional second accent ──
  const accent = readHue(intent.accentHex, brandHue);
  if (accent) {
    tokens["--accent"] = hex(0.58, Math.max(0.06, accent.c), accent.h);
    tokens["--accent-ink"] = ensureOn(paper, 0.5, accent.h, Math.max(0.06, accent.c), BODY_RATIO, "darker");
  }

  // ── structure ──
  tokens["--line"] = hex(0.9, tint.c, neutralHue);
  tokens["--line-strong"] = hex(0.78, tint.c, neutralHue);
  tokens["--line-on-dark"] = hex(0.32, tint.c, neutralHue);
  tokens["--focus"] = tokens["--brand-ink"];

  // Alpha channels. Generated CSS needs translucent scrims and washes, and a
  // literal rgba() is a value the audit reports; these give it a token route.
  tokens["--ink-rgb"] = triplet(tokens["--ink"]);
  tokens["--paper-rgb"] = triplet(paper);
  tokens["--brand-rgb"] = triplet(brandFill);

  return { tokens, meta: { brandHue, neutralHue, warmth, chroma, rampL } };
}

/** Measured ratio for a pair of tokens, for the audit and for tests. */
export function contrastOf(a: string, b: string): number {
  return Number(ratio(a, b).toFixed(2));
}
