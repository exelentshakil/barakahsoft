import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/is-admin-session";
import { callOpenAI, listAvailableModels, configuredModel } from "@/lib/openai-client";
import { SEARCH_MODELS } from "@/lib/audit/search-visibility";

// Admin-only. Reports what the live keys can actually do, so model choices
// are verified rather than assumed.
export const maxDuration = 120;

export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const keyPresent = !!process.env.OPENAI_API_KEY;
  const models = await listAvailableModels();
  const ids = new Set((models ?? []).map((m) => m.id));

  const dated = (m: { id: string; created: number }) => ({
    id: m.id,
    released: new Date(m.created * 1000).toISOString().slice(0, 10),
  });

  // Search-capable models were previously filtered out of this report as
  // noise. They are now a hard dependency — visibility measurement refuses
  // to run without one — so they get their own section.
  const searchModels = (models ?? [])
    .filter((m) => /search/i.test(m.id))
    .sort((a, b) => b.created - a.created)
    .map(dated);

  const reasoningModels = (models ?? [])
    .filter((m) => /^(gpt-[45]|o\d)/i.test(m.id))
    .filter((m) => !/(audio|image|realtime|transcribe|tts|search|embedding)/i.test(m.id))
    .sort((a, b) => b.created - a.created)
    .slice(0, 20)
    .map(dated);

  const [probe, searchProbe] = keyPresent
    ? await Promise.all([
        callOpenAI("Reply with exactly: OK", { maxTokens: 4000 }),
        // Proves the search path end to end: a model that cannot search
        // would answer this from memory and get it wrong.
        // No response_format: search models reject it, and asking for it here
        // is what made this probe report failure while the models worked.
        callOpenAI(
          "Search the web and reply with strict JSON only, no markdown fences: {\"ok\": true, \"today\": \"the current date you found\"}",
          { maxTokens: 6000, modelChain: SEARCH_MODELS }
        ),
      ])
    : [null, null];

  return NextResponse.json({
    keyPresent,
    generation: {
      pinnedViaEnv: process.env.OPENAI_MODEL ?? null,
      modelUsed: configuredModel(),
      ok: probe?.toUpperCase().includes("OK") ?? false,
    },
    search: {
      // The chain the visibility measurement actually requires, and whether
      // this key can serve any of it.
      required: SEARCH_MODELS,
      availableOnKey: SEARCH_MODELS.filter((m: string) => ids.has(m)),
      allSearchModels: searchModels,
      probeOk: !!searchProbe && /"ok"\s*:\s*true/i.test(searchProbe),
      probeSample: searchProbe?.slice(0, 200) ?? null,
    },
    gemini: {
      keyPresent: !!process.env.GEMINI_API_KEY,
    },
    reasoningModels,
    totalModelsVisible: models?.length ?? 0,
  });
}
