import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/is-admin-session";

export const maxDuration = 30;

export interface ModelOption {
  id: string;
  provider: "openai" | "gemini";
  recommended: boolean;
  note?: string;
}

const NOT_FOR_DESIGN =
  /embedding|embed-|moderation|whisper|tts|audio|realtime|transcribe|image|dall-e|imagen|veo|lyria|nano-banana|robotics|computer-use|guard|rerank|aqa|live-|translate|codex|search|deep-research/i;

const SMALL_TIER = /(^|[-.])(mini|lite|nano|flash|8b|70b)([-.]|$)/i;

function isFlagship(id: string): boolean {
  return /(^|[-.])(pro|opus|flagship)([-.]|$)/i.test(id) && !SMALL_TIER.test(id);
}

const CURATED_OPENAI: ModelOption[] = [
  { id: "gpt-4.5-preview", provider: "openai", recommended: true, note: "Flagship — premier design & CSS reasoning" },
  { id: "gpt-4o", provider: "openai", recommended: true, note: "Fast & high-fidelity multimodal" },
];

const CURATED_GEMINI: ModelOption[] = [
  { id: "gemini-2.5-pro", provider: "gemini", recommended: true, note: "Flagship Pro — supreme HTML & design" },
];

async function listGemini(): Promise<ModelOption[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return CURATED_GEMINI;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`);
    if (!res.ok) return CURATED_GEMINI;
    const data = await res.json();
    const models: { name?: string; supportedGenerationMethods?: string[] }[] = data.models ?? [];
    const parsed = models
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter((id) => id && !NOT_FOR_DESIGN.test(id))
      .filter((id) => !/gemma/i.test(id))
      .map((id) => ({
        id,
        provider: "gemini" as const,
        recommended: isFlagship(id),
        note: isFlagship(id) ? "Pro tier — best markup quality" : undefined,
      }));
    return parsed.length > 0 ? parsed : CURATED_GEMINI;
  } catch {
    return CURATED_GEMINI;
  }
}

async function listOpenAI(): Promise<ModelOption[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return CURATED_OPENAI;
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return CURATED_OPENAI;
    const data = await res.json();
    const models: { id?: string }[] = data.data ?? [];
    const parsed = models
      .map((m) => m.id ?? "")
      .filter((id) => id && !NOT_FOR_DESIGN.test(id))
      .filter((id) => /^(gpt|o\d|chatgpt)/i.test(id))
      .map((id) => ({
        id,
        provider: "openai" as const,
        recommended: isFlagship(id) || /^gpt-\d+(\.\d+)?$/i.test(id),
        note: isFlagship(id) ? "Pro tier — best markup quality" : undefined,
      }));
    return parsed.length > 0 ? parsed : CURATED_OPENAI;
  } catch {
    return CURATED_OPENAI;
  }
}

export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const [gemini, openai] = await Promise.all([listGemini(), listOpenAI()]);

  const order = (a: ModelOption, b: ModelOption) =>
    Number(b.recommended) - Number(a.recommended) || b.id.localeCompare(a.id, undefined, { numeric: true });

  const sortedOpenAI = openai.sort(order);
  const sortedGemini = gemini.sort(order);
  const allModels = [...sortedOpenAI, ...sortedGemini];

  return NextResponse.json({
    models: allModels,
    openai: sortedOpenAI,
    gemini: sortedGemini,
    configured: { openai: Boolean(process.env.OPENAI_API_KEY), gemini: Boolean(process.env.GEMINI_API_KEY) },
  });
}
