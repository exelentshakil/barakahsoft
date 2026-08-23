export type GeminiImagePart = { mimeType: string; data: string };

export interface GeminiCallOptions {
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

// The strongest Gemini model on the account, for a call where output
// quality is the product — mirrors bestModelChain() in openai-client.ts.
// This is a guess at the sibling name to "gemini-3.6-flash" (already used
// elsewhere in this file), not a verified id, so it is overridable with
// GEMINI_MODEL_BEST without a redeploy if the account's real pro model id
// differs.
export function bestGeminiModel(): string {
  return process.env.GEMINI_MODEL_BEST?.trim() || "gemini-3.6-pro";
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
    console.error("[ai] GEMINI_API_KEY is not set in this environment");
    return null;
  }

  try {
    const parts: Record<string, unknown>[] = [{ text: prompt }];
    if (images?.length) {
      for (const img of images) parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
    }

    const requestBody: Record<string, unknown> = { contents: [{ parts }] };
    if (options?.system) requestBody.systemInstruction = { parts: [{ text: options.system }] };
    const generationConfig: Record<string, unknown> = {};
    if (options?.temperature !== undefined) generationConfig.temperature = options.temperature;
    if (options?.maxTokens !== undefined) generationConfig.maxOutputTokens = options.maxTokens;
    if (Object.keys(generationConfig).length > 0) requestBody.generationConfig = generationConfig;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "<unreadable body>");
      throw new Error(`Gemini API ${res.status}: ${body}`);
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || null;
  } catch (err) {
    console.error("[ai] Gemini call failed —", err);
    return null;
  }
}
