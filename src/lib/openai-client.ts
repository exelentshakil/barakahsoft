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

export type OpenAIImagePart = { mimeType: string; data: string };

const MODEL_CHAIN = ["gpt-5.1", "gpt-5", "gpt-4.1", "gpt-4o"];

// Cached across invocations within a warm lambda so we pay the model probe
// at most once per container, not once per generation.
let resolvedModel: string | null = null;

export function configuredModel(): string | null {
  return process.env.OPENAI_MODEL || resolvedModel;
}

function modelCandidates(): string[] {
  const pinned = process.env.OPENAI_MODEL?.trim();
  if (pinned) return [pinned];
  if (resolvedModel) return [resolvedModel, ...MODEL_CHAIN.filter((m) => m !== resolvedModel)];
  return MODEL_CHAIN;
}

interface CallOptions {
  images?: OpenAIImagePart[];
  system?: string;
  /** Generation ceiling. Bespoke page markup needs a lot of room. */
  maxTokens?: number;
  temperature?: number;
  /** Ask the API for a JSON object back instead of prose. */
  json?: boolean;
}

type ChatMessage = { role: "system" | "user"; content: unknown };

function buildMessages(prompt: string, options: CallOptions): ChatMessage[] {
  const messages: ChatMessage[] = [];
  if (options.system) messages.push({ role: "system", content: options.system });

  if (options.images?.length) {
    const parts: Record<string, unknown>[] = [{ type: "text", text: prompt }];
    for (const img of options.images) {
      parts.push({
        type: "image_url",
        image_url: { url: `data:${img.mimeType};base64,${img.data}` },
      });
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
  omitTemperature: boolean;
}

function buildBody(prompt: string, options: CallOptions, attempt: Attempt): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: attempt.model,
    messages: buildMessages(prompt, options),
  };

  const limit = options.maxTokens ?? 16000;
  if (attempt.useMaxCompletionTokens) body.max_completion_tokens = limit;
  else body.max_tokens = limit;

  if (!attempt.omitTemperature && options.temperature !== undefined) {
    body.temperature = options.temperature;
  }

  if (options.json) body.response_format = { type: "json_object" };

  return body;
}

/** Real 400 bodies name the offending parameter — read it rather than guessing per model. */
function diagnoseParamError(status: number, body: string): Partial<Attempt> | null {
  if (status !== 400) return null;
  const lower = body.toLowerCase();
  if (lower.includes("max_tokens") && lower.includes("max_completion_tokens")) {
    return { useMaxCompletionTokens: true };
  }
  if (lower.includes("temperature")) {
    return { omitTemperature: true };
  }
  return null;
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

  for (const model of modelCandidates()) {
    let attempt: Attempt = { model, useMaxCompletionTokens: false, omitTemperature: false };

    // At most three tries per model: the initial call plus one retry for
    // each of the two known parameter-shape corrections.
    for (let tries = 0; tries < 3; tries++) {
      let res: Response;
      try {
        res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(buildBody(prompt, options, attempt)),
        });
      } catch (err) {
        console.error("[openai] network error —", err);
        return null;
      }

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (!process.env.OPENAI_MODEL) resolvedModel = model;
        return typeof text === "string" && text.trim() ? text.trim() : null;
      }

      const body = await res.text().catch(() => "<unreadable body>");

      if (isModelUnavailable(res.status, body)) {
        console.warn(`[openai] model "${model}" unavailable on this key, trying next`);
        break; // move to the next model in the chain
      }

      const correction = diagnoseParamError(res.status, body);
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

/** Model ids the live key can actually see. Used by the admin diagnostic route. */
export async function listAvailableModels(): Promise<string[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.data ?? []).map((m: { id: string }) => m.id).sort();
  } catch {
    return null;
  }
}
