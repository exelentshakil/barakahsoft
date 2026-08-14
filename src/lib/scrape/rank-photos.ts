import type { PhotoCandidate } from "@/lib/scrape/extract-photos";
import { fetchImageDimensions } from "@/lib/scrape/image-dimensions";

// rank_photo_quality atom. Two passes: a cheap URL/context heuristic first
// (kind, filename signals, alt text — no network calls, ranks everything),
// then a real-dimension check on only the top candidates that heuristic
// produced, since fetching headers for every candidate would be wasteful.
// The dimension check exists because the heuristic alone lets decorative
// theme assets through — case 0 surfaced a 2000x65px racing-stripe divider
// graphic that out-scored real track photos on every heuristic signal
// (real <img> tag, had alt text, no junk filename) despite being
// obviously not a photo once you look at its actual shape.
export interface RankedPhoto extends PhotoCandidate {
  qualityScore: number;
}

// Case 0 surfaced "stars-8.png" (a 5-star review-widget badge) out-scoring
// real photos — it's a real <img> with real alt text at a plausible size,
// so nothing else here catches it. Badge/rating graphics are near-universal
// WordPress-plugin assets, cheap to name-match.
const JUNK_FILENAME_PATTERNS = [
  /logo/i,
  /icon/i,
  /sprite/i,
  /favicon/i,
  /pixel/i,
  /spacer/i,
  /blank/i,
  /\.svg$/i,
  /\bstars?[-_]?\d*\b/i,
  /rating/i,
  /badge/i,
  /trustpilot/i,
  /\bseal\b/i,
  /\bwidget\b/i,
];
const KIND_BASE_SCORE: Record<PhotoCandidate["kind"], number> = {
  img: 60,
  og: 55,
  "css-bg": 45,
  lazy: 50,
  "json-ld": 40,
  twitter: 35,
  favicon: 5,
  "apple-touch": 10,
};

const DIMENSION_CHECK_CANDIDATE_COUNT = 20;
const MIN_DIMENSION_PX = 200;
const MIN_AREA_PX = 60_000; // ~300x200 minimum for a real content photo
const MIN_ASPECT_RATIO = 0.4; // rejects e.g. a 2000x65 divider strip (30.8:1)
const MAX_ASPECT_RATIO = 3.0;

function heuristicScore(c: PhotoCandidate): number {
  let score = KIND_BASE_SCORE[c.kind];
  const isJunk = JUNK_FILENAME_PATTERNS.some((p) => p.test(c.url) || (c.alt && p.test(c.alt)));
  if (isJunk) score -= 40;
  if (!isJunk && c.alt && c.alt.trim().length > 3) score += 15;
  return Math.max(0, score);
}

export async function rankPhotoQuality(candidates: PhotoCandidate[]): Promise<RankedPhoto[]> {
  const seen = new Set<string>();
  const deduped = candidates.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });

  const heuristicSorted = deduped
    .map((c) => ({ ...c, qualityScore: heuristicScore(c) }))
    .sort((a, b) => b.qualityScore - a.qualityScore);

  const toVerify = heuristicSorted.slice(0, DIMENSION_CHECK_CANDIDATE_COUNT);
  const rest = heuristicSorted.slice(DIMENSION_CHECK_CANDIDATE_COUNT);

  const verified = await Promise.all(
    toVerify.map(async (c) => {
      const dims = await fetchImageDimensions(c.url);
      if (!dims) return c; // couldn't verify — keep heuristic score, don't punish a network hiccup
      const aspect = dims.width / dims.height;
      const area = dims.width * dims.height;
      const isPlausiblePhoto =
        dims.width >= MIN_DIMENSION_PX &&
        dims.height >= MIN_DIMENSION_PX &&
        area >= MIN_AREA_PX &&
        aspect >= MIN_ASPECT_RATIO &&
        aspect <= MAX_ASPECT_RATIO;
      return { ...c, qualityScore: isPlausiblePhoto ? c.qualityScore : 0 };
    })
  );

  return [...verified, ...rest].sort((a, b) => b.qualityScore - a.qualityScore);
}
