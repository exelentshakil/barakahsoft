import { callGemini } from "@/lib/ai";
import { parseJsonResponse } from "@/lib/parse-json-response";
import type { RankedPhoto } from "@/lib/scrape/rank-photos";

export interface CaptionedPhoto extends RankedPhoto {
  inferredCaption: string | null;
}

// Meaningless/hashed filenames — CMS asset IDs, UUIDs, camera dump names —
// where the URL itself carries no signal about what the photo depicts.
const HASHED_FILENAME_PATTERN =
  /(^|\/)([a-f0-9]{16,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|img[-_]?\d{3,}|dsc\d{3,}|\d{10,})\.(jpe?g|png|webp|gif)/i;

const MAX_TO_CAPTION = 25;

// caption_unlabeled_photos — only infers a caption when there's genuinely
// nothing else to go on (no real alt text) AND the filename is meaningless
// AND real page context exists (Phase C1's nearestHeading/sectionText).
// One batched Gemini call per lead, never one call per image, and the
// prompt explicitly allows/expects `null` rather than a guessed caption —
// same grounding discipline as every generate_* atom.
export async function captionUnlabeledPhotos(photos: RankedPhoto[]): Promise<CaptionedPhoto[]> {
  const topCandidates = photos.slice(0, MAX_TO_CAPTION);
  const eligible = topCandidates
    .map((photo, index) => ({ photo, index }))
    .filter(({ photo }) => {
      const hasRealAlt = !!photo.alt && photo.alt.trim().length > 3;
      const hasContext = !!(photo.nearestHeading || photo.sectionText);
      const looksHashed = HASHED_FILENAME_PATTERN.test(photo.url);
      return !hasRealAlt && looksHashed && hasContext;
    });

  if (eligible.length === 0) {
    return photos.map((p) => ({ ...p, inferredCaption: null }));
  }

  const prompt = `For each numbered real photo below, you're given the real heading/text of the webpage section it actually appears in — nothing else, no image data. Infer a short (3-8 word) caption for what the photo most likely depicts, based ONLY on that real context.

If the context doesn't clearly indicate a specific real subject, reply null for that number — never guess.

${eligible
    .map(({ photo, index }) => `${index}: heading="${photo.nearestHeading ?? ""}" section_text="${(photo.sectionText ?? "").slice(0, 200)}"`)
    .join("\n")}

Reply with strict JSON only, no markdown fences, no commentary: {"<index>": "caption" or null, ...}`;

  const raw = await callGemini(prompt);
  const parsed = raw ? parseJsonResponse(raw) : null;

  const captionByIndex = new Map<number, string>();
  if (parsed) {
    for (const { index } of eligible) {
      const value = parsed[String(index)];
      if (typeof value === "string" && value.trim()) captionByIndex.set(index, value.trim());
    }
  }

  return photos.map((photo, i) => ({ ...photo, inferredCaption: captionByIndex.get(i) ?? null }));
}
