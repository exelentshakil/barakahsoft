import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { invalidatePriceCache } from "@/lib/cost/pricing";
import { callOpenAI } from "@/lib/openai-client";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { SEARCH_MODELS } from "@/lib/audit/search-visibility";

// Model prices: read, look up, confirm.
//
// GET returns what is stored. POST saves rates the operator has confirmed.
// PUT asks a search-capable model to look current rates up and returns them
// as SUGGESTIONS with the page each came from — it saves nothing.
//
// That split is the whole point. A model asked for pricing from memory
// answers confidently and is often wrong, and a wrong rate does not surface
// as an error: it reports a margin that is wrong on the screen used to
// decide whether the business works. Looking it up against the provider's
// own pricing page and making a human confirm it is the difference between
// a useful shortcut and invented financials.

export const maxDuration = 120;

interface Suggestion {
  model: string;
  provider: "openai" | "gemini";
  inputPerMillion: number | null;
  outputPerMillion: number | null;
  sourceUrl: string | null;
  note: string | null;
}

export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const admin = createAdminClient();
  const [{ data: prices }, { data: used }] = await Promise.all([
    admin.from("model_prices").select("*").order("model"),
    // The models actually billed, so the screen asks about what is in use
    // rather than every model the providers offer.
    admin.from("ai_usage").select("provider, model").returns<{ provider: string; model: string }[]>(),
  ]);

  const seen = new Map<string, string>();
  for (const row of used ?? []) if (!seen.has(row.model)) seen.set(row.model, row.provider);

  return NextResponse.json({
    prices: prices ?? [],
    modelsInUse: [...seen.entries()].map(([model, provider]) => ({ model, provider })),
  });
}

export async function PUT(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const models: { model: string; provider: string }[] = Array.isArray(body?.models) ? body.models.slice(0, 20) : [];
  if (models.length === 0) {
    return NextResponse.json({ error: "No models to look up. Generate something first, or add a price by hand." }, { status: 400 });
  }

  const raw = await callOpenAI(
    `Find the CURRENT published API price for each model below, from the provider's own pricing page.

${models.map((m) => `- ${m.model} (${m.provider})`).join("\n")}

Rules:
- Prices are USD per ONE MILLION tokens, input and output separately.
- Use the provider's official pricing page: platform.openai.com/docs/pricing or ai.google.dev/pricing. Give the URL you actually used.
- If you cannot find a published price for a model, return null for both figures and say why in "note". Do NOT estimate, infer from a similar model, or fill a gap with a plausible number.
- If a model has tiered pricing, use the standard non-batch, non-cached tier and say so in "note".

Return strict JSON only:
{"prices":[{"model":"...","inputPerMillion":1.25,"outputPerMillion":10,"sourceUrl":"https://...","note":null}]}`,
    { json: true, maxTokens: 4000, temperature: 0, modelChain: SEARCH_MODELS }
  );

  const parsed = raw ? parseJsonResponse(raw) : null;
  const rows: unknown[] = Array.isArray(parsed?.prices) ? parsed.prices : [];

  const num = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 10_000 ? v : null;

  const suggestions: Suggestion[] = models.map((m) => {
    const hit = rows.find((r) => typeof (r as { model?: string })?.model === "string" && (r as { model: string }).model.toLowerCase() === m.model.toLowerCase()) as
      | { inputPerMillion?: unknown; outputPerMillion?: unknown; sourceUrl?: unknown; note?: unknown }
      | undefined;
    return {
      model: m.model,
      provider: m.provider === "gemini" ? "gemini" : "openai",
      inputPerMillion: num(hit?.inputPerMillion),
      outputPerMillion: num(hit?.outputPerMillion),
      sourceUrl: typeof hit?.sourceUrl === "string" ? hit.sourceUrl : null,
      note: typeof hit?.note === "string" ? hit.note : hit ? null : "No price returned for this model.",
    };
  });

  // Explicitly not saved. The caller shows these for confirmation.
  return NextResponse.json({ suggestions, savedNothing: true });
}

export async function POST(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const rows: unknown[] = Array.isArray(body?.prices) ? body.prices : [];
  if (rows.length === 0) return NextResponse.json({ error: "Nothing to save." }, { status: 400 });

  const clean = rows
    .map((r) => r as { model?: unknown; provider?: unknown; inputPerMillion?: unknown; outputPerMillion?: unknown; sourceUrl?: unknown; source?: unknown })
    .filter(
      (r) =>
        typeof r.model === "string" &&
        r.model.trim() &&
        typeof r.inputPerMillion === "number" &&
        typeof r.outputPerMillion === "number" &&
        (r.inputPerMillion as number) >= 0 &&
        (r.outputPerMillion as number) >= 0
    )
    .map((r) => ({
      model: (r.model as string).trim().toLowerCase(),
      provider: r.provider === "gemini" ? "gemini" : "openai",
      input_per_million: r.inputPerMillion as number,
      output_per_million: r.outputPerMillion as number,
      // Recorded so a rate a model found can be told apart from one read off
      // an invoice.
      source: r.source === "looked-up" ? "looked-up" : "manual",
      source_url: typeof r.sourceUrl === "string" ? r.sourceUrl : null,
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

  if (clean.length === 0) return NextResponse.json({ error: "Every row was missing a model or a valid price." }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("model_prices").upsert(clean, { onConflict: "model" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Otherwise the just-saved rate would not apply for up to a minute.
  invalidatePriceCache();

  return NextResponse.json({ saved: clean.length });
}
