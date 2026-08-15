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
const VEO_MODEL = "veo-3.1-lite-generate-preview";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

function apiKeyOrNull(): string | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) console.error("[veo] GEMINI_API_KEY is not set in this environment");
  return apiKey ?? null;
}

// Generic, industry/location-appropriate mood footage -- same grounding
// category as an Unsplash fallback photo, never a claim about this specific
// business's real work.
export function buildHeroVideoPrompt(industryLabel: string, town: string | null): string {
  const place = town ? ` in ${town}` : "";
  return `Cinematic establishing shot representative of a professional ${industryLabel} business${place}, golden hour lighting, slow smooth camera movement, photorealistic, no text overlay, no on-screen graphics, no readable signage, no people's faces in focus.`;
}

// Kicks off the long-running job, returns the operation name to poll.
export async function startHeroVideoGeneration(prompt: string): Promise<string | null> {
  const apiKey = apiKeyOrNull();
  if (!apiKey) return null;

  try {
    const res = await fetch(`${BASE_URL}/models/${VEO_MODEL}:predictLongRunning`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { aspectRatio: "16:9", resolution: "720p", durationSeconds: "8" },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "<unreadable body>");
      throw new Error(`Veo predictLongRunning ${res.status}: ${body}`);
    }
    const data = await res.json();
    return data.name ?? null;
  } catch (err) {
    console.error("[veo] failed to start hero video generation —", err);
    return null;
  }
}

// One poll of the operation. `done: false` means keep waiting; `done: true`
// with a null videoUri means it finished but failed (e.g. safety filter
// block) -- both fall back to the static hero cleanly, never block the
// pipeline.
export async function checkHeroVideoOperation(operationName: string): Promise<{ done: boolean; videoUri: string | null }> {
  const apiKey = apiKeyOrNull();
  if (!apiKey) return { done: true, videoUri: null };

  try {
    const res = await fetch(`${BASE_URL}/${operationName}`, { headers: { "x-goog-api-key": apiKey } });
    if (!res.ok) return { done: true, videoUri: null };
    const data = await res.json();
    if (!data.done) return { done: false, videoUri: null };
    const videoUri = data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ?? null;
    return { done: true, videoUri };
  } catch (err) {
    console.error("[veo] failed to poll operation —", err);
    return { done: true, videoUri: null };
  }
}

// Downloads the real video bytes from a completed operation's URI (needs
// the same API key -- it's not a public URL) and stores it into this lead's
// Storage folder + a media_assets row, same convention photo-waterfall.ts
// uses for images. Returns the public URL, or null on any failure.
export async function storeHeroVideo(leadId: string, videoUri: string): Promise<string | null> {
  const apiKey = apiKeyOrNull();
  if (!apiKey) return null;

  try {
    const res = await fetch(videoUri, { headers: { "x-goog-api-key": apiKey } });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "video/mp4";
    const buffer = Buffer.from(await res.arrayBuffer());

    const path = `${leadId}/generated-video/hero-${Date.now()}.mp4`;
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage.from("lead-media").upload(path, buffer, { contentType, upsert: false });
    if (uploadError) throw uploadError;

    const { data } = admin.storage.from("lead-media").getPublicUrl(path);

    await admin.from("media_assets").insert({
      lead_id: leadId,
      storage_path: path,
      public_url: data.publicUrl,
      source: "generated-video",
      slot_hint: "hero-video",
    });

    return data.publicUrl;
  } catch (err) {
    console.error("[veo] failed to store hero video —", err);
    return null;
  }
}
