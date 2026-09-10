import { callOpenAI, bestModelChain } from "@/lib/openai-client";
import { callGemini, bestGeminiChain } from "@/lib/gemini-client";

export type GenerationProvider = "openai" | "gemini";

interface BestModelCallOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
  /**
   * An operator's explicit choice, tried before the house chain.
   */
  model?: string;
  /**
   * Overrides the client's default request timeout.
   *
   * A page body plus its stylesheet is 30-40k output tokens and reliably takes
   * longer than the 150s default, so without this every body call timed out
   * and the build failed after four minutes of work. Gemini clamps it to its
   * own ceiling.
   */
  timeoutMs?: number;
}

// ------------------------------------------------------------------
// 1. FAST MODEL (The "Wireframer")
// Used for heavy lifting where structure/HTML is needed but not deep CSS reasoning.
// Prevents timeouts on massive outputs.
// ------------------------------------------------------------------
export async function callFastModel(
  prompt: string,
  options: BestModelCallOptions,
  provider: GenerationProvider = "openai"
): Promise<string | null> {
  const pinned = options.model?.trim();

  if (provider === "gemini") {
    // Force flash chain for wireframing
    // gemini-1.5-flash is retired and 404s on the current key, so leading with
    // it cost every fast call a wasted round-trip before it fell through.
    const flashChain = ["gemini-flash-latest", "gemini-2.5-flash"];
    const chain = pinned ? [pinned, ...flashChain.filter((m) => m !== pinned)] : flashChain;
    return callGemini(prompt, chain[0], undefined, {
      system: options.system,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 16000,
      modelChain: chain,
    });
  }

  const flashChain = ["gpt-4o-mini"];
  return callOpenAI(prompt, {
    maxTokens: options.maxTokens ?? 16000,
    temperature: options.temperature ?? 0.7,
    modelChain: pinned ? [pinned, ...flashChain.filter((m) => m !== pinned)] : flashChain,
    system: options.system,
  });
}

// ------------------------------------------------------------------
// 2. SMART MODEL (The "Design Engineer")
// Used for injecting the "Wooooow" factor, styling, CSS grids, and critiques.
// ------------------------------------------------------------------
export async function callSmartModel(
  prompt: string,
  options: BestModelCallOptions,
  provider: GenerationProvider = "openai"
): Promise<string | null> {
  const pinned = options.model?.trim();

  if (provider === "gemini") {
    const houseChain = bestGeminiChain();
    const chain = pinned ? [pinned, ...houseChain.filter((m) => m !== pinned)] : houseChain;
    return callGemini(prompt, chain[0], undefined, {
      system: options.system,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      timeoutMs: options.timeoutMs,
      modelChain: chain,
    });
  }

  const houseChain = bestModelChain();
  return callOpenAI(prompt, {
    maxTokens: options.maxTokens,
    temperature: options.temperature,
    modelChain: pinned ? [pinned, ...houseChain.filter((m) => m !== pinned)] : houseChain,
    system: options.system,
  });
}

// Alias for backward compatibility with other scripts
export const callBestModel = callSmartModel;

// Routes a vision request to the best multi-modal model (currently OpenAI's vision capabilities)
export async function callBestVisionModel(
  prompt: string,
  base64ImageUrl: string,
  options: BestModelCallOptions
): Promise<string | null> {
   const pinned = options.model?.trim();
   const houseChain = bestModelChain();
   return callOpenAI(prompt, {
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      modelChain: pinned ? [pinned, ...houseChain.filter((m) => m !== pinned)] : houseChain,
      system: options.system,
      images: [base64ImageUrl]
   });
}

// ------------------------------------------------------------------
// 3. CROSS-PROVIDER FALLBACK
// The generation pipeline's model call.
// ------------------------------------------------------------------

/**
 * Try Gemini, then OpenAI, rather than only walking one provider's chain.
 *
 * callSmartModel takes a provider and stays inside it, so a degraded Gemini
 * meant a build spent fifteen minutes walking its chain and then failed
 * outright — observed live: an intake call that had taken twenty seconds
 * burned 939 seconds and returned nothing. A model chain is not a fallback if
 * every entry in it is behind the same endpoint.
 *
 * The per-attempt timeout matters as much as the order. Long timeouts are
 * right for a page body and wrong for a short structured call, because a
 * provider that has stopped answering should be discovered in a minute rather
 * than in ten.
 */
export async function callDesignModel(
  prompt: string,
  options: BestModelCallOptions & { label?: string }
): Promise<string | null> {
  const label = options.label ?? "design";

  const gemini = await callSmartModel(prompt, options, "gemini");
  if (gemini) return gemini;

  console.warn(`[${label}] gemini returned nothing; falling back to openai`);
  const openai = await callSmartModel(
    prompt,
    {
      ...options,
      // OpenAI's client has its own ceiling and does not read timeoutMs, so
      // this is left to it rather than pretended at.
      model: undefined,
    },
    "openai"
  );
  if (openai) return openai;

  console.error(`[${label}] both providers failed`);
  return null;
}
