import { callOpenAI } from "@/lib/openai-client";
import { groundedJson } from "@/lib/gemini-search";
import { parseJsonResponse } from "@/lib/parse-json-response";

// Local search visibility, measured with a search-capable model.
//
// This replaces a Google Maps grid for one practical reason and one
// principled one. Practical: it bills to the OpenAI account already in use,
// so there is a single cost centre instead of a second vendor. Principled:
// the numbers are MEASURED, from searches actually performed, not produced
// from a model's own knowledge.
//
// That distinction is the whole point. An LLM asked from memory where a
// business ranks in a neighbourhood will answer confidently and be inventing
// it — which is the fabricated report this system exists to stop shipping.
// A model with search performs the query and reads the result, and every
// cell here traces back to one of those.
//
// What this measures is LOCAL SEARCH VISIBILITY, not Google Maps local-pack
// position at a coordinate. Those are different things, and the report says
// so, because a claim a client can disprove is worse than a smaller claim
// they can verify.
//
// Two providers, and the default is Gemini for a substantive reason rather
// than a cost one: its grounding queries Google's own index, and Google's
// index is what local ranking means to a business owner. OpenAI's search
// models are the fallback. Either way the rule is identical — a response
// that was not actually grounded in a search is discarded, never used.

export interface VisibilityCell {
  area: string;
  /** Position in the results, or null when the business did not appear. */
  rank: number | null;
  /** Who holds the top spot there — real, from the same result set. */
  topCompetitor: string | null;
  /** Businesses seen ahead of this one, for the closing conversation. */
  ahead: string[];
}

export interface VisibilityReport {
  query: string;
  /** Which search index the measurement came from. Shown in the report. */
  provider: SearchProvider;
  cells: VisibilityCell[];
  visible: number;
  missing: number;
  dominant: number;
  measuredAt: string;
}

// Search-capable models only. Without one of these the searches do not
// happen and the report must not be produced at all.
export const SEARCH_MODELS = ["gpt-5-search-api", "gpt-4o-search-preview", "gpt-4o-mini-search-preview"];

/** Real neighbourhoods around a city, for the areas to measure. */
export async function deriveAreas(city: string, count: number): Promise<string[]> {
  const raw = await callOpenAI(
    `List the ${count} most populated neighbourhoods, districts or nearby towns around ${city}, as a local tradesperson would define their service area.

These must be real places that genuinely exist near ${city}. Order them roughly from closest to furthest.

Return strict JSON only: {"areas": ["...", "..."]}`,
    { json: true, maxTokens: 8000, temperature: 0.2 }
  );

  const parsed = raw ? parseJsonResponse(raw) : null;
  const areas = Array.isArray(parsed?.areas) ? (parsed.areas as unknown[]) : [];
  return areas.filter((a): a is string => typeof a === "string" && a.trim().length > 1).slice(0, count);
}

function normalise(name: string): string {
  return name.toLowerCase().replace(/\b(inc|llc|ltd|co|corp|company|the)\b/g, "").replace(/[^a-z0-9]/g, "");
}

/** Position of the business in a result list, tolerant of naming variation. */
function findRank(results: string[], businessName: string): number | null {
  const target = normalise(businessName);
  if (!target) return null;

  const index = results.findIndex((entry) => {
    const candidate = normalise(entry);
    if (!candidate) return false;
    return candidate.includes(target) || target.includes(candidate);
  });

  return index >= 0 ? index + 1 : null;
}

/**
 * Measure one area.
 *
 * Returns null rather than a guess when the search does not come back
 * usable — a blank cell is honest, an invented one is not.
 */
export type SearchProvider = "gemini" | "openai";

const AREA_PROMPT = (trade: string, area: string) =>
  `Search for "${trade} in ${area}" and report which businesses actually appear in the results, in the order they appear.

Report only real businesses present in those search results. Do not add businesses from your own knowledge, do not invent names, and do not pad the list to a target length. If the search returns fewer than ten, report fewer.

Use this exact shape: {"businesses": ["Business Name", "..."]}`;

async function measureArea(
  trade: string,
  area: string,
  businessName: string,
  provider: SearchProvider
): Promise<VisibilityCell | null> {
  let businesses: unknown[] | null = null;

  if (provider === "gemini") {
    const grounded = await groundedJson(AREA_PROMPT(trade, area));
    // groundedJson already discards responses with no sources, so reaching
    // here means a search genuinely ran.
    businesses = Array.isArray(grounded?.data?.businesses) ? (grounded.data.businesses as unknown[]) : null;
  } else {
    const raw = await callOpenAI(AREA_PROMPT(trade, area), {
      json: true,
      maxTokens: 8000,
      // Every candidate here performs a real web search. Without one the
      // measurement cannot happen and this returns nothing.
      modelChain: SEARCH_MODELS,
    });
    const parsed = raw ? parseJsonResponse(raw) : null;
    businesses = Array.isArray(parsed?.businesses) ? (parsed.businesses as unknown[]) : null;
  }

  if (!businesses) return null;

  const results = businesses.filter((b): b is string => typeof b === "string" && b.trim().length > 1);
  if (results.length === 0) return null;

  const rank = findRank(results, businessName);

  return {
    area,
    rank,
    topCompetitor: results[0] ?? null,
    ahead: (rank ? results.slice(0, rank - 1) : results).slice(0, 3),
  };
}

/**
 * Measure visibility across a service area.
 *
 * Batched rather than fully parallel: each cell is a real search, and firing
 * fifty at once reliably hits rate limits, which would silently thin the
 * report rather than fail it.
 */
export async function measureSearchVisibility(
  businessName: string,
  trade: string,
  city: string,
  options: { areas?: string[]; cellCount?: number; provider?: SearchProvider } = {}
): Promise<VisibilityReport | null> {
  const cellCount = Math.min(options.cellCount ?? 25, 49);
  // Gemini grounding reads Google's own index, which is the index the client
  // is actually judged by, so it leads unless a key is missing.
  const provider: SearchProvider = options.provider ?? (process.env.GEMINI_API_KEY ? "gemini" : "openai");

  const areas =
    options.areas && options.areas.length >= 5
      ? options.areas.slice(0, cellCount)
      : await deriveAreas(city, cellCount);

  if (areas.length === 0) return null;

  const cells: VisibilityCell[] = [];
  const BATCH = 5;

  for (let i = 0; i < areas.length; i += BATCH) {
    const batch = areas.slice(i, i + BATCH);
    const measured = await Promise.all(batch.map((area) => measureArea(trade, area, businessName, provider)));
    for (const cell of measured) if (cell) cells.push(cell);
  }

  // A report built from a handful of successful searches would misrepresent
  // the service area, so it is refused rather than shipped thin.
  if (cells.length < Math.min(5, areas.length)) {
    console.error(`[visibility] only ${cells.length} of ${areas.length} areas measured — not enough for a report`);
    return null;
  }

  return {
    query: `${trade} in {area}`,
    provider,
    cells,
    visible: cells.filter((c) => c.rank !== null).length,
    missing: cells.filter((c) => c.rank === null).length,
    dominant: cells.filter((c) => c.rank !== null && c.rank <= 3).length,
    measuredAt: new Date().toISOString(),
  };
}
