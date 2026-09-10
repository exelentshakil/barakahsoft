// The compiler. Intent in, one site's complete design system out.
//
// This is the file the pipeline calls. Everything it emits is derived from the
// PRD's stated intent, so two leads produce two genuinely different systems —
// different ramps, different scales, different rhythm — while the craft
// properties each engine guarantees hold for both.
//
// What the model gets back is a vocabulary of custom properties and a handful
// of primitives. It composes freely on top; it never writes a literal.

import { buildPalette, type ColourIntent, type Palette } from "./colour";
import { buildType, type TypeIntent, type TypeSystem } from "./type";
import { buildSpace, type SpaceIntent, type SpaceSystem } from "./space";
import { buildMotion, type MotionIntent, type MotionSystem } from "./motion";
import { CONTAINMENT } from "./containment";

export type Radius = "sharp" | "soft" | "rounded";
export type Texture = "none" | "grain";

export interface DesignIntent {
  colour: ColourIntent;
  type: TypeIntent;
  space: SpaceIntent;
  motion: MotionIntent;
  /** One value across the page. The law allows two at most; this is the one. */
  radius?: Radius;
  texture?: Texture;
}

export interface DesignSystem {
  tokens: Record<string, string>;
  /** Containment, the token block, and every engine's rules. Ready to serve. */
  css: string;
  fontHref: string;
  meta: {
    colour: Palette["meta"];
    type: TypeSystem["meta"];
    space: SpaceSystem["meta"];
    motion: MotionSystem["meta"];
    radius: Radius;
    texture: Texture;
  };
}

const RADIUS: Record<Radius, string> = { sharp: "0px", soft: "6px", rounded: "16px" };

// A grain layer, because the ambition floor requires one and bald flat colour
// is a large part of why generated pages read as machine-made. Deliberately
// almost invisible: the point is that the surface stops being perfectly
// uniform, not that anyone notices texture.
const GRAIN =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E";

export function compileDesignSystem(intent: DesignIntent): DesignSystem {
  const colour = buildPalette(intent.colour);
  const type = buildType(intent.type);
  const space = buildSpace(intent.space);
  const motion = buildMotion(intent.motion);
  const radius = intent.radius ?? "soft";
  const texture = intent.texture ?? "grain";

  const tokens: Record<string, string> = {
    ...colour.tokens,
    ...type.tokens,
    ...space.tokens,
    ...motion.tokens,
    "--radius": RADIUS[radius],
  };

  const tokenBlock = `.bespoke-page{${Object.entries(tokens)
    .map(([name, value]) => `${name}:${value}`)
    .join(";")}}`;

  // Ground utilities set background and text colour TOGETHER, always from a
  // pair the colour engine solved. This is the one structural guarantee worth
  // keeping from the system being replaced: an unreadable section is not
  // something the page can express, because the model never names either half
  // of the pair separately.
  // Ground utilities set background and text colour TOGETHER, always from a
  // pair the colour engine solved. This is the one structural idea worth
  // keeping from the system being replaced: an unreadable section is not
  // something the page can express, because the model never names either half
  // of the pair separately.
  //
  // Supporting colours travel as custom properties rather than as descendant
  // rules. `.on-dark .muted { color: … }` and `.on-paper .muted { color: … }`
  // have identical specificity, so a dark card sitting inside a light section
  // resolved by source order and painted its muted text in the LIGHT ground's
  // ink — 2.26:1, caught by the rendered audit on the first run. Custom
  // properties inherit from the nearest ancestor that sets them, which is
  // exactly "nearest ground wins" and holds at any nesting depth.
  const grounds = `
.bespoke-page .on-paper{background:var(--paper);color:var(--ink);--muted:var(--ink-2);--on-ground:var(--brand-ink);--rule:var(--line)}
.bespoke-page .on-paper-2{background:var(--paper-2);color:var(--ink);--muted:var(--ink-2);--on-ground:var(--brand-ink);--rule:var(--line)}
.bespoke-page .on-paper-3{background:var(--paper-3);color:var(--ink);--muted:var(--ink-2);--on-ground:var(--brand-ink);--rule:var(--line-strong)}
.bespoke-page .on-dark{background:var(--dark);color:var(--on-dark);--muted:var(--on-dark-2);--on-ground:var(--brand-on-dark);--rule:var(--line-on-dark)}
.bespoke-page .on-dark-2{background:var(--dark-2);color:var(--on-dark);--muted:var(--on-dark-2);--on-ground:var(--brand-on-dark);--rule:var(--line-on-dark)}
.bespoke-page .on-brand{background:var(--brand);color:var(--on-brand);--muted:var(--on-brand);--on-ground:var(--on-brand);--rule:var(--on-brand)}
.bespoke-page .muted{color:var(--muted)}
.bespoke-page .accent{color:var(--on-ground)}
.bespoke-page hr,.bespoke-page .rule{border-top:1px solid var(--rule)}`.trim()

  const root = `
.bespoke-page{position:relative;isolation:isolate;background:var(--paper);color:var(--ink);--muted:var(--ink-2);--on-ground:var(--brand-ink);--rule:var(--line);font-family:var(--font-body);font-size:var(--fs-body);line-height:var(--lh-body);letter-spacing:var(--tr-body);-webkit-font-smoothing:antialiased}
.bespoke-page :where(h1,h2,h3){font-family:var(--font-display);letter-spacing:var(--tr-display);line-height:var(--lh-display)}
.bespoke-page :where(h4,h5,h6){font-family:var(--font-display);line-height:var(--lh-3)}
.bespoke-page :where(img,video){border-radius:inherit}
.bespoke-page :where(button,input,select,textarea,.btn,.card){border-radius:var(--radius)}`.trim();

  const grain =
    texture === "grain"
      ? `.bespoke-page::after{content:"";position:fixed;inset:0;z-index:9;pointer-events:none;opacity:.04;background-image:url("${GRAIN}")}`
      : "";

  const css = [CONTAINMENT, tokenBlock, type.css, root, grounds, space.css, motion.css, grain]
    .filter(Boolean)
    .join("\n\n");

  return {
    tokens,
    css,
    fontHref: type.fontHref,
    meta: { colour: colour.meta, type: type.meta, space: space.meta, motion: motion.meta, radius, texture },
  };
}

export { buildPalette, contrastOf, BODY_RATIO, DISPLAY_RATIO } from "./colour";
export { buildType, MIN_SCALE_CONTRAST, MIN_DISPLAY_PX } from "./type";
export { buildSpace, MIN_SECTION_PAD_PX } from "./space";
export { buildMotion } from "./motion";
export { CONTAINMENT } from "./containment";
