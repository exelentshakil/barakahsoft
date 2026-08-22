import type { DesignDna } from "@/lib/design-dna";
import { DEFAULT_DESIGN_DNA } from "@/lib/design-dna";

// Compiles a DesignDna spec into the concrete CSS custom properties that
// bespoke.css is written against.
//
// This is the join that makes generated markup safe. The generator never
// writes a color, a font stack, a radius, or a spacing rhythm -- it writes
// semantic classes, and every visual decision resolves through the tokens
// below. Two consequences worth stating plainly:
//
//   1. A generated page CANNOT come out off-brand, because there is no
//      channel through which it could express a color that isn't a token.
//      The previous approach -- instructing the model in prose to avoid 15
//      color families, then regex-rewriting the ones that slipped through
//      -- was fighting the same battle every generation and losing some.
//
//   2. Two leads with the same class vocabulary still look nothing alike,
//      because mood, geometry, type scale and section rhythm all shift the
//      rendered result substantially. The vocabulary is compositional
//      primitives, never finished blocks -- that distinction is what
//      separates this from the cookie-cutter template it replaces.

export interface DesignTokens {
  vars: Record<string, string>;
  fontHref: string | null;
  mood: DesignDna["mood"];
}

const RADIUS_SCALE: Record<DesignDna["geometry"]["radius"], { sm: string; md: string; lg: string; pill: string }> = {
  sharp: { sm: "0px", md: "0px", lg: "0px", pill: "0px" },
  soft: { sm: "4px", md: "8px", lg: "14px", pill: "999px" },
  rounded: { sm: "8px", md: "16px", lg: "28px", pill: "999px" },
  pill: { sm: "12px", md: "24px", lg: "40px", pill: "999px" },
};

const ELEVATION: Record<DesignDna["geometry"]["elevation"], { card: string; lift: string }> = {
  flat: { card: "none", lift: "none" },
  soft: {
    card: "0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.12)",
    lift: "0 12px 32px -12px rgb(0 0 0 / 0.18)",
  },
  dramatic: {
    card: "0 2px 4px rgb(0 0 0 / 0.06), 0 24px 48px -16px rgb(0 0 0 / 0.24)",
    lift: "0 32px 64px -20px rgb(0 0 0 / 0.35)",
  },
};

// Section rhythm is the single strongest lever on whether a page reads as
// premium or as a cramped template, so it gets real range rather than a
// token nudge.
const RHYTHM: Record<DesignDna["layout"]["sectionRhythm"], { section: string; gap: string }> = {
  tight: { section: "clamp(2.5rem, 5vw, 4rem)", gap: "1.25rem" },
  generous: { section: "clamp(4rem, 8vw, 7rem)", gap: "2rem" },
  cinematic: { section: "clamp(5.5rem, 12vw, 10rem)", gap: "3rem" },
};

const TYPE_SCALE: Record<DesignDna["typography"]["scale"], { display: string; h2: string; h3: string; body: string }> = {
  compact: {
    display: "clamp(2rem, 4.5vw, 3.25rem)",
    h2: "clamp(1.5rem, 2.6vw, 2.125rem)",
    h3: "clamp(1.125rem, 1.6vw, 1.375rem)",
    body: "1rem",
  },
  balanced: {
    display: "clamp(2.5rem, 6vw, 4.5rem)",
    h2: "clamp(1.75rem, 3.4vw, 2.75rem)",
    h3: "clamp(1.25rem, 1.9vw, 1.5rem)",
    body: "1.0625rem",
  },
  dramatic: {
    display: "clamp(3rem, 8.5vw, 6.5rem)",
    h2: "clamp(2rem, 4.6vw, 3.5rem)",
    h3: "clamp(1.375rem, 2.2vw, 1.75rem)",
    body: "1.125rem",
  },
};

const BORDER: Record<DesignDna["geometry"]["borderTreatment"], string> = {
  hairline: "1px",
  solid: "2px",
  none: "0px",
};

