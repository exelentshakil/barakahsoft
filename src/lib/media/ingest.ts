import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchPexels } from "@/lib/pexels";
import { searchUnsplash } from "@/lib/unsplash";
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
  /** Stock, stored only to fill a band or a texture. Never proof. */
  | "atmosphere"
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
const MIN_USABLE_EDGE = 200;

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
      maxTokens: 12000,
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

// ---------------------------------------------------------------- scrape-time ingest
//
// This used to run inside the build, which meant a lead's photographs did not
// exist until someone had already generated a page from them. The operator
// could not delete a bad photo or add a missing one BEFORE the model saw the
// set — only after, by which point the page had already been designed around
// it.
//
// Running it at scrape time inverts that: by the time the Studio opens, every
// image is mirrored, captioned and flagged, and curation happens before a
// single token is spent.

interface StoredAsset {
  id: string;
  public_url: string;
  storage_path: string;
  caption: string | null;
  subject: MediaSubject | null;
  usable: boolean;
  width: number | null;
  height: number | null;
  source: string;
}

const ASSET_COLUMNS = "id, public_url, storage_path, caption, subject, usable, width, height, source";

/**
 * Bring every real image this lead has into Storage and describe it.
 *
 * Idempotent: assets already mirrored are not fetched again, so re-analysing a
 * lead costs nothing here. This is also the step that eliminates
 * credential-bearing Google Places URLs from the system entirely.
 */
export async function ingestRealPhotos(
  leadId: string,
  urls: string[],
  industry: string
): Promise<StoredAsset[]> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("media_assets")
    .select(ASSET_COLUMNS)
    .eq("lead_id", leadId)
    .returns<StoredAsset[]>();

  const already = existing ?? [];

  // Mirror what is MISSING, not all-or-nothing.
  //
  // This used to skip the whole step whenever the lead had any asset at all,
  // on the reasoning that re-running should not duplicate the photo library.
  // The effect was worse than a duplicate: a lead that picked up six images on
  // an early run never received the other eighteen, so a business with
  // twenty-four photographs on its site had five to build a page from, and the
  // generator was blamed for a thin page it had no material for. Measured on a
  // real lead: 24 scraped, 6 stored, 5 usable.
  //
  // storagePath embeds the last forty characters of the source URL, so what is
  // already held can be recognised without a schema change.
  const heldSeeds = new Set(
    already.map((a) => a.storage_path.replace(/^.*\/\d+-/, "").replace(/\.webp$/i, ""))
  );
  const seedOf = (url: string) => url.replace(/[^a-z0-9]+/gi, "-").slice(-40).toLowerCase();
  const missing = urls.filter((url) => !heldSeeds.has(seedOf(url))).slice(0, 24);

  if (missing.length > 0) {
    const results = await Promise.all(
      missing.map((url) => {
        const source =
          url.includes("googleapis.com") || url.includes("googleusercontent.com") ? "gbp" : "site";
        return mirrorToStorage(leadId, url, source);
      })
    );
    const stored = results.filter((r): r is NonNullable<typeof r> => r !== null);
    console.log(`[media] ${leadId}: ${missing.length} new urls, ${stored.length} stored`);
  }

  const { data: current } = await admin
    .from("media_assets")
    .select(ASSET_COLUMNS)
    .eq("lead_id", leadId)
    .returns<StoredAsset[]>();

  // Anything newly mirrored, or uploaded through the Studio since the last run,
  // has no vision verdict yet.
  const undescribed = (current ?? []).filter((a) => a.subject === null);
  if (undescribed.length > 0) {
    const verdicts = await describeImages(
      undescribed.map((a) => ({ id: a.id, url: a.public_url })),
      industry
    );
    await saveDescriptions(verdicts);

    const { data: refreshed } = await admin
      .from("media_assets")
      .select(ASSET_COLUMNS)
      .eq("lead_id", leadId)
      .returns<StoredAsset[]>();
    return refreshed ?? [];
  }

  return current ?? [];
}

/**
 * Top up a thin photo library with stock, for atmosphere only.
 *
 * A business with three photographs and a twelve-section page leaves dead
 * space, which is the complaint that prompted this. But stock standing in for
 * "our team" or "our work" is how the whole pitch loses credibility — the owner
 * knows that is not his van.
 *
 * So stock is stored with source 'pexels', which is what the slot panel reads
 * to mark it, and the generator is told in the prompt that these may only be
 * used behind a stat band or as section texture. Never as proof.
 */
/**
 * One stock photograph, from whichever library answers.
 *
 * Both helpers return null for every failure — no key, a rate limit, no
 * results — so the waterfall cannot tell those apart and does not try to. It
 * asks Pexels, then Unsplash, then gives up on that query and moves to the next
 * one. That also means either key working on its own is enough: an operator who
 * has set only one is not a degraded case.
 */
async function stockPhoto(
  query: string
): Promise<{ photo: { sourceUrl: string; alt: string; attributionName: string; attributionUrl: string }; source: "pexels" | "unsplash" } | null> {
  const pexels = await searchPexels(query);
  if (pexels) return { photo: pexels, source: "pexels" };

  const unsplash = await searchUnsplash(query);
  if (unsplash) return { photo: unsplash, source: "unsplash" };

  return null;
}

/**
 * Top up a thin photo library with stock, for atmosphere only.
 *
 * A business with three photographs and a twelve-section page leaves dead
 * space, which is the complaint that prompted this. But stock standing in for
 * "our team" or "our work" is how the whole pitch loses credibility — the owner
 * knows that is not his van.
 *
 * So stock is stored with its real source, which is what the slot panel reads
 * to mark it, and the generator is told in the prompt that these may only sit
 * behind a stat band or carry section texture. Never as proof.
 *
 * Attribution is written onto every row because both libraries' API terms ask
 * for it, and because a credit line is the honest thing on a page that is
 * otherwise claiming to be about one business.
 */
export async function topUpWithStock(
  leadId: string,
  industry: string,
  city: string,
  have: number,
  want = 8
): Promise<number> {
  if (have >= want) return 0;

  const trade = (industry || "local business").toLowerCase();
  const queries = [
    `${trade} tools flat lay`,
    `${trade} at work close up`,
    `${city || "city"} street architecture`,
    "clean workshop interior",
    "hands working detail",
    "modern office texture",
    "blueprint desk overhead",
    "warm interior natural light",
  ].slice(0, Math.min(want - have, 8));

  const admin = createAdminClient();
  const seen = new Set<string>();
  let added = 0;

  for (const query of queries) {
    const found = await stockPhoto(query);
    // The same photograph coming back for two related queries would put one
    // image on the page twice, which reads worse than one fewer section.
    if (!found || seen.has(found.photo.sourceUrl)) continue;
    seen.add(found.photo.sourceUrl);

    const stored = await mirrorToStorage(leadId, found.photo.sourceUrl, found.source, {
      slotHint: "atmosphere",
    });
    if (!stored) continue;

    await admin
      .from("media_assets")
      .update({
        caption: `stock photograph — ${found.photo.alt || query}`,
        subject: "atmosphere",
        usable: true,
        attribution_name: found.photo.attributionName ?? null,
        attribution_url: found.photo.attributionUrl ?? null,
      })
      .eq("id", stored.id);
    added += 1;
  }

  if (added) console.log(`[media] ${leadId}: topped up with ${added} stock images`);
  return added;
}
