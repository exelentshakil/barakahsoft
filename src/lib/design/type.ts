// Engine 2 — typography.
//
// The model picks two Google families and a voice. Every number below is
// derived, because the numbers are what separate typeset from typed and no
// model gets them right by hand.
//
// Four things happen here that a prompt reliably fails to produce:
//
// TRACKING THAT VARIES WITH SIZE. Display type needs negative tracking and
// caption type needs positive; using one value for both is the loudest
// amateur tell in web typography after bad measure.
//
// LEADING SOLVED FROM MEASURE AND X-HEIGHT. A flat 1.6 everywhere is wrong at
// both ends — a 120px headline at 1.6 has a hole through it, and a 72ch line
// of a large-x-height face at 1.6 is too tight.
//
// OPTICAL ALIGNMENT. Capsize trims the line box to the cap height, so a
// heading sits flush with what is beside it instead of floating on invisible
// leading. This is the difference between "aligned" and "almost aligned".
//
// FALLBACK METRICS. size-adjust and ascent-override on the fallback face, so
// nothing reflows when the webfont lands.

import { createFontStack, precomputeValues } from "@capsizecss/core";
import { fontFamilyToCamelCase } from "@capsizecss/metrics";
import { entireMetricsCollection } from "@capsizecss/metrics/entireMetricsCollection";

/**
 * The shipped collection is a union of 1965 per-family types and a handful of
 * system entries genuinely lack xHeight, so the union has no common member to
 * read. Normalising to one shape here is what keeps every call site honest
 * about the fallback rather than sprinkling casts through the engine.
 */
interface Metrics {
  familyName: string;
  capHeight: number;
  ascent: number;
  descent: number;
  lineGap: number;
  unitsPerEm: number;
  xHeight: number;
  xWidthAvg: number;
  category?: string;
}

export type TypeVoice = "editorial" | "utility" | "clinical" | "warm" | "brutal";

export interface TypeIntent {
  /** Google font family for display, e.g. "Anton". */
  displayFamily: string;
  /** Google font family for body, e.g. "Inter". */
  bodyFamily: string;
  voice?: TypeVoice;
  /** Target characters per line for body copy. The law wants 60–75. */
  measure?: number;
}

export interface TypeSystem {
  tokens: Record<string, string>;
  /** @font-face fallback overrides plus the cap-trim utilities. */
  css: string;
  fontHref: string;
  meta: {
    ratio: number;
    bodyPx: number;
    displayPx: number;
    /** Display divided by body. The ambition floor requires >= 8. */
    scaleContrast: number;
    tracking: Array<{ px: number; em: number }>;
    leading: Array<{ px: number; lh: number }>;
  };
}

/** Half two of the design law: display must be at least this many times body. */
export const MIN_SCALE_CONTRAST = 8;
/** And at least this many pixels at desktop. */
export const MIN_DISPLAY_PX = 88;

const STEPS = 9;
const BODY_STEP = 2;

const BODY_PX: Record<TypeVoice, number> = {
  editorial: 18,
  utility: 17,
  clinical: 17,
  warm: 18,
  brutal: 17,
};

const VIEWPORT_MIN = 375;
const VIEWPORT_MAX = 1440;

/**
 * Tracking anchors, interpolated in log space.
 *
 * Deliberately a hand-set curve rather than a formula: the relationship is not
 * analytic, it is what type designers do, and a tidy log formula overshoots
 * badly at display sizes (a naive fit puts 120px at -0.27em, which closes the
 * letters up into a single black bar).
 */
const TRACK_ANCHORS: Array<[number, number]> = [
  [11, 0.058],
  [14, 0.02],
  [17, 0.0],
  [24, -0.008],
  [40, -0.018],
  [72, -0.026],
  [120, -0.032],
  [220, -0.038],
];

function trackingFor(px: number): number {
  const first = TRACK_ANCHORS[0];
  const last = TRACK_ANCHORS[TRACK_ANCHORS.length - 1];
  if (px <= first[0]) return first[1];
  if (px >= last[0]) return last[1];
  for (let i = 1; i < TRACK_ANCHORS.length; i += 1) {
    const [x1, y1] = TRACK_ANCHORS[i - 1];
    const [x2, y2] = TRACK_ANCHORS[i];
    if (px <= x2) {
      const t = (Math.log(px) - Math.log(x1)) / (Math.log(x2) - Math.log(x1));
      return Number((y1 + (y2 - y1) * t).toFixed(4));
    }
  }
  return last[1];
}