/**
 * Neutralise a colour, keeping only a trace of its hue.
 *
 * Surfaces and text are built from near-neutrals rather than the reference's
 * raw values. Two reasons, and the second is the important one.
 *
 * A reference site's measured "surface" is frequently a saturated brand
 * colour, and a page whose backgrounds and body text are both tinted reads
 * as cheap however good the layout is — premium design is almost always
 * neutral ground with colour used sparingly.
 *
 * It also makes the brand colour VISIBLE. When everything is tinted, an
 * accent has nothing to stand against; when the page is neutral, a single
 * saturated colour on the call to action is impossible to miss. That is the
 * whole reason for spending it there.
 */
function neutralise(hex: string, keepHue = 0.06): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  // Perceived brightness, so the neutral keeps the original's lightness.
  const grey = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const mix = (channel: number) => Math.round(grey + (channel - grey) * keepHue);

  return `#${[mix(r), mix(g), mix(b)].map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/**
 * Force a foreground to clear a contrast threshold against its background.
 *
 * Body text at 4.5:1 and large text at 3:1 are the accessibility floor, but
 * the reason to enforce them here is commercial: low-contrast text is the
 * most common way a generated page looks amateur, and it cannot be caught by
 * a prompt.
 */
function ensureContrast(foreground: string, background: string, minimum: number): string {
  if (contrastRatio(foreground, background) >= minimum) return foreground;

  const towardsWhite = relativeLuminance(background) < 0.5;
  const clean = foreground.replace("#", "");
  let r = parseInt(clean.slice(0, 2), 16);
  let g = parseInt(clean.slice(2, 4), 16);
  let b = parseInt(clean.slice(4, 6), 16);

  // Walk the foreground away from the background until it passes, rather
  // than snapping to black or white, so the hue survives where it can.
  for (let step = 0; step < 24; step++) {
    const shift = towardsWhite ? 10 : -10;
    r = Math.max(0, Math.min(255, r + shift));
    g = Math.max(0, Math.min(255, g + shift));
    b = Math.max(0, Math.min(255, b + shift));
    const candidate = `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
    if (contrastRatio(candidate, background) >= minimum) return candidate;
  }

  return towardsWhite ? "#FFFFFF" : "#0B0B0F";
}

