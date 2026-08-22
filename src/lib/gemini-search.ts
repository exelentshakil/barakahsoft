import { parseJsonResponse } from "@/lib/parse-json-response";

// Gemini with Google Search grounding.
//
// Worth having alongside the OpenAI search models for one substantive reason
// beyond cost: grounding queries Google's own index, and Google's index is
// what local ranking actually means to a business owner. A visibility report
// built on it is measuring the thing the client cares about rather than a
// correlate of it.
//
// Like the OpenAI search path, this only reports what a search returned.
// Grounding metadata comes back with the response, so a call that produced no
// grounded sources is treated as a failed measurement rather than an answer —
// otherwise the model would happily answer from memory and the result would
// be indistinguishable from the fabricated data this replaced.

const GROUNDED_MODEL = "gemini-3.6-flash";

export interface GroundedResult {
  text: string;
  /** URLs the answer was actually grounded in. Empty means it was not. */
  sources: string[];
}

/**
 * Run a grounded search and return the model's answer plus its sources.
 *
 * Returns null when the call fails OR when nothing was grounded, because an
 * ungrounded answer to a "what is currently ranking" question is a guess.
 */
export async function groundedSearch(prompt: string): Promise<GroundedResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GROUNDED_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[gemini-search] ${res.status}: ${body.slice(0, 300)}`);
      return null;
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("").trim();
    if (!text) return null;

    const chunks = candidate?.groundingMetadata?.groundingChunks ?? [];
    const sources = (chunks as { web?: { uri?: string } }[])
      .map((chunk) => chunk.web?.uri ?? "")
      .filter(Boolean);

    // No sources means no search happened. Treating that as an answer is
    // exactly how invented rankings would get back into the report.
    if (sources.length === 0) {
      console.warn("[gemini-search] response was not grounded in any source — discarding");
      return null;
    }

    return { text, sources };
  } catch (err) {
    console.error("[gemini-search] failed", err);
    return null;
  }
}

/** Grounded search that must return JSON. */
export async function groundedJson(prompt: string): Promise<{ data: Record<string, unknown>; sources: string[] } | null> {
  // Grounding and JSON response-format cannot be combined, so the shape is
  // requested in the prompt and parsed defensively here.
  const result = await groundedSearch(`${prompt}\n\nReply with strict JSON only. No markdown fences, no commentary.`);
  if (!result) return null;

  const parsed = parseJsonResponse(result.text);
  return parsed ? { data: parsed, sources: result.sources } : null;
}
