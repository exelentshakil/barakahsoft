// What a model call costs, per million tokens.
//
// Deliberately empty by default, and read from the environment rather than
// written here.
//
// Prices change without notice and the model lineup moves fast — the Gemini
// chain in this repo named five models that had all been retired. A price
// list baked into source would go stale the same way, except the failure
// would be worse: a stale rate does not error, it quietly reports a margin
// that is wrong, on the screen used to decide whether the business is
// working. Tokens are measured and always shown; dollars appear only for
// models the operator has actually priced.
//
// Set AI_MODEL_PRICES as JSON, in USD per million tokens:
//
//   AI_MODEL_PRICES={"gpt-5.2":{"in":1.25,"out":10},"gemini-3.1-pro-preview":{"in":2,"out":12}}
//
// Matching is longest-prefix, so "gpt-5.2" covers "gpt-5.2-2026-04-01"
// without needing a line per snapshot.

export interface ModelPrice {
  /** USD per million prompt tokens. */
  in: number;
  /** USD per million completion tokens. */
  out: number;
}

let cached: Record<string, ModelPrice> | null = null;

function priceTable(): Record<string, ModelPrice> {
  if (cached) return cached;
  const raw = process.env.AI_MODEL_PRICES;
  if (!raw) return (cached = {});
  try {
    const parsed = JSON.parse(raw) as Record<string, ModelPrice>;
    const clean: Record<string, ModelPrice> = {};
    for (const [model, price] of Object.entries(parsed)) {
      if (typeof price?.in === "number" && typeof price?.out === "number") clean[model.toLowerCase()] = price;
    }
    return (cached = clean);
  } catch {
    console.error("[pricing] AI_MODEL_PRICES is not valid JSON — costs will show as unpriced");
    return (cached = {});
  }
}

export function priceFor(model: string): ModelPrice | null {
  const table = priceTable();
  const id = model.toLowerCase();
  // Longest prefix wins, so a specific snapshot rate beats the family rate.
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
 * Cost of one call, or null when the model has no configured price.
 *
 * Null rather than zero: on a margin report "free" and "we do not know" must
 * not look the same.
 */
export function costOf(model: string, promptTokens: number, completionTokens: number): number | null {
  const price = priceFor(model);
  if (!price) return null;
  return (promptTokens / 1_000_000) * price.in + (completionTokens / 1_000_000) * price.out;
}

/** Whether any prices are configured at all, so the UI can say so plainly. */
export function pricingConfigured(): boolean {
  return Object.keys(priceTable()).length > 0;
}
