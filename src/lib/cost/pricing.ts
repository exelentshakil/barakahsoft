import { createAdminClient } from "@/lib/supabase/admin";

// What a model call costs, per million tokens.
//
// Prices live in the database, because they change on the provider's
// schedule rather than ours and a rate change should not be a deploy. An
// AI_MODEL_PRICES environment variable is still honoured as a fallback for
// environments with no table yet.
//
// No rate is ever guessed. A model can be asked to look one up — see
// /api/models/pricing — but what it returns is a suggestion the operator
// confirms, never a value that takes effect on its own. A wrong rate does
// not error; it quietly reports a margin that is wrong on the screen used to
// judge whether the business works, which is worse than reporting nothing.

export interface ModelPrice {
  in: number;
  out: number;
}

let envCache: Record<string, ModelPrice> | null = null;
let dbCache: { at: number; table: Record<string, ModelPrice> } | null = null;

// Long enough that a generation run does not re-query per call, short enough
// that a rate edited in the UI takes effect without a restart.
const DB_CACHE_MS = 60_000;

function envTable(): Record<string, ModelPrice> {
  if (envCache) return envCache;
  const raw = process.env.AI_MODEL_PRICES;
  if (!raw) return (envCache = {});
  try {
    const parsed = JSON.parse(raw) as Record<string, ModelPrice>;
    const clean: Record<string, ModelPrice> = {};
    for (const [model, price] of Object.entries(parsed)) {
      if (typeof price?.in === "number" && typeof price?.out === "number") clean[model.toLowerCase()] = price;
    }
    return (envCache = clean);
  } catch {
    console.error("[pricing] AI_MODEL_PRICES is not valid JSON — ignoring it");
    return (envCache = {});
  }
}

async function loadTable(): Promise<Record<string, ModelPrice>> {
  if (dbCache && Date.now() - dbCache.at < DB_CACHE_MS) return dbCache.table;

  const table: Record<string, ModelPrice> = { ...envTable() };
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("model_prices")
      .select("model, input_per_million, output_per_million")
      .returns<{ model: string; input_per_million: number; output_per_million: number }[]>();
    for (const row of data ?? []) {
      table[row.model.toLowerCase()] = { in: Number(row.input_per_million), out: Number(row.output_per_million) };
    }
  } catch {
    // No table yet — the env fallback still applies.
  }

  dbCache = { at: Date.now(), table };
  return table;
}

/** Drop the cache so a just-saved rate applies immediately. */
export function invalidatePriceCache(): void {
  dbCache = null;
}

function match(table: Record<string, ModelPrice>, model: string): ModelPrice | null {
  const id = model.toLowerCase();
  // Longest prefix wins, so a snapshot rate beats the family rate and
  // "gpt-5.2" covers "gpt-5.2-2026-04-01" without a row per snapshot.
  let best: ModelPrice | null = null;
  let bestLength = -1;
  for (const [key, price] of Object.entries(table)) {
    if (id.startsWith(key) && key.length > bestLength) {
      best = price;
      bestLength = key.length;
    }
  }
  return best;
}

/**
 * Cost of one call, or null when the model has no confirmed price.
 *
 * Null rather than zero: on a margin report "free" and "we do not know" must
 * not look the same.
 */
export async function costOf(model: string, promptTokens: number, completionTokens: number): Promise<number | null> {
  const price = match(await loadTable(), model);
  if (!price) return null;
  return (promptTokens / 1_000_000) * price.in + (completionTokens / 1_000_000) * price.out;
}

export async function pricingConfigured(): Promise<boolean> {
  return Object.keys(await loadTable()).length > 0;
}
