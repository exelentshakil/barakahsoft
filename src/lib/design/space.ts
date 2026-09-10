// Engine 3 — space, grid and composition.
//
// Spacing is where an assembled page gives itself away. Values picked one at a
// time drift — 84px here, 90px there, 72px because it looked right — and the
// eye reads the drift as sloppiness long before it can name it. Everything
// here comes off one scale built from one unit.
//
// The compositional primitives are the other half. A model left to write its
// own layout reaches for `1fr 1fr` and a centred container every time, which
// is why unharnessed output looks like a stack of rectangles. These give it
// real proportions, bleed levels and on-grid overlap offsets to compose with —
// parametric and freely combinable, which is what makes this a design system
// rather than the fixed section renderers it replaces.

export type Rhythm = "tight" | "generous" | "cinematic";
export type Density = "dense" | "regular" | "airy";

export interface SpaceIntent {
  rhythm?: Rhythm;
  density?: Density;
  /** Content column width in px. */
  maxWidth?: number;
}

export interface SpaceSystem {
  tokens: Record<string, string>;
  /** Bleed levels, layout primitives and the grid. */
  css: string;
  meta: { unit: number; ratio: number; sectionMinPx: number; sectionMaxPx: number; steps: number[] };
}

/** Half two of the design law: the floor for section padding at desktop. */
export const MIN_SECTION_PAD_PX = 96;
export const MIN_SECTION_PAD_MAX_PX = 200;

const VIEWPORT_MIN = 375;
const VIEWPORT_MAX = 1440;

const UNIT: Record<Density, number> = { dense: 7, regular: 8, airy: 9 };
const SCALE_RATIO: Record<Density, number> = { dense: 1.4, regular: 1.5, airy: 1.6 };

// Desktop section padding by rhythm. Every one of these clears the ambition
// floor; "tight" here still means 112px, because the timid end of the range
// is what the law exists to prevent.
const SECTION_PAD: Record<Rhythm, [number, number]> = {
  tight: [72, 112],
  generous: [88, 160],
  cinematic: [104, 216],
};

/**
 * Split ratios drawn from proportions that have a reason to exist.
 *
 * `1fr 1fr` is the default a model reaches for and it is almost always the
 * wrong answer: an even split gives two elements equal weight, which means the
 * composition says nothing about which one matters.
 */
const SPLITS: Record<string, string> = {
  "--split-major": "1.618fr 1fr",
  "--split-minor": "1fr 1.618fr",
  "--split-lead": "2.2fr 1fr",
  "--split-trail": "1fr 2.2fr",
  "--split-even": "1fr 1fr",
};

function fluid(minPx: number, maxPx: number): string {
  if (Math.abs(maxPx - minPx) < 0.5) return `${Math.round(maxPx)}px`;
  const slope = (maxPx - minPx) / (VIEWPORT_MAX - VIEWPORT_MIN);
  return `clamp(${Math.round(minPx)}px, calc(${Math.round(minPx)}px + ${(slope * 100).toFixed(3)}vw - ${(slope * VIEWPORT_MIN).toFixed(2)}px), ${Math.round(maxPx)}px)`;
}

export function buildSpace(intent: SpaceIntent): SpaceSystem {
  const density = intent.density ?? "regular";
  const rhythm = intent.rhythm ?? "generous";
  const unit = UNIT[density];
  const ratio = SCALE_RATIO[density];
  const maxWidth = intent.maxWidth ?? 1240;

  const tokens: Record<string, string> = {};

  // One scale, ten steps, every value a multiple of the unit so that anything
  // built from it lands on the same rhythm.
  const steps: number[] = [];
  for (let i = 0; i < 10; i += 1) {
    const raw = unit * Math.pow(ratio, i - 1);
    const snapped = Math.max(unit / 2, Math.round(raw / (unit / 2)) * (unit / 2));
    steps.push(snapped);
    tokens[`--s-${i}`] = `${snapped}px`;
  }

  tokens["--u"] = `${unit}px`;
  tokens["--maxw"] = `${maxWidth}px`;

  const [padMin, padMaxRaw] = SECTION_PAD[rhythm];
  const padMax = Math.max(MIN_SECTION_PAD_PX, padMaxRaw);
  tokens["--section-y"] = fluid(padMin, padMax);
  tokens["--section-y-lg"] = fluid(padMin * 1.35, padMax * 1.4);
  tokens["--gutter"] = fluid(22, Math.round(unit * 5.5));

  // Overlap offsets are multiples of the unit, so an element deliberately
  // breaking its container still lands on the same grid everything else is on.
  // Off-grid overlap is what makes a "bold" layout read as a mistake.
  tokens["--overlap-1"] = `${unit * 4}px`;
  tokens["--overlap-2"] = `${unit * 8}px`;
  tokens["--overlap-3"] = `${unit * 13}px`;

  for (const [key, value] of Object.entries(SPLITS)) tokens[key] = value;

  const css = `
.bespoke-page .wrap{width:100%;max-width:var(--maxw);margin-inline:auto;padding-inline:var(--gutter)}
.bespoke-page .bleed-wide{width:min(100% - var(--gutter) * 2, calc(var(--maxw) + var(--s-7) * 2));margin-inline:auto}
.bespoke-page .bleed-full{width:100vw;margin-inline:calc(50% - 50vw);max-width:none}
.bespoke-page .section{padding-block:var(--section-y)}
.bespoke-page .section-lg{padding-block:var(--section-y-lg)}
.bespoke-page .stack > * + *{margin-top:var(--flow, var(--s-4))}
.bespoke-page .cluster{display:flex;flex-wrap:wrap;gap:var(--flow, var(--s-3));align-items:center}
.bespoke-page .switcher{display:flex;flex-wrap:wrap;gap:var(--flow, var(--s-5))}
.bespoke-page .switcher > *{flex:1 1 var(--switch-at, 28ch)}
.bespoke-page .sidebar{display:flex;flex-wrap:wrap;gap:var(--flow, var(--s-5))}
.bespoke-page .sidebar > :first-child{flex:1 1 var(--side-w, 20ch)}
.bespoke-page .sidebar > :last-child{flex:999 1 var(--side-min, 50%)}
.bespoke-page .split{display:grid;grid-template-columns:var(--cols, var(--split-major));gap:var(--flow, var(--s-6));align-items:var(--align, center)}
.bespoke-page .grid{display:grid;grid-template-columns:repeat(var(--cols-n, 3), minmax(0, 1fr));gap:var(--flow, var(--s-5))}
.bespoke-page .measure{max-width:var(--measure)}
.bespoke-page .pull-up-1{margin-top:calc(var(--overlap-1) * -1)}
.bespoke-page .pull-up-2{margin-top:calc(var(--overlap-2) * -1)}
.bespoke-page .pull-in-1{margin-inline-start:calc(var(--overlap-1) * -1)}
.bespoke-page .pull-in-2{margin-inline-start:calc(var(--overlap-2) * -1)}
@media(max-width:860px){
.bespoke-page .split{grid-template-columns:1fr}
.bespoke-page .grid{grid-template-columns:repeat(var(--cols-sm, 1), minmax(0, 1fr))}
.bespoke-page .pull-up-1,.bespoke-page .pull-up-2{margin-top:0}
.bespoke-page .pull-in-1,.bespoke-page .pull-in-2{margin-inline-start:0}
}`.trim();

  return { tokens, css, meta: { unit, ratio, sectionMinPx: padMin, sectionMaxPx: padMax, steps } };
}
