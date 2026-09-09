import type React from "react";

// One brand colour, applied as inline custom properties.
//
// globals.css defines the theme once at :root, which is correct for a single
// brand and wrong for a deployment serving several. Overriding inline on the
// root element means a partner's dashboard and landing page take their own
// colour without a second stylesheet, a build-time theme, or a class the whole
// component tree has to opt into.
//
// The same technique already runs per lead on delivered client sites — see
// getShellStyle in components/site-shell/shell-style.ts, which this shares its
// channel handling with rather than reimplementing.

const HSL_TRIPLET = /^\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*$/;

/** globals.css's own --primary, used when a tenant's value is malformed. */
const FALLBACK = { h: "234", s: "89%", l: "56%" };

/**
 * Split "H S% L%" into the separate channels the theme's gradients need.
 *
 * Every gradient, glow and blob utility in globals.css is built from
 * --primary-h/-s/-l rather than a second hardcoded colour, so they have to be
 * set alongside --primary or those utilities silently render black. The `%`
 * lives inside the stored string because a CSS custom property cannot have a
 * unit appended at the use site.
 */
export function brandChannels(hsl: string | null | undefined): { h: string; s: string; l: string } {
  const match = hsl?.match(HSL_TRIPLET);
  if (!match) return FALLBACK;
  return { h: match[1], s: `${match[2]}%`, l: `${match[3]}%` };
}

/**
 * Inline style setting a brand colour for a whole document.
 *
 * Applied to <html> in the root layout, so it is in place before any component
 * paints and there is no flash of the platform's indigo on a partner's domain.
 */
export function brandStyle(hsl: string | null | undefined): React.CSSProperties {
  const channels = brandChannels(hsl);
  const value = `${channels.h} ${channels.s} ${channels.l}`;
  return {
    "--primary": value,
    "--ring": value,
    "--primary-h": channels.h,
    "--primary-s": channels.s,
    "--primary-l": channels.l,
  } as React.CSSProperties;
}
