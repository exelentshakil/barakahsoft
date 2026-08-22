import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { callOpenAI } from "@/lib/openai-client";
import { parseJsonResponse } from "@/lib/parse-json-response";

// Media ingest: every image a generated site can use passes through here
// first, and comes out as a permanent WebP in Storage with a caption
// describing what it actually shows.
//
// Two confirmed production failures drive this design.
//
// CREDENTIALS. Google Places photo URLs carry the account's API key as a
// query parameter. Hotlinking them published that key in the page source of
// every delivered site. Mirroring at ingest means the key is used exactly
// once, server-side, and the URL that reaches the database is a plain
// public Storage URL.
//
// BLIND IMAGE PLACEMENT. The prior captioner inferred subject matter from
// surrounding page text, and only for images with hashed filenames. Google
// photos have no page context, so every one came back null and the
// generator placed images by position rather than meaning -- producing a
// chandelier as the hero of an electrical contractor, and photos of
// buildings captioned as named staff. Captions here come from looking at
// the pixels.

export type MediaSubject =
  | "work"
  | "team"
  | "property"
  | "vehicle"
  | "product"
  | "interior"
  | "exterior"
  | "logo"
  | "unusable";

export interface IngestedMedia {
  id: string;
  publicUrl: string;
  caption: string | null;
  subject: MediaSubject;
  usable: boolean;
  width: number | null;
  height: number | null;
  source: string;
}

const MAX_WIDTH = 1800;
const MIN_USABLE_EDGE = 400;

function storagePath(leadId: string, source: string, seed: string): string {
  const safe = seed.replace(/[^a-z0-9]+/gi, "-").slice(-40).toLowerCase();
  return `${leadId}/${source}/${Date.now()}-${safe}.webp`;
}

/**
 * Download, normalise and store one image.
 *
 * Returns null rather than throwing for the ordinary failures — a dead
 * hotlink, an SVG, a tracking pixel — because a site build should lose one
 * image, not fail.
 */
export async function mirrorToStorage(
  leadId: string,
  url: string,
  source: "site" | "gbp" | "unsplash" | "pexels" | "upload" | "generated",
  options: { slotHint?: string; buffer?: Buffer; generationPrompt?: string } = {}
): Promise<{ id: string; publicUrl: string; width: number; height: number } | null> {
  const admin = createAdminClient();

  try {
    let raw: Buffer;
    if (options.buffer) {
      raw = options.buffer;
    } else {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; BarakahSoft/1.0)" } });
      if (!res.ok) return null;
      raw = Buffer.from(await res.arrayBuffer());
    }

    const meta = await sharp(raw).metadata();
    // Anything this small is a tracking pixel, an icon, or a spacer.
    if (!meta.width || !meta.height || Math.min(meta.width, meta.height) < MIN_USABLE_EDGE) return null;

    const optimized = await sharp(raw)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const path = storagePath(leadId, source, url || options.slotHint || "image");
    const { error: uploadErr } = await admin.storage
      .from("lead-media")
      .upload(path, optimized, { contentType: "image/webp", upsert: true });
    if (uploadErr) {
      console.error("[media] upload failed", uploadErr.message);
      return null;
    }

    const { data: pub } = admin.storage.from("lead-media").getPublicUrl(path);

    const { data: row, error: insertErr } = await admin
      .from("media_assets")
      .insert({
        lead_id: leadId,
        storage_path: path,
        public_url: pub.publicUrl,
        source,
        slot_hint: options.slotHint ?? null,
        width: meta.width,
        height: meta.height,
        generation_prompt: options.generationPrompt ?? null,
      })
      .select("id")
      .single<{ id: string }>();

    if (insertErr || !row) {
      console.error("[media] media_assets insert failed", insertErr?.message);
      return null;
    }

    return { id: row.id, publicUrl: pub.publicUrl, width: meta.width, height: meta.height };
  } catch (err) {
    console.error(`[media] mirror failed for ${url.slice(0, 80)}`, err);
    return null;
  }
}

interface VisionVerdict {
  caption: string;
  subject: MediaSubject;
  usable: boolean;
}

/**
 * Look at each image and say what it is.
 *
 * Batched into one call: a premium page places 10-20 images and one request
 * per image would dominate generation time. `usable: false` matters as much
 * as the caption — a blurry phone snap, a screenshot, a stock watermark or
 * a logo has no business on a hero, and the generator needs to be told that
 * rather than discovering it visually.
 */
export async function describeImages(
  images: { id: string; url: string }[],
  industry: string
): Promise<Map<string, VisionVerdict>> {
  const verdicts = new Map<string, VisionVerdict>();
  if (images.length === 0) return verdicts;

  const batch = images.slice(0, 20);

  const raw = await callOpenAI(
    `You are selecting photography for a premium ${industry} website. ${batch.length} images follow, numbered from 0 in order.

For each image, report what it ACTUALLY depicts — not what you would like it to be. Then judge honestly whether it belongs on a high-end website for this industry.

Mark usable: false for: logos and wordmarks, screenshots, stock-photo watermarks, blurry or badly lit phone snaps, images that are mostly text, clip art, and anything whose subject has nothing to do with this industry.

Reply with strict JSON only:
{"0": {"caption": "6-12 words describing exactly what is shown", "subject": "work|team|property|vehicle|product|interior|exterior|logo|unusable", "usable": true|false}, "1": {...}}

subject meanings:
  work     — the actual trade being performed, or its finished result
  team     — real identifiable people who work at the business
  property — a building or site the business worked on
  vehicle  — branded vans, trucks, equipment
  product  — parts, materials, equipment close up
  interior — inside a building, no work visible
  exterior — outside a building, no work visible
  logo     — a logo, wordmark or badge
  unusable — anything that should not appear on the site`,
    {
      images: batch.map((img) => ({ url: img.url })),
      json: true,
      maxTokens: 2500,
      temperature: 0.2,
      system: "You are a precise photo editor. You describe only what is visibly present, and you return valid JSON only.",
    }
  );

  const parsed = raw ? parseJsonResponse(raw) : null;
  if (!parsed) {
    // Without vision the safe default is "usable but undescribed" — the
    // generator treats an uncaptioned image as low priority rather than
    // discarding photography the client actually owns.
    for (const img of batch) verdicts.set(img.id, { caption: "", subject: "property", usable: true });
    return verdicts;
  }

  batch.forEach((img, index) => {
    const entry = parsed[String(index)] as Partial<VisionVerdict> | undefined;
    if (!entry) return;
    verdicts.set(img.id, {
      caption: typeof entry.caption === "string" ? entry.caption.trim() : "",
      subject: (entry.subject as MediaSubject) ?? "property",
      usable: entry.usable !== false,
    });
  });

  return verdicts;
}

/** Persist vision verdicts back onto the stored assets. */
export async function saveDescriptions(verdicts: Map<string, VisionVerdict>): Promise<void> {
  const admin = createAdminClient();
  await Promise.all(
    Array.from(verdicts.entries()).map(([id, v]) =>
      admin
        .from("media_assets")
        .update({ caption: v.caption || null, subject: v.subject, usable: v.usable })
        .eq("id", id)
    )
  );
}
