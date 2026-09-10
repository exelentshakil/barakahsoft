// Bare OpenAI REST wrapper — the design brain for bespoke generation.
//
// Gemini (gemini-client.ts) stays in place for the cheap, high-volume
// extraction passes it already does well. This module is specifically for
// the work where output quality IS the product: the homepage markup, the
// design-DNA distillation, and the critique/revise passes on both.
//
// Two real production concerns are handled here rather than at every call
// site:
//
// 1. MODEL DRIFT. Hardcoding a single model id means the day that id is
//    retired, every generation in production starts returning null with a
//    404. MODEL_CHAIN is tried newest-first and the first id the live key
//    actually accepts is cached for the lifetime of the lambda, so a
//    retired model degrades to the next-best one instead of taking the
//    feature down. Set OPENAI_MODEL to pin one explicitly and skip the
//    probing entirely.
//
// 2. PARAMETER DRIFT. Newer OpenAI models reject `temperature` and renamed
//    `max_tokens` to `max_completion_tokens`. Rather than branching on
//    model id (which breaks again on the next release), we read the 400
//    back from the API and retry once with the offending parameter
//    dropped/renamed. Self-correcting instead of a maintenance burden.

// Either a public URL (cheaper — the API fetches it, we don't download and
// re-encode it) or inline base64 for images that aren't publicly reachable.
import { recordUsage, usageContext } from "@/lib/cost/record-usage";
export type OpenAIImagePart = { mimeType: string; data: string } | { url: string } | string;

// Ordered newest-first by actual release date, not by name: model families
// do not sort sensibly by version string, so this ordering is checked
// against /v1/models (see the admin diagnostic) rather than assumed.
const MODEL_CHAIN = ["gpt-4.1-mini", "gpt-4o", "gpt-4o-2024-11-20", "chatgpt-4o-latest", "gpt-4o-mini", "gpt-4-turbo"];

// The strongest models on the account, for the one call where output quality
// IS the product. Everything else — classification, captioning, judging —
// runs on the standard chain, where a pro model buys nothing and costs real
// time. Overridable with OPENAI_MODEL_BEST.
//
// Led by o3-mini and o1 until now, which was wrong twice over for what this
// chain is actually used for. Both are reasoning models: they reject the
// temperature parameter, they are slow, and a design brief is long-form
// generation rather than a reasoning problem — a live PRD call sat on o3-mini
// for 150 seconds and timed out. These ids were verified against /v1/models on
// the account rather than assumed, which is the same reason the note above
// exists.
const BEST_CHAIN = ["gpt-5.1", "gpt-5", "gpt-4.1", "gpt-4o", "gpt-4o-2024-11-20", "chatgpt-4o-latest"];

export function bestModelChain(): string[] {
  const pinned = process.env.OPENAI_MODEL_BEST?.trim();
  return pinned ? [pinned, ...BEST_CHAIN] : BEST_CHAIN;
}

// Cached across invocations within a warm lambda so we pay the model probe
// at most once per container, not once per generation.
let resolvedModel: string | null = null;

function envOverride(): string | undefined {
  return process.env.OPENAI_MODEL?.trim() || undefined;
}

export function configuredModel(): string | null {
  return envOverride() ?? resolvedModel;
}

function modelCandidates(override?: string[]): string[] {
  // An explicit chain is a capability requirement, not a preference, so it
  // is never widened by the env pin or the cached model.
  if (override?.length) return override;
  const pinned = envOverride();
  if (pinned) return [pinned];
  if (resolvedModel) return [resolvedModel, ...MODEL_CHAIN.filter((m) => m !== resolvedModel)];
  return MODEL_CHAIN;
}

const DEFAULT_MAX_TOKENS = 32000;
const REQUEST_TIMEOUT_MS = 150_000;

