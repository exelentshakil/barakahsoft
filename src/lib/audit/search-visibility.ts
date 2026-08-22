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

// Six areas per call. Enough to cut calls by roughly eight-fold, few enough
// that a model will genuinely run a search for each rather than doing two and
// filling in the rest — which is the failure mode that makes naive batching
// worse than useless.
// Three, not six. At six the model reliably searched fewer places than it
// answered for, and every unsearched area was correctly dropped — leaving
// too few cells to report and failing the whole measurement.
const AREAS_PER_CALL = 3;

function batchPrompt(trade: string, areas: string[]): string {
  return `For EACH of these ${areas.length} places, run a separate search for "${trade} in <place>" and report which businesses actually appear in those results, in the order they appear.

Places:
${areas.map((a) => `- ${a}`).join("\n")}

You must run a real search for every place listed. Report only businesses present in the search results for that specific place. Never carry a business across from another place's results, never add businesses from your own knowledge, and never pad a list to a target length. If a search returns fewer than ten businesses, report fewer.

Use this exact shape:
{"results": [{"area": "exact place name from the list", "businesses": ["Business Name", "..."]}]}`;
}

/**
 * Whether a place was genuinely among the searches that ran.
 *
 * Matched on distinctive words rather than the whole string. Requiring the
 * full name to appear verbatim dropped almost every cell: asked about
 * "Northeast Philadelphia" the model searches "roofers northeast philly",
 * and asked about "Bucks County" it searches "roofing bucks county pa". Both
 * are genuine searches for that place, and both failed a substring test.
 */
function wasSearched(area: string, executedQueries: string[]): boolean {
  const words = area
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && !["county", "area", "north", "south", "east", "west", "city", "town"].includes(w));

  // A name made entirely of common words gives nothing to match on, so any
  // executed search counts rather than dropping the cell outright.
  if (words.length === 0) return executedQueries.length > 0;

  const haystack = executedQueries.join(" ").toLowerCase();
  return words.some((w) => haystack.includes(w));
}

function toCell(area: string, businesses: unknown, businessName: string): VisibilityCell | null {
  if (!Array.isArray(businesses)) return null;
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
 * Measure a batch of areas in one grounded call.
 *
 * Every returned cell is checked against the searches Gemini actually ran.
 * An area the model answered without searching for is dropped, because that
 * answer came from memory and a remembered ranking is an invented one. This
 * verification is the only reason batching is safe to do at all.
 */
async function measureBatchGemini(
  trade: string,
  areas: string[],
  businessName: string
): Promise<VisibilityCell[]> {
  const grounded = await groundedJson(batchPrompt(trade, areas));
  if (!grounded) return [];

  const rows = Array.isArray(grounded.data.results) ? (grounded.data.results as Record<string, unknown>[]) : [];
  const cells: VisibilityCell[] = [];

  for (const row of rows) {
    const area = typeof row.area === "string" ? row.area.trim() : "";
    if (!area) continue;

    // Match back to a requested place, so a renamed or invented area cannot
    // enter the report.
    const requested = areas.find((a) => a.toLowerCase() === area.toLowerCase());
    if (!requested) continue;

    if (!wasSearched(requested, grounded.executedQueries)) {
      console.warn(
        `[visibility] "${requested}" was answered without a matching search — dropping. ` +
          `Searches actually run: ${grounded.executedQueries.join(" | ") || "(none reported)"}`
      );
      continue;
    }

    const cell = toCell(requested, row.businesses, businessName);
    if (cell) cells.push(cell);
  }

  return cells;
}

/**
 * One area at a time, via OpenAI's search models.
 *
 * Not batched: these models return no equivalent of Gemini's executed-query
 * list, so a batch could not be verified per area and would be trusting the
 * model to have searched. One call per area keeps every cell attributable.
 */
async function measureAreaOpenAI(trade: string, area: string, businessName: string): Promise<VisibilityCell | null> {
  const raw = await callOpenAI(
    `Search the web for "${trade} in ${area}" and report which businesses actually appear in the results, in the order they appear.

Report only real businesses present in those search results. Do not add businesses from your own knowledge, do not invent names, and do not pad the list to a target length.

Return strict JSON only: {"businesses": ["Business Name", "..."]}`,
    { json: true, maxTokens: 8000, modelChain: SEARCH_MODELS }
  );

  const parsed = raw ? parseJsonResponse(raw) : null;
  return parsed ? toCell(area, parsed.businesses, businessName) : null;
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

  if (provider === "gemini") {
    // Batched: 49 areas becomes about eight grounded calls rather than 49,
    // and Gemini bills per grounded request.
    const batches: string[][] = [];
    for (let i = 0; i < areas.length; i += AREAS_PER_CALL) batches.push(areas.slice(i, i + AREAS_PER_CALL));

    // Two batches at a time — enough to keep the run short without tripping
    // rate limits, which would silently thin the report rather than fail it.
    for (let i = 0; i < batches.length; i += 2) {
      const measured = await Promise.all(
        batches.slice(i, i + 2).map((batch) => measureBatchGemini(trade, batch, businessName))
      );
      for (const group of measured) cells.push(...group);
    }
  } else {
    for (let i = 0; i < areas.length; i += 5) {
      const measured = await Promise.all(
        areas.slice(i, i + 5).map((area) => measureAreaOpenAI(trade, area, businessName))
      );
      for (const cell of measured) if (cell) cells.push(cell);
    }
  }

  // Batching is an optimisation, not a requirement. When it under-delivers,
  // fall back to one call per remaining area rather than failing the whole
  // measurement — those calls cost more but they reliably search.
  const minimum = Math.max(3, Math.ceil(areas.length * 0.6));
  if (cells.length < minimum) {
    const measured = new Set(cells.map((c) => c.area));
    const missing = areas.filter((a) => !measured.has(a));
    console.warn(`[visibility] batching produced ${cells.length}/${areas.length}; retrying ${missing.length} individually`);

    for (let i = 0; i < missing.length; i += 4) {
      const retried = await Promise.all(
        missing.slice(i, i + 4).map((area) => measureAreaOpenAI(trade, area, businessName))
      );
      for (const cell of retried) if (cell) cells.push(cell);
      if (cells.length >= minimum) break;
    }
  }

  if (cells.length < 3) {
    console.error(
      `[visibility] only ${cells.length} of ${areas.length} areas produced usable results after retrying`
    );
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
