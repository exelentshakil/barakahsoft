import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/is-admin-session";
import { callOpenAI, listAvailableModels, configuredModel } from "@/lib/openai-client";

// Admin-only. Answers "which model is this key actually entitled to, and
// does a real generation call succeed?" against the live Vercel key —
// so the model id the generator pins is a verified fact, not a guess.
export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const keyPresent = !!process.env.OPENAI_API_KEY;
  const models = await listAvailableModels();

  // Only chat-capable families are useful here; the full list includes
  // embeddings/audio/image models that would just be noise.
  const chatModels = (models ?? []).filter((m) => /^(gpt|o\d|chatgpt)/i.test(m));

  const probe = keyPresent ? await callOpenAI("Reply with exactly: OK", { maxTokens: 16 }) : null;

  return NextResponse.json({
    keyPresent,
    pinnedViaEnv: process.env.OPENAI_MODEL ?? null,
    modelUsed: configuredModel(),
    probeResult: probe,
    probeOk: probe?.toUpperCase().includes("OK") ?? false,
    chatModels,
    totalModelsVisible: models?.length ?? 0,
  });
}
