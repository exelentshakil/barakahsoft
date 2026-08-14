// Converts a tenant's hex brand color into the "H S% L%" format shadcn's CSS
// variables expect, so --primary can be overridden per tenant at runtime
// while every shadcn component (Button, Progress, etc.) picks it up for free.
export function hexToHslTriplet(hex: string): string {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function tenantThemeStyle(hex: string | null | undefined): React.CSSProperties {
  if (!hex) return {};
  const triplet = hexToHslTriplet(hex);
  return { ["--primary" as string]: triplet, ["--ring" as string]: triplet } as React.CSSProperties;
}
