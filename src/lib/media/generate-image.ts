import { mirrorToStorage } from "@/lib/media/ingest";

// Generated photography for slots a real photo cannot fill.
//
// Most leads arrive with almost no usable imagery — the York lead had one
// real image on its entire site, and that image was its own logo. A premium
// page cannot be built from that, and stock photography is the single most
// recognisable tell of a template site. Generated imagery is specific to
// the trade, the service and the setting, and is correct by construction:
// we know what it depicts because we asked for it.
//
// Everything generated is stored in the same bucket as real photography and
// is subject to the same rule — a page may only reference Storage URLs.

const IMAGE_MODEL_CHAIN = ["gpt-image-2", "gpt-image-1.5", "gpt-image-1"];

let resolvedImageModel: string | null = null;

function imageModelCandidates(): string[] {
  const pinned = process.env.OPENAI_IMAGE_MODEL?.trim();
  if (pinned) return [pinned];
  if (resolvedImageModel) return [resolvedImageModel, ...IMAGE_MODEL_CHAIN.filter((m) => m !== resolvedImageModel)];
  return IMAGE_MODEL_CHAIN;
}

export type ImageShape = "landscape" | "portrait" | "square";

const SIZE: Record<ImageShape, string> = {
  landscape: "1536x1024",
  portrait: "1024x1536",
  square: "1024x1024",
};

/**
 * The house photographic style.
 *
 * Held constant across every image on a site so a page of generated
 * photography reads as one shoot rather than a mood board. Explicitly
 * excludes the tells that make AI imagery obvious and cheap-looking:
 * text, logos, watermarks, plastic skin, impossible hands, staged smiles.
 */
function styleDirective(mood: string): string {
  const lighting =
    mood === "dark-premium"
      ? "dramatic low-key lighting, deep shadows, strong single key light"
      : mood === "light-editorial"
        ? "bright natural daylight, soft shadows, airy and clean"
        : mood === "warm-craft"
          ? "warm golden-hour light, rich natural tones"
          : mood === "clinical-trust"
            ? "even neutral lighting, clean and uncluttered"
            : "crisp directional daylight, high clarity, strong contrast";

  return `Editorial commercial photography, shot on a full-frame camera with a fast prime lens, shallow depth of field, ${lighting}. Photorealistic, candid and unposed, documentary feel. Absolutely no text, no lettering, no signage, no logos, no watermarks, no borders, no collage. No direct-to-camera smiling stock poses. Real working conditions, authentic wear and detail.`;
}

async function requestImage(prompt: string, shape: ImageShape): Promise<Buffer | null> {
  // 1. Try Google Imagen 3 (GEMINI_API_KEY) for ultra-photorealistic commercial rendering
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const aspectRatio = shape === "portrait" ? "3:4" : shape === "square" ? "1:1" : "16:9";
      const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict`;
      const res = await fetch(imagenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio,
            outputMimeType: "image/jpeg",
            personGeneration: "allow_adult",
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const b64 = data.predictions?.[0]?.bytesBase64Encoded;
        if (b64) return Buffer.from(b64, "base64");
      }
    } catch (err) {
      console.warn("[image] Imagen 3 attempt failed, falling back to OpenAI", err);
    }
  }

  // 2. OpenAI DALL-E / Image Generation
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  for (const model of imageModelCandidates()) {
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, prompt, size: SIZE[shape], n: 1 }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        if (res.status === 404 || /model_not_found|does not exist/i.test(body)) continue;
        console.error(`[image] ${model} returned ${res.status}: ${body.slice(0, 300)}`);
        return null;
      }

      const data = await res.json();
      const b64 = data.data?.[0]?.b64_json;
      if (b64) {
        if (!process.env.OPENAI_IMAGE_MODEL) resolvedImageModel = model;
        return Buffer.from(b64, "base64");
      }

      const url = data.data?.[0]?.url;
      if (url) {
        const img = await fetch(url);
        if (img.ok) {
          if (!process.env.OPENAI_IMAGE_MODEL) resolvedImageModel = model;
          return Buffer.from(await img.arrayBuffer());
        }
      }
      return null;
    } catch (err) {
      console.error(`[image] ${model} failed`, err);
    }
  }

  console.error("[image] no image model available on configured keys");
  return null;
}

export interface GeneratedImage {
  id: string;
  publicUrl: string;
  caption: string;
}

/**
 * Generate one image for a slot and store it.
 *
 * `subject` is written as a plain description of the scene — the caller
 * knows the trade, the service and the city, and that specificity is what
 * separates a real-looking job photo from generic industrial stock.
 */
export async function generateSiteImage(
  leadId: string,
  params: { subject: string; shape: ImageShape; mood: string; slotHint: string }
): Promise<GeneratedImage | null> {
  const prompt = `${params.subject}. ${styleDirective(params.mood)}`;

  const buffer = await requestImage(prompt, params.shape);
  if (!buffer) return null;

  const stored = await mirrorToStorage(leadId, `generated:${params.slotHint}`, "generated", {
    slotHint: params.slotHint,
    buffer,
    generationPrompt: prompt,
  });
  if (!stored) return null;

  return { id: stored.id, publicUrl: stored.publicUrl, caption: params.subject };
}
