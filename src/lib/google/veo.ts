import { createAdminClient } from "@/lib/supabase/admin";

// Veo 3.1 Lite — reachable through the same GEMINI_API_KEY/host this
// codebase already calls in gemini-client.ts, but it's a long-running job
// (predictLongRunning -> poll an operation -> download), not a single
// request/response call, so it gets its own module. Field names below are
// verified against the real Gemini API docs (ai.google.dev/gemini-api/docs/veo),
// not guessed: audio has no disable switch on this API (Veo 3.1 always
// generates it) -- the "no audio" requirement is instead satisfied by
// rendering the resulting <video> muted, which is also what real browsers
// require for autoplay anyway.
const VEO_MODEL = process.env.VEO_MODEL?.trim() || "veo-3.1-lite-generate-preview";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

function apiKeyOrNull(): string | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) console.error("[veo] GEMINI_API_KEY is not set in this environment");
  return apiKey ?? null;
}

// v4 Phase O1 — every failure path here used to collapse to a bare `null`,
// caught only by a console.error nobody reviewing a lead's QA notes would
// ever see. This makes "hero video didn't happen" distinguishable from "AI
// didn't pick the video variant" without guessing.
export type VeoFailureReason = "no_api_key" | "no_billing" | "quota" | "timeout" | "network" | "unknown";

export function classifyVeoError(status: number | null, body: string): VeoFailureReason {
  if (status === 401 || status === 403) return "no_billing";
  if (status === 429) return "quota";
  if (/quota|resource_exhausted/i.test(body)) return "quota";
  if (/permission|billing|not enabled/i.test(body)) return "no_billing";
  if (status === null) return "network";
  return "unknown";
}

// Generic, industry/location-appropriate mood footage -- same grounding
// category as an Unsplash fallback photo, never a claim about this specific
// business's real work. `cinematographyHint` (from the playbook's
// `hero_video_cinematography`) adds real industry-specific shot direction
// when available -- falls back to the original generic sentence when a
// playbook doesn't have one, no breaking change.
export function buildHeroVideoPrompt(industryLabel: string, town: string | null, cinematographyHint?: string): string {
  const place = town ? ` in ${town}` : "";
  const shot = cinematographyHint ? `, ${cinematographyHint}` : "";
  return `Cinematic establishing shot representative of a professional ${industryLabel} business${place}${shot}, golden hour lighting, slow smooth camera movement, photorealistic, no text overlay, no on-screen graphics, no readable signage, no people's faces in focus.`;
}

// Kicks off the long-running job, returns the operation name to poll.
export async function startHeroVideoGeneration(prompt: string): Promise<{ operationName: string | null; reason: VeoFailureReason | null }> {
  return startVideoGeneration(prompt, "16:9");
}

export async function startVideoGeneration(
  prompt: string,
  aspectRatio: "16:9" | "9:16" = "9:16"
): Promise<{ operationName: string | null; reason: VeoFailureReason | null }> {
  const apiKey = apiKeyOrNull();
  if (!apiKey) return { operationName: null, reason: "no_api_key" };

  try {
    const res = await fetch(`${BASE_URL}/models/${VEO_MODEL}:predictLongRunning`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { aspectRatio, resolution: "720p", durationSeconds: 8 },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const reason = classifyVeoError(res.status, body);
      console.error(`[veo] predictLongRunning ${res.status} (${reason}):`, body);
      return { operationName: null, reason };
    }
    const data = await res.json();
    return { operationName: data.name ?? null, reason: data.name ? null : "unknown" };
  } catch (err) {
    console.error("[veo] failed to start hero video generation —", err);
    return { operationName: null, reason: "network" };
  }
}

// One poll of the operation. `done: false` means keep waiting; `done: true`
// with a null videoUri means it finished but failed (e.g. safety filter
// block) -- both fall back to the static hero cleanly, never block the
// pipeline, but now with a reason attached for QA visibility.
export async function checkHeroVideoOperation(operationName: string): Promise<{ done: boolean; videoUri: string | null; reason: VeoFailureReason | null }> {
  const apiKey = apiKeyOrNull();
  if (!apiKey) return { done: true, videoUri: null, reason: "no_api_key" };

  try {
    const res = await fetch(`${BASE_URL}/${operationName}`, { headers: { "x-goog-api-key": apiKey } });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { done: true, videoUri: null, reason: classifyVeoError(res.status, body) };
    }
    const data = await res.json();
    if (!data.done) return { done: false, videoUri: null, reason: null };
    const videoUri = data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ?? null;
    if (!videoUri && data.error) {
      console.error("[veo] operation finished with error —", data.error);
      return { done: true, videoUri: null, reason: classifyVeoError(null, JSON.stringify(data.error)) };
    }
    return { done: true, videoUri, reason: videoUri ? null : "unknown" };
  } catch (err) {
    console.error("[veo] failed to poll operation —", err);
    return { done: true, videoUri: null, reason: "network" };
  }
}

// Downloads the real video bytes from a completed operation's URI (needs
// the same API key -- it's not a public URL) and stores it into this lead's
// Storage folder + a media_assets row, same convention photo-waterfall.ts
// uses for images. Returns the public URL, or a reason on any failure.
export async function storeHeroVideo(leadId: string, videoUri: string): Promise<{ publicUrl: string | null; reason: VeoFailureReason | null }> {
  return storeGeneratedVideo(leadId, videoUri, "hero-video", "generated-video");
}

export async function storeGeneratedVideo(
  leadId: string,
  videoUri: string,
  slotHint: string,
  folder: string
): Promise<{ publicUrl: string | null; reason: VeoFailureReason | null }> {
  const apiKey = apiKeyOrNull();
  if (!apiKey) return { publicUrl: null, reason: "no_api_key" };

  try {
    const res = await fetch(videoUri, { headers: { "x-goog-api-key": apiKey } });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { publicUrl: null, reason: classifyVeoError(res.status, body) };
    }
    const contentType = res.headers.get("content-type") || "video/mp4";
    const buffer = Buffer.from(await res.arrayBuffer());

    const path = `${leadId}/${folder}/${slotHint}-${Date.now()}.mp4`;
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("lead-media")
      .upload(path, buffer, { contentType, cacheControl: "31536000", upsert: false });
    if (uploadError) throw uploadError;

    const { data } = admin.storage.from("lead-media").getPublicUrl(path);

    const { error: mediaError } = await admin.from("media_assets").insert({
      lead_id: leadId,
      storage_path: path,
      public_url: data.publicUrl,
      source: "generated",
      slot_hint: slotHint,
      storage_mode: "copied",
    });
    if (mediaError) throw mediaError;

    return { publicUrl: data.publicUrl, reason: null };
  } catch (err) {
    console.error("[veo] failed to store hero video —", err);
    return { publicUrl: null, reason: "network" };
  }
}
