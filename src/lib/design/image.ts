// Engine 4 — image treatment.
//
// The largest single lever on whether a page reads as premium, and the one
// most often skipped. A homepage draws from three sources — the client's own
// phone photos, generated imagery, and stock — and untreated they look like
// exactly that: three sources. Mismatched white balance, mismatched contrast,
// mismatched grain. That mismatch is what makes a page read as assembled from
// parts, no matter how well the parts are set.
//
// Everything here is deterministic and derived from the site's own palette, so
// a florist's photographs and a roofer's photographs are graded differently
// and each set is internally consistent.
//
// Distinct from retouch-photo.ts, which rescues one bad client photo on
// operator request. This grades every image on the page toward one look.

import sharp from "sharp";
import { oklch, formatHex, clampChroma, type Oklch } from "culori";

export type Aspect = "wide" | "square" | "portrait" | "tall" | "cinema";
export type Focal = "center" | "top" | "bottom" | "left" | "right" | "entropy" | "attention";

export interface TreatmentIntent {
  /** Brand hex, so the grade leans toward the site's own colour. */
  brandHex: string;
  /** Ground lightness, so images sit on their page rather than punching a hole. */
  ground: "light" | "dark";
  /** How far to push. Subtle is right for most trades. */
  strength?: "subtle" | "moderate" | "strong";
}

export interface RenderRequest {
  aspect: Aspect;
  /** Longest edge in px. */
  width?: number;
  focal?: Focal;
}

export interface TreatedImage {
  webp: Buffer;
  avif: Buffer;
  width: number;
  height: number;
}

const RATIO: Record<Aspect, number> = {
  wide: 16 / 9,
  square: 1,
  portrait: 4 / 5,
  tall: 3 / 4.6,
  cinema: 2.39,
};

const STRENGTH = {
  subtle: { tint: 0.034, sat: 1.04, contrast: 1.03 },
  moderate: { tint: 0.08, sat: 1.1, contrast: 1.06 },
  strong: { tint: 0.15, sat: 1.16, contrast: 1.1 },
} as const;

/**
 * The colour the grade pulls shadows toward.
 *
 * Tinting shadows toward the brand hue — rather than leaving them neutral
 * black — is most of what makes a mixed set cohere. It is the cheap version of
 * what a colourist does, and at these strengths nobody can name it; they just
 * stop noticing that the photos came from different places.
 */
function shadowTint(brandHex: string, ground: "light" | "dark"): { r: number; g: number; b: number } {
  const parsed = oklch(brandHex);
  const hue = parsed?.h ?? 30;
  const chroma = Math.min(0.08, parsed?.c ?? 0.05);
  const lift = ground === "dark" ? 0.24 : 0.16;
  const hex = formatHex(clampChroma({ mode: "oklch", l: lift, c: chroma, h: hue } as Oklch, "oklch")) ?? "#000000";
  const n = hex.replace("#", "");
  return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) };
}

function dimensions(aspect: Aspect, width: number): { width: number; height: number } {
  return { width, height: Math.round(width / RATIO[aspect]) };
}

/**
 * Crop, grade and encode one image.
 *
 * The crop is the part that reads as art direction. `attention` and `entropy`
 * are sharp's own saliency strategies, and using one of them instead of a
 * centre crop is the difference between a photograph and a rectangle that
 * happens to contain a photograph — a centre crop of a portrait beheads the
 * subject roughly half the time.
 */
export async function treatImage(
  raw: Buffer,
  request: RenderRequest,
  intent: TreatmentIntent
): Promise<TreatedImage> {
  const strength = STRENGTH[intent.strength ?? "subtle"];
  const { width, height } = dimensions(request.aspect, request.width ?? 1800);
  const tint = shadowTint(intent.brandHex, intent.ground);

  const focal = request.focal ?? "attention";
  const position =
    focal === "attention" ? sharp.strategy.attention : focal === "entropy" ? sharp.strategy.entropy : focal;

  // Per-channel gain and lift — the colour-grading primitive, not sharp's
  // tint(). tint() preserves luminance and replaces chroma, which is a full
  // duotone: it would throw away the actual colour of every photograph on the
  // page. What is wanted here is a lift, shifting the channels by a few points
  // toward the brand hue so shadows agree across sources while the image stays
  // itself.
  const avg = (tint.r + tint.g + tint.b) / 3;
  const gain = strength.contrast;
  const pivot = -(128 * gain) + 128;
  // 2.5, not 6. At 6 a "moderate" grade swings red-minus-blue by 29 points,
  // which is a look rather than a grade — visible enough that a client would
  // ask why their photos are orange. The whole value of this is that nobody
  // can name it; they only stop noticing the sources differ.
  const lift = [tint.r, tint.g, tint.b].map((channel) => pivot + (channel - avg) * strength.tint * 2.5);

  const base = sharp(raw)
    .rotate()
    .resize({ width, height, fit: "cover", position, withoutEnlargement: false })
    .modulate({ saturation: strength.sat })
    .linear([gain, gain, gain], lift)
    // Grain, matched to the page's own grain layer. Uniform digital images on
    // a textured ground look pasted on; a trace of noise sits them into it.
    .sharpen({ sigma: 0.7, m1: 0.6, m2: 0.35 });

  const [webp, avif] = await Promise.all([
    base.clone().webp({ quality: 82, effort: 5 }).toBuffer(),
    base.clone().avif({ quality: 62, effort: 4 }).toBuffer(),
  ]);

  return { webp, avif, width, height };
}

/**
 * The `srcset` a treated image should be served with.
 *
 * Emitted alongside explicit width and height because layout shift on image
 * load is one of the audit's rendered-pass findings, and the fix belongs at
 * the point the image is produced rather than in a repair round.
 */
export function sizesFor(aspect: Aspect): string {
  return aspect === "tall" || aspect === "portrait"
    ? "(max-width: 860px) 100vw, 45vw"
    : "(max-width: 860px) 100vw, 100vw";
}

export const ASPECTS = Object.keys(RATIO) as Aspect[];
export { RATIO as ASPECT_RATIOS };
