// The palette, derived from the client's brand colour by colour theory.
//
// It used to be chosen by the art-direction model, which meant two things: a
// two-minute call before anything could be built, and an accent that was
// whatever the model felt like — sometimes harmonious, sometimes a second
// unrelated hue that made the page look like two designs fighting.
//
// Every colour here is a rotation of the client's own brand hue, so the page
// is guaranteed to read as one coherent scheme, and the tints used for section
// backgrounds are the brand hue at low saturation rather than neutral grey —
// which is what makes the reference sites feel warm rather than default.

export interface Palette {
  primary: string;
  accent: string;
  ink: string;
  surface: string;
  surfaceAlt: string;
  /** Harmony used, for the build rationale. */
  scheme: string;
}

function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  if (delta === 0) return [0, 0, lightness * 100];

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;

  return [hue, saturation * 100, lightness * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(100, Math.max(0, s)) / 100;
  const light = Math.min(100, Math.max(0, l)) / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  const [r, g, b] =
    hue < 60 ? [c, x, 0] :
    hue < 120 ? [x, c, 0] :
    hue < 180 ? [0, c, x] :
    hue < 240 ? [0, x, c] :
    hue < 300 ? [x, 0, c] : [c, 0, x];
  const toHex = (value: number) => Math.round((value + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const SCHEMES = [
  { name: "split-complementary", rotate: 165 },
  { name: "complementary", rotate: 180 },
  { name: "triadic", rotate: 128 },
  { name: "warm-analogous", rotate: -38 },
] as const;

/**
 * @param brandHex the client's own colour
 * @param seed the lead's layout DNA seed, so the harmony varies per client
 *             while staying deterministic for a given lead
 */
export function derivePalette(brandHex: string | null, seed: number): Palette {
  const source = brandHex && /^#?[0-9a-f]{3,8}$/i.test(brandHex.trim()) ? brandHex : "#e4761b";
  let [hue, saturation, lightness] = hexToHsl(source);

  // A brand colour too pale or too dark to sit under white text is corrected
  // rather than rejected — the client still recognises their colour, and the
  // buttons are still legible.
  if (saturation < 22) saturation = 52;
  lightness = Math.min(58, Math.max(38, lightness));
  const primary = hslToHex(hue, saturation, lightness);

  const scheme = SCHEMES[seed % SCHEMES.length];
  // The accent carries eyebrow chips and secondary emphasis, so it is pushed
  // slightly darker and more saturated than the primary to stay distinct
  // against it rather than reading as a near-miss.
  const accent = hslToHex(hue + scheme.rotate, Math.min(88, saturation + 12), Math.max(34, lightness - 8));

  return {
    primary,
    accent,
    // Ink is the brand hue at near-black, not neutral #111 — it is what makes
    // dark bands feel like part of the scheme instead of a hole in the page.
    ink: hslToHex(hue, Math.min(26, saturation * 0.32), 11),
    surface: "#ffffff",
    // The tinted band, brand hue at very low saturation. Neutral grey here is
    // exactly what made previous builds read as a default template.
    surfaceAlt: hslToHex(hue, Math.min(30, saturation * 0.34), 96.5),
    scheme: scheme.name,
  };
}

/** "228 118 27" — for rgb(var(--x-rgb) / alpha) in the stylesheet. */
export function rgbTriplet(hex: string): string {
  const clean = hex.replace("#", "");
  return [0, 2, 4].map((offset) => parseInt(clean.slice(offset, offset + 2), 16)).join(" ");
}

/** White or near-black, whichever is readable on the supplied colour. */
export function readableOn(hex: string): string {
  const clean = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((offset) => parseInt(clean.slice(offset, offset + 2), 16) / 255);
  const channel = (value: number) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  return luminance > 0.45 ? "#12141a" : "#ffffff";
}