interface CallOptions {
  images?: OpenAIImagePart[];
  system?: string;
  /** Generation ceiling. Bespoke page markup needs a lot of room. */
  maxTokens?: number;
  temperature?: number;
  /** Ask the API for a JSON object back instead of prose. */
  json?: boolean;
  /**
   * Override the model chain for this call.
   *
   * Used by measurements that REQUIRE a search-capable model: a normal model
   * would answer the same prompt confidently from memory, which is exactly
   * the fabricated data this codebase is trying to eliminate. Restricting
   * the chain means the call fails rather than silently inventing.
   */
  modelChain?: string[];
}

type ChatMessage = { role: "system" | "user"; content: unknown };

function buildMessages(prompt: string, options: CallOptions): ChatMessage[] {
  const messages: ChatMessage[] = [];
  if (options.system) messages.push({ role: "system", content: options.system });

  if (options.images?.length) {
    const parts: Record<string, unknown>[] = [{ type: "text", text: prompt }];
    for (const img of options.images) {
      if (typeof img === "string") {
         parts.push({ type: "image_url", image_url: { url: img } });
      } else {
         const url = "url" in img ? img.url : `data:${img.mimeType};base64,${img.data}`;
         parts.push({ type: "image_url", image_url: { url } });
      }
    }
    messages.push({ role: "user", content: parts });
  } else {
    messages.push({ role: "user", content: prompt });
  }

  return messages;
}

interface Attempt {
  model: string;
  useMaxCompletionTokens: boolean;
  /** Parameters this model rejected, dropped on the retry. */
  dropped: Set<string>;
}

function buildBody(prompt: string, options: CallOptions, attempt: Attempt): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: attempt.model,
    messages: buildMessages(prompt, options),
  };

  // Generous by default. On a reasoning model this budget covers reasoning
  // AND output, and running out mid-reasoning yields empty content rather
  // than an error, so erring small fails silently while erring large only
  // costs what is actually generated.
  const limit = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  if (attempt.useMaxCompletionTokens) body.max_completion_tokens = limit;
  else body.max_tokens = limit;

  if (options.temperature !== undefined && !attempt.dropped.has("temperature")) {
    body.temperature = options.temperature;
  }

  // Search-capable models reject response_format outright. Callers that need
  // JSON also ask for it in the prompt and parse defensively, so dropping it
  // costs nothing.
  if (options.json && !attempt.dropped.has("response_format")) {
    body.response_format = { type: "json_object" };
  }

  return body;
}

/**
 * Read which parameter a model rejected, rather than guessing per model.
 *
 * OpenAI's 400 bodies name the offending parameter in a `param` field, so
 * the correction is derived rather than hardcoded — which matters because
 * every model family supports a slightly different set. Hardcoding three
 * known cases meant search-capable models, which reject response_format,
 * failed with no retry at all: they were available on the key, the
 * diagnostic reported them, and every call to them returned nothing.
 */
function diagnoseParamError(status: number, body: string, attempt: Attempt): Partial<Attempt> | null {
  if (status !== 400) return null;
  const lower = body.toLowerCase();

  // max_tokens is a rename rather than an unsupported parameter, so it has
  // its own correction.
  if (lower.includes("max_tokens") && lower.includes("max_completion_tokens") && !attempt.useMaxCompletionTokens) {
    return { useMaxCompletionTokens: true };
  }

  const named = body.match(/"param"\s*:\s*"([^"]+)"/)?.[1];
  const guessed =
    named ??
    (lower.includes("response_format")
      ? "response_format"
      : lower.includes("temperature")
        ? "temperature"
        : null);

  if (!guessed || attempt.dropped.has(guessed)) return null;

  console.warn(`[openai] ${attempt.model} rejected "${guessed}" — retrying without it`);
  return { dropped: new Set([...attempt.dropped, guessed]) };
}

function isModelUnavailable(status: number, body: string): boolean {
  if (status === 404) return true;
  const lower = body.toLowerCase();
  return status === 400 && (lower.includes("model_not_found") || lower.includes("does not exist"));
}

