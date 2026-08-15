import type { SitePayload } from "@/components/site-shell/types";

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
  return Object.keys(cssVars).length > 0 ? (cssVars as React.CSSProperties) : undefined;
}