/** #RRGGBB -> "r g b", so tokens can drive rgb(var(--x) / alpha) opacity. */
function rgbChannels(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = channel(parseInt(clean.slice(0, 2), 16));
  const g = channel(parseInt(clean.slice(2, 4), 16));
  const b = channel(parseInt(clean.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * A reference site's measured "on primary" color is frequently wrong once
 * it's re-applied to a different primary — the reference may have used it
 * over a lighter tint, or Firecrawl may have sampled the wrong element.
 * Rather than ship unreadable button text, pick whichever of black/white
 * actually passes against the resolved background.
 */
function readableOn(background: string, preferred: string): string {
  if (contrastRatio(background, preferred) >= 4.5) return preferred;
  return contrastRatio(background, "#FFFFFF") >= contrastRatio(background, "#0B0B0F") ? "#FFFFFF" : "#0B0B0F";
}

function googleFontHref(display: string, body: string): string | null {
  const families = Array.from(new Set([display, body].map((f) => f?.trim()).filter(Boolean)));
  if (families.length === 0) return null;
  const params = families
    .map((f) => `family=${encodeURIComponent(f!).replace(/%20/g, "+")}:wght@400;500;600;700;800;900`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/**
 * Whose colours the rebuilt site uses.
 *
 * The default is the reference palette, because a redesign is what is being
 * sold — a rebuild in the client's existing colours often does not read as a
 * redesign at all, particularly when their colours were part of the problem.
 * "client" keeps their real brand colour for owners who are attached to it,
 * and "hybrid" keeps their colour as the accent over the reference's
 * structure and surfaces.
 */
export type ColourSource = "reference" | "client" | "hybrid";

export function compileDesignTokens(
  input: DesignDna | null | undefined,
  options: { colourSource?: ColourSource; clientBrandHex?: string | null } = {}
): DesignTokens {
  const dna = input ?? DEFAULT_DESIGN_DNA;

  const source = options.colourSource ?? "reference";
  const clientHex = options.clientBrandHex && /^#[0-9a-fA-F]{6}$/.test(options.clientBrandHex)
    ? options.clientBrandHex.toUpperCase()
    : null;

  const p =
    source === "client" && clientHex
      ? { ...dna.palette, primary: clientHex, accent: dna.palette.accent }
      : source === "hybrid" && clientHex
        ? { ...dna.palette, accent: clientHex }
        : dna.palette;
  const radius = RADIUS_SCALE[dna.geometry.radius];
  const elevation = ELEVATION[dna.geometry.elevation];
  const rhythm = RHYTHM[dna.layout.sectionRhythm];
  const type = TYPE_SCALE[dna.typography.scale];

  // Ground and text are neutral; the brand colour is reserved for accents.
  // A saturated surface with tinted body text is what makes a generated page
  // read as cheap, and it leaves the accent nothing to stand against.
  const surface = neutralise(p.surface);
  const surfaceAlt = neutralise(p.surfaceAlt);
  const onPrimary = readableOn(p.primary, p.onPrimary);

  // Contrast is enforced rather than hoped for: body text at 4.5:1 and muted
  // text at 4.5:1 against the ground it actually sits on.
  const ink = ensureContrast(neutralise(p.ink), surface, 4.5);
  const inkMuted = ensureContrast(neutralise(p.inkMuted, 0.1), surface, 4.5);

  const vars: Record<string, string> = {
    "--bs-primary": p.primary,
    "--bs-primary-rgb": rgbChannels(p.primary),
    "--bs-on-primary": onPrimary,
    "--bs-accent": p.accent,
    "--bs-accent-rgb": rgbChannels(p.accent),
    "--bs-on-accent": readableOn(p.accent, "#0B0B0F"),
    "--bs-surface": surface,
    "--bs-surface-alt": surfaceAlt,
    "--bs-surface-rgb": rgbChannels(surface),
    "--bs-ink": ink,
    "--bs-ink-rgb": rgbChannels(ink),
    "--bs-ink-muted": inkMuted,

    // Inverted band — used by dark CTA/stat sections on a light page (and
    // the reverse on a dark one). Derived rather than authored so it always
    // has real contrast against the section it sits next to.
    "--bs-invert-surface": relativeLuminance(surface) > 0.4 ? "#0B0F19" : "#FFFFFF",
    "--bs-invert-ink": relativeLuminance(surface) > 0.4 ? "#FFFFFF" : "#0B0F19",

    "--bs-font-display": `"${dna.typography.displayFamily}", ui-sans-serif, system-ui, sans-serif`,
    "--bs-font-body": `"${dna.typography.bodyFamily}", ui-sans-serif, system-ui, sans-serif`,
    "--bs-display-weight": dna.typography.displayWeight,
    "--bs-heading-transform": dna.typography.headingCase === "upper" ? "uppercase" : "none",
    "--bs-heading-tracking": dna.typography.headingCase === "upper" ? "-0.01em" : "-0.025em",

    "--bs-text-display": type.display,
    "--bs-text-h2": type.h2,
    "--bs-text-h3": type.h3,
    "--bs-text-body": type.body,

    "--bs-radius-sm": radius.sm,
    "--bs-radius-md": radius.md,
    "--bs-radius-lg": radius.lg,
    "--bs-radius-pill": radius.pill,

    "--bs-shadow-card": elevation.card,
    "--bs-shadow-lift": elevation.lift,
    "--bs-border-width": BORDER[dna.geometry.borderTreatment],
    "--bs-border-color": `rgb(${rgbChannels(ink)} / 0.14)`,
    // The accent, guaranteed readable as text on the page's own ground —
    // a saturated brand colour is often unreadable at body size on white.
    "--bs-primary-on-surface": ensureContrast(p.primary, surface, 4.5),

    "--bs-section-y": rhythm.section,
    "--bs-gap": rhythm.gap,
  };

  return { vars, fontHref: googleFontHref(dna.typography.displayFamily, dna.typography.bodyFamily), mood: dna.mood };
}

/** Tokens as a React inline style object for the page wrapper element. */
export function tokensToStyle(tokens: DesignTokens): React.CSSProperties {
  return tokens.vars as React.CSSProperties;
}
