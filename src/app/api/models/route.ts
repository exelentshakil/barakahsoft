import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/is-admin-session";

// What the keys can actually reach right now, asked of the providers rather
// than kept in a list here.
//
// A hardcoded roster is what produced the failure this replaces: the Gemini
// chain named gemini-2.5-pro and four ids below it, and every one had been
// retired — 2.5-pro answering "no longer available to new users" — so every
// homepage silently fell through to a Flash model on the one call where
// output quality is the product. A list in source cannot notice that; a live
// call can.

export const maxDuration = 30;

export interface ModelOption {
  id: string;
  provider: "openai" | "gemini";
  /** Ranked hint so the operator does not have to know the lineup. */
  recommended: boolean;
  note?: string;
}

// Anything that cannot write a page. Image, audio, video, embedding and
// robotics models are all reachable with the same key and are noise in a
// picker whose only job is choosing who writes HTML and CSS.
const NOT_FOR_DESIGN =
  /embedding|embed-|moderation|whisper|tts|audio|realtime|transcribe|image|dall-e|imagen|veo|lyria|nano-banana|robotics|computer-use|guard|rerank|aqa|live-|translate|codex|search|deep-research/i;

/**
 * Pro/flagship tiers write markedly better markup than mini or lite tiers.
 *
 * The size test matches whole segments, not substrings: "gemini" contains
 * "mini", so a substring check quietly disqualified every Gemini model from
 * ever being marked as the recommended one.
 */
const SMALL_TIER = /(^|[-.])(mini|lite|nano|flash)([-.]|$)/i;

function isFlagship(id: string): boolean {
  return /(^|[-.])(pro|opus|flagship)([-.]|$)/i.test(id) && !SMALL_TIER.test(id);
}

async function listGemini(): Promise<ModelOption[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`);
    if (!res.ok) return [];
    const data = await res.json();
    const models: { name?: string; supportedGenerationMethods?: string[] }[] = data.models ?? [];
    return models
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter((id) => id && !NOT_FOR_DESIGN.test(id))
      .filter((id) => !/gemma/i.test(id))
      .map((id) => ({
        id,
        provider: "gemini" as const,
        recommended: isFlagship(id),
        note: isFlagship(id) ? "Pro tier — best markup quality" : undefined,
      }));
  } catch {
    return [];
  }
}

async function listOpenAI(): Promise<ModelOption[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const models: { id?: string }[] = data.data ?? [];
    return models
      .map((m) => m.id ?? "")
      .filter((id) => id && !NOT_FOR_DESIGN.test(id))
      // Fine-tunes, snapshots and non-chat families are noise here.
      .filter((id) => /^(gpt|o\d|chatgpt)/i.test(id))
      .map((id) => ({
        id,
        provider: "openai" as const,
        recommended: isFlagship(id) || /^gpt-\d+(\.\d+)?$/i.test(id),
        note: isFlagship(id) ? "Pro tier — best markup quality" : undefined,
      }));
  } catch {
    return [];
  }
}

export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const [gemini, openai] = await Promise.all([listGemini(), listOpenAI()]);

  // Newest ids sort last alphabetically far more often than not, and an
  // operator scanning this wants the current generation at the top.
  const order = (a: ModelOption, b: ModelOption) =>
    Number(b.recommended) - Number(a.recommended) || b.id.localeCompare(a.id, undefined, { numeric: true });

  return NextResponse.json({
    openai: openai.sort(order),
    gemini: gemini.sort(order),
    // Absent keys are the difference between "none available" and "not
    // configured", and the operator needs to be able to tell them apart.
    configured: { openai: Boolean(process.env.OPENAI_API_KEY), gemini: Boolean(process.env.GEMINI_API_KEY) },
  });
}
