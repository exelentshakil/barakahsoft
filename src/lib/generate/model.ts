import { callOpenAI, bestModelChain } from "@/lib/openai-client";
import { callGemini, bestGeminiChain } from "@/lib/gemini-client";

export type GenerationProvider = "openai" | "gemini";

interface BestModelCallOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
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
  if (provider === "gemini") {
    const chain = bestGeminiChain();
    return callGemini(prompt, chain[0], undefined, {
      system: options.system,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      modelChain: chain,
    });
  }
  return callOpenAI(prompt, {
    maxTokens: options.maxTokens,
    temperature: options.temperature,
    modelChain: bestModelChain(),
    system: options.system,
  });
}
