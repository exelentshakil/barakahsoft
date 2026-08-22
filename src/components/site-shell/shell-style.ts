import { compileDesignTokens } from "@/lib/design-tokens";
import type { SitePayload } from "@/components/site-shell/types";

// globals.css's hardcoded default --primary -- used as the channel fallback
// for leads with no real detected brand color, so gradient/blob/glow
// utilities (which read --primary-h/-s/-l, not the opaque --primary string)
// always have valid values instead of silently rendering black. --primary-s
// and --primary-l carry their "%" unit inside the stored string itself (a
// CSS custom property can't have a unit appended at the use site) so both
// `hsl(var(--primary-h) var(--primary-s) var(--primary-l))` and
// `calc(var(--primary-l) + 10%)` parse as valid percentages.
const DEFAULT_PRIMARY_HSL = { h: "234", s: "89%", l: "56%" };

const HSL_TRIPLET = /^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/;

// Per-payload CSS-variable overrides (brand color, real font) — shared by
// the composer's root and the standalone service/area/contact/booking
// pages, which previously rendered bare (no brand color, no per-lead font)
// since they never wrapped in the composer's styled root.
export function getShellStyle(payload: Pick<SitePayload, "brandColorHsl" | "fontFamily">): React.CSSProperties | undefined {
  const cssVars: Record<string, string> = {};
  if (payload.brandColorHsl) {
    cssVars["--primary"] = payload.brandColorHsl;
    cssVars["--ring"] = payload.brandColorHsl;
  }
  if (payload.fontFamily) {
    const fontStack = `"${payload.fontFamily}", var(--font-sans)`;
    cssVars["--font-sans"] = fontStack;
    cssVars["--font-display"] = fontStack;
  }

  // Separate H/S/L channels -- every gradient/blob/glow utility in
  // globals.css is built from these instead of a second hardcoded color, so
  // "premium" stays true whether a lead's real brand color is navy, red, or
  // teal, not just for one demo color.
  const match = payload.brandColorHsl?.match(HSL_TRIPLET);
  const channels = match ? { h: match[1], s: `${match[2]}%`, l: `${match[3]}%` } : DEFAULT_PRIMARY_HSL;
  cssVars["--primary-h"] = channels.h;
  cssVars["--primary-s"] = channels.s;
  cssVars["--primary-l"] = channels.l;

  return cssVars as React.CSSProperties;
}


/**
 * The style for a delivered page's ROOT element.
 *
 * The design tokens have to live here rather than on the generated body,
 * because the header and footer are styled from the same tokens. Scoping
 * them to the body meant the chrome fell back to unresolved variables and
 * rendered as a different design from the page it framed.
 */
export function siteRootStyle(
  payload: Pick<SitePayload, "brandColorHsl" | "fontFamily" | "designTokens">
): React.CSSProperties {
  const tokens = payload.designTokens ?? compileDesignTokens(null);
  return { ...getShellStyle(payload), ...tokens.vars } as React.CSSProperties;
}