export async function callOpenAI(prompt: string, options: CallOptions = {}): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[openai] OPENAI_API_KEY is not set in this environment");
    return null;
  }

  for (const model of modelCandidates(options.modelChain)) {
    let attempt: Attempt = { model, useMaxCompletionTokens: false, dropped: new Set() };

    // Enough tries to drop several unsupported parameters in turn. Each
    // retry removes exactly one, and a repeat rejection of the same
    // parameter ends the loop rather than spinning.
    for (let tries = 0; tries < 5; tries++) {
      let res: Response;
      try {
        res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(buildBody(prompt, options, attempt)),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (err) {
        const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
        console.error(timedOut ? `[openai] ${model} timed out after ${REQUEST_TIMEOUT_MS / 1000}s` : "[openai] network error —", timedOut ? "" : err);
        return null;
      }

      if (res.ok) {
        const data = await res.json();
        const choice = data.choices?.[0];
        const text = choice?.message?.content;
        const usage = data.usage ?? {};
        if (!envOverride() && !options.modelChain) resolvedModel = model;

        // Reasoning models spend max_completion_tokens on reasoning BEFORE
        // writing any output, so an under-sized budget returns a perfectly
        // successful response with empty content. That produced a bare
        // "generation returned nothing" that pointed at the API key, which
        // was never the problem. Log enough to tell the difference.
        if (typeof text !== "string" || !text.trim()) {
          console.error(
            `[openai] empty content from ${model} — finish_reason=${choice?.finish_reason}` +
              ` prompt=${usage.prompt_tokens} completion=${usage.completion_tokens}` +
              ` reasoning=${usage.completion_tokens_details?.reasoning_tokens ?? 0} limit=${options.maxTokens ?? DEFAULT_MAX_TOKENS}`
          );
          return null;
        }

        if (choice?.finish_reason === "length") {
          console.warn(`[openai] ${model} hit the token limit — output is truncated and may not parse`);
        }

        console.log(
          `[openai] ${model} ok — prompt=${usage.prompt_tokens} completion=${usage.completion_tokens}` +
            ` reasoning=${usage.completion_tokens_details?.reasoning_tokens ?? 0}`
        );

        // Not awaited: recording what a call cost must never delay or fail
        // the call itself. Reasoning tokens are billed as output, so they
        // are counted with the completion rather than dropped.
        const ctx = usageContext();
        void recordUsage({
          leadId: ctx.leadId,
          tenantSlug: ctx.tenantSlug,
          purpose: ctx.purpose,
          provider: "openai",
          model,
          promptTokens: usage.prompt_tokens ?? 0,
          completionTokens:
            (usage.completion_tokens ?? 0) + (usage.completion_tokens_details?.reasoning_tokens ?? 0),
        });

        return text.trim();
      }

      const body = await res.text().catch(() => "<unreadable body>");

      if (isModelUnavailable(res.status, body)) {
        console.warn(`[openai] model "${model}" unavailable on this key, trying next`);
        break; // move to the next model in the chain
      }

      const correction = diagnoseParamError(res.status, body, attempt);
      if (correction) {
        attempt = { ...attempt, ...correction };
        continue; // same model, corrected parameter shape
      }

      console.error(`[openai] API ${res.status} on model "${model}": ${body.slice(0, 500)}`);
      return null;
    }
  }

  console.error("[openai] every candidate model failed — check OPENAI_MODEL / key entitlements");
  return null;
}

/**
 * Model ids the live key can see, each with its release timestamp.
 *
 * The timestamp is the point: model families do not sort sensibly by name
 * (a codenamed release can be newer than a higher version number), so
 * picking the strongest available model is an evidence question, not a
 * naming-convention guess.
 */
export async function listAvailableModels(): Promise<{ id: string; created: number }[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.data ?? []).map((m: { id: string; created: number }) => ({ id: m.id, created: m.created }));
  } catch {
    return null;
  }
}
