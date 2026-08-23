import { createAdminClient } from "@/lib/supabase/admin";
import { searchWithFirecrawl } from "@/lib/scrape/firecrawl";
import { callPagespeedApi } from "@/lib/google/pagespeed";
import { callPlacesApi, searchNearbyCompetitors, resolveCompetitorWebsite } from "@/lib/google/places";

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
  /(yelp|angi|angieslist|thumbtack|houzz|homeadvisor|bbb\.org|facebook|instagram|linkedin|nextdoor|mapquest|yellowpages|yellow-pages|yp\.com|superpages|porch|buildzoom|expertise\.com|threebestrated|wikipedia|reddit|indeed|tripadvisor|glassdoor|google\.com|apple\.com|trustpilot|top10|bestbusinesses|clutch\.co|bark\.com|usnews\.com|forbes\.com)/i;

function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
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
  const clientHost = hostOf(client.website);
  const seenHosts = new Set<string>();
  if (clientHost) seenHosts.add(clientHost);

  const competitorRows: CompetitorRow[] = [];

  // 1. First priority: Google Places Text Search.
  // Directly finds real local businesses ranking on Google Maps for this trade/city,
  // and resolves their verified website URL to ensure 100% accurate match between name & URL.
  try {
    const placesHits = await searchNearbyCompetitors(query, undefined, 8);
    for (const hit of placesHits) {
      if (competitorRows.length >= 4) break;
      const website = await resolveCompetitorWebsite(hit.place_id);
      if (!website) continue;
      const host = hostOf(website);
      if (!host || seenHosts.has(host) || NOT_A_COMPETITOR.test(website) || NOT_A_COMPETITOR.test(host)) continue;
      seenHosts.add(host);

      const speed = await callPagespeedApi(website).catch(() => null);
      competitorRows.push({
        name: hit.name,
        website,
        rating: hit.rating,
        reviewCount: hit.review_count,
        speedScore: typeof speed?.mobile?.score === "number" ? speed.mobile.score : null,
        isClient: false,
      });
    }
  } catch (err) {
    console.error("[competitors] Places search failed, trying web search fallback", err);
  }

  // 2. Fallback: Firecrawl web search if Google Places returned fewer than 2 competitors.
  if (competitorRows.length < 2) {
    try {
      const hits = await searchWithFirecrawl(query, 10);
      for (const hit of hits) {
        if (competitorRows.length >= 4) break;
        if (NOT_A_COMPETITOR.test(hit.url)) continue;
        const host = hostOf(hit.url);
        if (!host || seenHosts.has(host) || NOT_A_COMPETITOR.test(host)) continue;
        seenHosts.add(host);

        const guessedName = hit.title.split(/[|\-–—:]/)[0].trim().slice(0, 60) || host;
        const places = await callPlacesApi(guessedName, city).catch(() => null);
        const speed = await callPagespeedApi(hit.url).catch(() => null);

        const placesHost = hostOf(places?.website);
        const isPlacesMatch = Boolean(
          placesHost && (placesHost === host || host.includes(placesHost) || placesHost.includes(host))
        );

        competitorRows.push({
          name: isPlacesMatch && places?.name ? places.name : guessedName,
          website: isPlacesMatch && places?.website ? places.website : hit.url,
          rating: isPlacesMatch ? (places?.rating ?? null) : null,
          reviewCount: isPlacesMatch ? (places?.review_count ?? null) : null,
          speedScore: typeof speed?.mobile?.score === "number" ? speed.mobile.score : null,
          isClient: false,
        });
      }
    } catch (err) {
      console.error("[competitors] Firecrawl search fallback failed", err);
    }
  }

  if (competitorRows.length === 0) return null;

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
      ...competitorRows,
    ],
    measuredAt: new Date().toISOString(),
  };

  const admin = createAdminClient();
  await admin.from("scrape_results").update({ competitors: benchmark }).eq("lead_id", leadId);

  return benchmark;
}
