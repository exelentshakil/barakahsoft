import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/is-admin-session";
import { callOpenAI, listAvailableModels, configuredModel } from "@/lib/openai-client";

// Admin-only. Answers "which model is this key actually entitled to, and
// does a real generation call succeed?" against the live key, so the model
// the generator runs on is a verified fact rather than a guess.
//
// Release timestamps are reported because model names do not sort sensibly
// — a codenamed release can be newer than a higher version number, so
// picking the strongest available model should be evidence-based.
export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const keyPresent = !!process.env.OPENAI_API_KEY;
  const models = await listAvailableModels();

  // Reasoning/chat families only; the full list is mostly audio, image and
  // embedding models that are noise for this decision.
  const newestChatModels = (models ?? [])
    .filter((m) => /^(gpt-[45]|o\d)/i.test(m.id))
    .filter((m) => !/(audio|image|realtime|transcribe|tts|search|embedding)/i.test(m.id))
    .sort((a, b) => b.created - a.created)
    .slice(0, 25)
    .map((m) => ({ id: m.id, released: new Date(m.created * 1000).toISOString().slice(0, 10) }));

  const probe = keyPresent ? await callOpenAI("Reply with exactly: OK", { maxTokens: 4000 }) : null;

  return NextResponse.json({
    keyPresent,
    pinnedViaEnv: process.env.OPENAI_MODEL ?? null,
    modelUsed: configuredModel(),
    probeOk: probe?.toUpperCase().includes("OK") ?? false,
    newestChatModels,
    totalModelsVisible: models?.length ?? 0,
  });
}
