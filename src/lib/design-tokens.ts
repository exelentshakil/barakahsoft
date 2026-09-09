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
 */
function ensureContrast(foreground: string, background: string, minimum: number): string {
  if (contrastRatio(foreground, background) >= minimum) return foreground;

  const towardsWhite = relativeLuminance(background) < 0.5;
  const clean = foreground.replace("#", "");
  let r = parseInt(clean.slice(0, 2), 16);
  let g = parseInt(clean.slice(2, 4), 16);
  let b = parseInt(clean.slice(4, 6), 16);

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

export type ColourSource = "reference" | "client" | "hybrid";

function distinguishAccent<T extends { primary: string; accent: string }>(palette: T, dna: DesignDna): T {
  const collides = (candidate: string) =>
    candidate.toUpperCase() === palette.primary.toUpperCase() || contrastRatio(candidate, palette.primary) < 1.15;

  if (!collides(palette.accent)) return palette;

  for (const candidate of [dna.palette.accent, DEFAULT_DESIGN_DNA.palette.accent, DEFAULT_DESIGN_DNA.palette.primary]) {
    if (candidate && !collides(candidate)) return { ...palette, accent: candidate };
  }
  return { ...palette, accent: rotateHue(palette.primary, 150) };
}

function rotateHue(hex: string, degrees: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return hex;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (((h / 6) * 360 + degrees) % 360) / 360;

  const hue = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const pp = 2 * l - q;
    if (t < 1 / 6) return pp + (q - pp) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return pp + (q - pp) * (2 / 3 - t) * 6;
    return pp;
  };
  const to = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${to(hue(h + 1 / 3))}${to(hue(h))}${to(hue(h - 1 / 3))}`.toUpperCase();
}

export function compileDesignTokens(
  input: DesignDna | null | undefined,
  options: { colourSource?: ColourSource; clientBrandHex?: string | null } = {}
): DesignTokens {
  const dna = input ?? DEFAULT_DESIGN_DNA;

  const clientHex = options.clientBrandHex && /^#[0-9a-fA-F]{6}$/.test(options.clientBrandHex)
    ? options.clientBrandHex.toUpperCase()
    : null;

  // Default to preserving the client's real brand color when available (from their original scrape / logo),
  // while applying the inspiration trade's layout, spacing, typography, motifs and geometry.
  const source = options.colourSource ?? (clientHex ? "client" : "reference");

  const chosen =
    source === "client" && clientHex
      ? { ...dna.palette, primary: clientHex, accent: dna.palette.accent }
      : source === "hybrid" && clientHex
        ? { ...dna.palette, accent: clientHex }
        : dna.palette;

  const p = distinguishAccent(chosen, dna);
  const radius = RADIUS_SCALE[dna.geometry.radius];
  const elevation = ELEVATION[dna.geometry.elevation];
  const rhythm = RHYTHM[dna.layout.sectionRhythm];
  const type = TYPE_SCALE[dna.typography.scale];

  const surface = neutralise(p.surface);
  const surfaceAlt = neutralise(p.surfaceAlt);
  const onPrimary = readableOn(p.primary, p.onPrimary);

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

    // The inverted band: always the opposite of the page, whichever way the
    // page went. Everything inside a .bs-section--ink reads from this family
    // rather than from --bs-ink, because --bs-ink is the page's TEXT colour and
    // is white on a dark palette — which is how a section rendered white text
    // on a white background and shipped.
    "--bs-invert-surface": relativeLuminance(surface) > 0.4 ? "#0B0F19" : "#FFFFFF",
    "--bs-invert-ink": relativeLuminance(surface) > 0.4 ? "#FFFFFF" : "#0B0F19",
    // Secondary copy inside that band. Not an alpha of the ink colour, because
    // an alpha assumes the ground is dark and goes invisible when it is light.
    "--bs-invert-muted": relativeLuminance(surface) > 0.4 ? "#C7CCD9" : "#3C4457",
    "--bs-invert-line": relativeLuminance(surface) > 0.4 ? "rgba(255,255,255,.14)" : "rgba(11,15,25,.14)",
    "--bs-invert-card": relativeLuminance(surface) > 0.4 ? "rgba(255,255,255,.06)" : "rgba(11,15,25,.05)",
    // An accent that stays legible on whichever ground the band actually has.
    "--bs-invert-accent": ensureContrast(
      p.primary,
      relativeLuminance(surface) > 0.4 ? "#0B0F19" : "#FFFFFF",
      4.5
    ),

    // The hero mark sits on a photograph under a near-black scrim, not on
    // --bs-surface. A raw --bs-primary reads fine on a white card and
    // disappears there whenever a client's brand colour is itself dark (navy,
    // forest green, maroon) — the failure mode a screenshot caught: "Colorado
    // Springs" in <span class="bs-mark"> going muddy against the hero photo.
    // Computed once here, against the actual dark ground the hero scrim
    // renders (#0B0F19, matching --bs-invert-surface's dark branch) at the
    // WCAG large-text minimum (hero marks are always big, bold display type),
    // so the fix holds for every brand colour a lead can bring, not just this
    // one, without ever muting a primary that was already legible.
    "--bs-mark-hero": ensureContrast(p.primary, "#0B0F19", 3),

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
    "--bs-primary-on-surface": ensureContrast(p.primary, surface, 4.5),

    "--bs-section-y": rhythm.section,
    "--bs-gap": rhythm.gap,
  };

  return { vars, fontHref: googleFontHref(dna.typography.displayFamily, dna.typography.bodyFamily), mood: dna.mood };
}
