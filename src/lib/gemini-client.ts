import { recordUsage, usageContext } from "@/lib/cost/record-usage";
export type GeminiImagePart = { mimeType: string; data: string };

export interface GeminiCallOptions {
  system?: string;
  temperature?: number;
  maxTokens?: number;
  /** Tried in order; the first the key accepts is used. */
  modelChain?: string[];
  /**
   * Overrides the default request timeout. A Pro call asked for a thousand
   * lines of CSS legitimately runs past two and a half minutes, and killing
   * it there threw away the whole build.
   */
  timeoutMs?: number;
}

// The strongest models for a call where output quality IS the product.
//
// Verified against the live /v1beta/models listing rather than guessed. The
// previous value here was "gemini-3.6-pro", inferred from the existing
// "gemini-3.6-flash" — and no such model exists. Every homepage build sent
// to Gemini 404'd and surfaced as "Structure generation returned nothing",
// which named neither the provider nor the reason.
//
// A chain rather than one id, for the same reason openai-client keeps one:
// the day a model is retired, generation degrades to the next instead of
// taking the feature down.
// Refreshed after every entry below the second was found dead against the
// live key. gemini-2.5-pro now 404s with "no longer available to new users.
// Please update your code to use models/gemini-3.1-pro-preview", and the
// 2.0 and 1.5 ids are gone from the models listing entirely. That left one
// reachable entry — gemini-2.5-flash — so every homepage Gemini built was
// silently produced by a Flash model after the Pro head of the chain 404'd,
// on the one call where output quality is the product.
//
// Each id here was verified with a real generateContent call against the
// project key, not taken from documentation.
const BEST_CHAIN = [
  // Google's named replacement for 2.5-pro.
  "gemini-3.1-pro-preview",
  // Stable alias tracking the current Pro, so a withdrawn preview does not
  // drop the chain straight to Flash again.
  "gemini-pro-latest",
  "gemini-flash-latest",
  "gemini-2.5-flash",
];

export function bestGeminiChain(): string[] {
  const pinned = process.env.GEMINI_MODEL_BEST?.trim();
  return pinned ? [pinned, ...BEST_CHAIN] : BEST_CHAIN;
}

// Every current model tops out here. Asking for more is a 400, so the
// request is clamped rather than rejected.
const MAX_OUTPUT_TOKENS = 65536;
const REQUEST_TIMEOUT_MS = 150_000;
const MAX_TIMEOUT_MS = 900_000;

function isModelUnavailable(status: number, body: string): boolean {
  if (status === 404) return true;
  const lower = body.toLowerCase();
  return status === 400 && (lower.includes("not found") || lower.includes("not supported"));
}

// Bare Gemini REST wrapper — its own module so both ai.ts and
// generate-with-critique.ts (which ai.ts now also imports, for the
// draft/critique/revise loop) can depend on it without a circular import.
// v6 -- optional `images` param for vision-grounded calls (design-reference
// screenshots). Real Gemini REST inline-image parts are snake_case
// (inline_data/mime_type), confirmed against the live API docs -- do not
// "fix" this to camelCase, the REST API (unlike some client SDKs) requires it.
// v7 -- optional `options` (system/temperature/maxTokens) for the bespoke
// generation path, which needed parity with callOpenAI's contract to be a
// real swap-in rather than a second, weaker code path.
export async function callGemini(
  prompt: string,
  model = "gemini-3.6-flash",
  images?: GeminiImagePart[],
  options?: GeminiCallOptions
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[gemini] GEMINI_API_KEY is not set in this environment");
    return null;
  }

  const parts: Record<string, unknown>[] = [{ text: prompt }];
  if (images?.length) {
    for (const img of images) parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
  }

  const requestBody: Record<string, unknown> = { contents: [{ parts }] };
  if (options?.system) requestBody.systemInstruction = { parts: [{ text: options.system }] };
  const generationConfig: Record<string, unknown> = {};
  if (options?.temperature !== undefined) generationConfig.temperature = options.temperature;
  if (options?.maxTokens !== undefined) {
    generationConfig.maxOutputTokens = Math.min(options.maxTokens, MAX_OUTPUT_TOKENS);
  }
  if (Object.keys(generationConfig).length > 0) requestBody.generationConfig = generationConfig;

  const timeoutMs = Math.min(options?.timeoutMs ?? REQUEST_TIMEOUT_MS, MAX_TIMEOUT_MS);
  const candidates = options?.modelChain?.length ? options.modelChain : [model];

  for (const candidate of candidates) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(timeoutMs),
        }
      );

      if (!res.ok) {
        const body = await res.text().catch(() => "<unreadable body>");
        if (isModelUnavailable(res.status, body)) {
          console.warn(`[gemini] model "${candidate}" unavailable on this key, trying next`);
          continue;
        }
        console.error(`[gemini] API ${res.status} on "${candidate}": ${body.slice(0, 400)}`);
        return null;
      }

      const data = await res.json();
      const candidateResult = data.candidates?.[0];
      const text = candidateResult?.content?.parts?.[0]?.text;

      // A model that stops on its own limit or a safety rule returns a
      // perfectly successful response with no text in it, which read as
      // "returned nothing" and pointed at the API key. Say which it was.
      if (typeof text !== "string" || !text.trim()) {
        console.error(
          `[gemini] empty content from ${candidate} — finishReason=${candidateResult?.finishReason ?? "none"}` +
            ` limit=${generationConfig.maxOutputTokens ?? "default"}`
        );
        return null;
      }

      console.log(`[gemini] ${candidate} ok — ${text.length} chars`);

      // Gemini reports usage on the response envelope rather than per
      // candidate. Thinking tokens are billed as output, so they are counted
      // with the completion rather than dropped.
      const um = data.usageMetadata ?? {};
      const ctx = usageContext();
      void recordUsage({
        leadId: ctx.leadId,
        purpose: ctx.purpose,
        provider: "gemini",
        model: candidate,
        promptTokens: um.promptTokenCount ?? 0,
        completionTokens: (um.candidatesTokenCount ?? 0) + (um.thoughtsTokenCount ?? 0),
      });

      return text.trim();
    } catch (err) {
      const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
      console.error(timedOut ? `[gemini] "${candidate}" timed out after ${timeoutMs / 1000}s` : `[gemini] network error on "${candidate}" —`, timedOut ? "" : err);
      return null;
    }
  }

  console.error(`[gemini] every candidate model failed: ${candidates.join(", ")}`);
  return null;
}
