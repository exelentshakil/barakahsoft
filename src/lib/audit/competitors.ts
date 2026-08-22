import { createAdminClient } from "@/lib/supabase/admin";
import { searchWithFirecrawl } from "@/lib/scrape/firecrawl";
import { callPagespeedApi } from "@/lib/google/pagespeed";
import { callPlacesApi } from "@/lib/google/places";

// The competitor benchmark, on real competitors.
//
// This replaces a hardcoded table of "Top Competitor A/B/C" with invented
// speed scores that shipped identically to every client regardless of trade
// or city.
//
// Competitors come from a real search for the trade in their city, and every
// number attached to one is measured: review counts from Google Places,
// speed from a real PageSpeed run. Where a figure cannot be measured it is
// left null and the column renders empty, because a blank cell is honest and
// an invented one is the thing being removed.

export interface CompetitorRow {
  name: string;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  /** Real mobile PageSpeed score, or null when it could not be measured. */
  speedScore: number | null;
  isClient: boolean;
}

export interface CompetitorBenchmark {
  query: string;
  rows: CompetitorRow[];
  measuredAt: string;
}

const NOT_A_COMPETITOR =
  /(yelp|angi|angieslist|thumbtack|houzz|homeadvisor|bbb\.org|facebook|instagram|linkedin|nextdoor|mapquest|yellowpages|porch|buildzoom|expertise\.com|threebestrated|wikipedia|reddit|indeed)/i;

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Find and measure the businesses this client is actually up against.
 *
 * Deliberately kept to a handful. A table of twelve competitors is a data
 * dump; four that the owner recognises is a conversation.
 */
export async function benchmarkCompetitors(
  leadId: string,
  trade: string,
  city: string,
  client: { name: string; website: string; rating: number | null; reviewCount: number | null; speedScore: number | null }
): Promise<CompetitorBenchmark | null> {
  if (!trade || !city) return null;

  const query = `${trade} in ${city}`;
  const hits = await searchWithFirecrawl(query, 10);
  const clientHost = hostOf(client.website);

  const seen = new Set<string>();
  const candidates = hits
    .filter((hit) => {
      if (NOT_A_COMPETITOR.test(hit.url)) return false;
      const host = hostOf(hit.url);
      if (!host || host === clientHost || seen.has(host)) return false;
      seen.add(host);
      return true;
    })
    .slice(0, 4);

  if (candidates.length === 0) return null;

  // Places supplies the review numbers, PageSpeed the speed. Both are free
  // at this volume and both are checkable by the client.
  const rows = await Promise.all(
    candidates.map(async (hit): Promise<CompetitorRow> => {
      const host = hostOf(hit.url)!;
      const guessedName = hit.title.split(/[|\-–—]/)[0].trim().slice(0, 60) || host;

      const [places, speed] = await Promise.all([
        callPlacesApi(guessedName, city).catch(() => null),
        callPagespeedApi(hit.url).catch(() => null),
      ]);

      return {
        name: places?.name ?? guessedName,
        website: hit.url,
        rating: places?.rating ?? null,
        reviewCount: places?.review_count ?? null,
        speedScore: typeof speed?.mobile?.score === "number" ? speed.mobile.score : null,
        isClient: false,
      };
    })
  );

  const benchmark: CompetitorBenchmark = {
    query,
    rows: [
      {
        name: client.name,
        website: client.website,
        rating: client.rating,
        reviewCount: client.reviewCount,
        speedScore: client.speedScore,
        isClient: true,
      },
      ...rows,
    ],
    measuredAt: new Date().toISOString(),
  };

  const admin = createAdminClient();
  await admin.from("scrape_results").update({ competitors: benchmark }).eq("lead_id", leadId);

  return benchmark;
}