/**
 * Leading from size, x-height and measure.
 *
 * All three matter and only the first is usually considered. A large-x-height
 * face needs more leading at the same size; a long measure needs more than a
 * short one; and both effects vanish as size grows, which is why every term is
 * scaled by the same size factor.
 */
function leadingFor(px: number, xHeightRatio: number, measureCh: number): number {
  // The falloff is deliberately faster than linear. A plain 17/px ratio still
  // reads 0.125 at 136px, which lands display leading near 1.02 — loose enough
  // to punch visible holes through a headline. Raising it to a power pulls the
  // curve down to the 0.86-0.95 band that display type actually wants, while
  // leaving body leading untouched at sizeFactor 1.
  const sizeFactor = Math.min(1, Math.pow(17 / px, 1.35));
  const base = 0.86 + 0.68 * sizeFactor;
  const measureAdj = (measureCh - 62) * 0.005 * sizeFactor;
  const xAdj = (xHeightRatio - 0.52) * 0.8 * sizeFactor;
  return Number(Math.min(1.78, Math.max(0.84, base + measureAdj + xAdj)).toFixed(3));
}

function metricsFor(family: string): Metrics {
  const key = fontFamilyToCamelCase(family) as keyof typeof entireMetricsCollection;
  const raw = (entireMetricsCollection[key] ?? entireMetricsCollection.inter) as Partial<Metrics> & {
    unitsPerEm: number;
    capHeight: number;
    ascent: number;
    descent: number;
    lineGap: number;
    familyName: string;
  };
  return {
    familyName: raw.familyName,
    capHeight: raw.capHeight,
    ascent: raw.ascent,
    descent: raw.descent,
    lineGap: raw.lineGap,
    unitsPerEm: raw.unitsPerEm,
    // A face without a measured x-height is rare and always a system stack.
    // 0.52 em is the sane middle of the humanist sans range.
    xHeight: raw.xHeight ?? raw.unitsPerEm * 0.52,
    xWidthAvg: raw.xWidthAvg ?? raw.unitsPerEm * 0.48,
    category: (raw as { category?: string }).category,
  };
}

/**
 * The locally-installed face a webfont is measured against.
 *
 * Matching by category matters: standing a serif in for a serif keeps the
 * adjusted metrics close enough that the swap is invisible, whereas adjusting
 * Arial to impersonate Fraunces produces a visible pop on load even when the
 * box size is right.
 */
function localFallbackFor(metrics: Metrics): Metrics {
  const category = (metrics as { category?: string }).category ?? "sans-serif";
  const key = category === "serif" ? "georgia" : category === "monospace" ? "courierNew" : "arial";
  return metricsFor((entireMetricsCollection[key as keyof typeof entireMetricsCollection] as { familyName: string }).familyName);
}

/** clamp() that grows linearly with the viewport between 375px and 1440px. */
function fluid(minPx: number, maxPx: number): string {
  if (Math.abs(maxPx - minPx) < 0.5) return `${Math.round(maxPx)}px`;
  const slope = (maxPx - minPx) / (VIEWPORT_MAX - VIEWPORT_MIN);
  return `clamp(${Math.round(minPx)}px, calc(${Math.round(minPx)}px + ${(slope * 100).toFixed(3)}vw - ${(slope * VIEWPORT_MIN).toFixed(2)}px), ${Math.round(maxPx)}px)`;
}

