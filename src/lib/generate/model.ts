import { callOpenAI, bestModelChain } from "@/lib/openai-client";
import { callGemini, bestGeminiChain } from "@/lib/gemini-client";

export type GenerationProvider = "openai" | "gemini";

interface BestModelCallOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
  /**
   * An operator's explicit choice, tried before the house chain.
   *
   * It is prepended rather than used alone so a model that has since been
   * retired degrades to the next option instead of failing the build — the
   * exact failure mode that left the Gemini path silently on Flash.
   */
  model?: string;
}

// The one call where output quality IS the product routes through here, so
// structure.ts and stylesheet.ts don't each hardcode which provider that
// means. OpenAI is the proven default; Gemini is opt-in per generation
// while it's being evaluated against real leads side by side.
export async function callBestModel(
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

// Routes a vision request to the best multi-modal model (currently OpenAI's vision capabilities)
export async function callBestVisionModel(
  prompt: string,
  base64ImageUrl: string,
  options: BestModelCallOptions
): Promise<string | null> {
   return callOpenAI(prompt, {
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      modelChain: bestModelChain(),
      system: options.system,
      images: [base64ImageUrl]
   });
}