export function buildType(intent: TypeIntent): TypeSystem {
  const voice = intent.voice ?? "editorial";
  const measure = Math.min(75, Math.max(60, intent.measure ?? 66));
  const bodyPx = BODY_PX[voice];

  const displayMetrics = metricsFor(intent.displayFamily);
  const bodyMetrics = metricsFor(intent.bodyFamily);

  // The ambition floor is satisfied by construction rather than by hoping: the
  // top of the scale is pinned to whichever is larger, and the ratio is solved
  // backwards from it. A scale that cannot express a big headline is a scale
  // that guarantees a timid page.
  const displayPx = Math.max(MIN_DISPLAY_PX, bodyPx * MIN_SCALE_CONTRAST);
  const ratio = Math.pow(displayPx / bodyPx, 1 / (STEPS - 1 - BODY_STEP));

  const tokens: Record<string, string> = {};
  const tracking: Array<{ px: number; em: number }> = [];
  const leading: Array<{ px: number; lh: number }> = [];

  const displayX = displayMetrics.xHeight / displayMetrics.unitsPerEm;
  const bodyX = bodyMetrics.xHeight / bodyMetrics.unitsPerEm;

  for (let i = 0; i < STEPS; i += 1) {
    const px = bodyPx * Math.pow(ratio, i - BODY_STEP);
    const isDisplay = i > BODY_STEP + 1;

    // Big type shrinks harder on a phone than small type does; a linear
    // shrink either leaves the headline overflowing at 375px or leaves it
    // pathetic at 1440px.
    const shrink = Math.max(0.4, 1 - Math.max(0, i - BODY_STEP) * 0.058);
    tokens[`--fs-${i}`] = fluid(px * shrink, px);

    const em = trackingFor(px);
    const lh = leadingFor(px, isDisplay ? displayX : bodyX, measure);
    tokens[`--tr-${i}`] = `${em}em`;
    tokens[`--lh-${i}`] = String(lh);
    tracking.push({ px: Math.round(px), em });
    leading.push({ px: Math.round(px), lh });
  }

  tokens["--measure"] = `${measure}ch`;
  tokens["--fs-body"] = tokens[`--fs-${BODY_STEP}`];
  tokens["--lh-body"] = tokens[`--lh-${BODY_STEP}`];
  tokens["--tr-body"] = tokens[`--tr-${BODY_STEP}`];
  tokens["--fs-display"] = tokens[`--fs-${STEPS - 1}`];
  tokens["--lh-display"] = tokens[`--lh-${STEPS - 1}`];
  tokens["--tr-display"] = tokens[`--tr-${STEPS - 1}`];

  // Fallback stacks with size-adjust / ascent-override, so the pre-webfont
  // frame and the post-webfont frame occupy the same box.
  //
  // The overrides are generated FOR the fallback face, so the local face has
  // to be in the stack. Passing the webfont alone yields a bare family name
  // and no @font-face at all, which is a silent no-op — the whole point is the
  // adjusted local face that stands in before the webfont lands.
  const displayStack = createFontStack([displayMetrics, localFallbackFor(displayMetrics)], {
    fontFaceProperties: { fontDisplay: "swap" },
  });
  const bodyStack = createFontStack([bodyMetrics, localFallbackFor(bodyMetrics)], {
    fontFaceProperties: { fontDisplay: "swap" },
  });
  tokens["--font-display"] = displayStack.fontFamily;
  tokens["--font-body"] = bodyStack.fontFamily;

  // Cap trim. The negative margins pull the line box in to the cap height so a
  // heading aligns to its letterforms rather than to its leading.
  const trim = (family: Metrics, px: number, lh: number) => {
    const v = precomputeValues({ fontSize: px, leading: px * lh, fontMetrics: family });
    return { top: v.capHeightTrim, bottom: v.baselineTrim };
  };
  const dTrim = trim(displayMetrics, displayPx, leadingFor(displayPx, displayX, measure));
  const bTrim = trim(bodyMetrics, bodyPx, leadingFor(bodyPx, bodyX, measure));

  const css = [
    displayStack.fontFaces,
    bodyStack.fontFaces,
    `.cap-display::before{content:"";display:table;margin-bottom:${dTrim.top}}`,
    `.cap-display::after{content:"";display:table;margin-top:${dTrim.bottom}}`,
    `.cap-body::before{content:"";display:table;margin-bottom:${bTrim.top}}`,
    `.cap-body::after{content:"";display:table;margin-top:${bTrim.bottom}}`,
  ].join("\n");

  const families = [intent.displayFamily, intent.bodyFamily]
    .filter((f, i, a) => a.indexOf(f) === i)
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`)
    .join("&");
  const fontHref = `https://fonts.googleapis.com/css2?${families}&display=swap`;

  return {
    tokens,
    css,
    fontHref,
    meta: {
      ratio: Number(ratio.toFixed(4)),
      bodyPx,
      displayPx: Math.round(displayPx),
      scaleContrast: Number((displayPx / bodyPx).toFixed(2)),
      tracking,
      leading,
    },
  };
}
