import { searchNearbyCompetitors, resolveCompetitorWebsite, type CompetitorCandidate } from "@/lib/google/places";
import { fetchSiteHtml } from "@/lib/scrape/fetch-site";
import { extractLogoColor } from "@/lib/scrape/extract-logo-color";
import { extractPageInventory } from "@/lib/scrape/extract-text";
import { extractStructuralSignals, type CompetitorStructuralSignals } from "@/lib/scrape/extract-structural-signals";

const MAX_COMPETITORS_TO_LIST = 8;
const MIN_COMPETITORS_BEFORE_WIDENING = 3;
const MAX_COMPETITORS_TO_SCRAPE = 5;
// 50km, then 150km — a rural niche business (case 0: karting in Kilrea, pop.
// ~1,400) can easily have zero same-category competitors within a normal
// town radius; the real nearest ones are more likely a regional city over.
const RADIUS_TIERS_METERS = [50_000, 150_000];

export interface CompetitorDesignSignal {
  name: string;
  website: string;
  headline: string | null;
  brandColorHex: string | null;
  structural: CompetitorStructuralSignals;
}

export interface StructuralSummary {
  sampleSize: number;
  heroImagePct: number;
  statsAboveFoldPct: number;
  testimonialPct: number;
  galleryPct: number;
  avgNavLinks: number;
}

export interface CompetitorResearch {
  competitors: CompetitorCandidate[];
  designSignals: CompetitorDesignSignal[];
  designBrief: string;
  structuralSummary: StructuralSummary;
}

// ResearchCompetitors molecule — the user's explicit ask: ground the
// generated site's tone against real businesses in the same niche/location,
// not just the target business's own facts written in a vacuum. Finds real
// competitors via Places Text Search with a geo radius bias (already a
// working credential, no new paid search API needed) rather than a literal
// "near {town}" text match, which comes up empty for sparse rural niches.
// Pulls each competitor's real headline + brand color (informs tone, never
// copied verbatim) and synthesizes a short design brief the generate_*
// atoms can reference. Also seeds the Phase 8 Competitors tab.
export async function researchCompetitors(
  industryLabel: string,
  location: { lat: number; lng: number } | null,
  excludePlaceId?: string
): Promise<CompetitorResearch> {
  let competitors: CompetitorCandidate[] = [];

  if (location) {
    for (const radiusMeters of RADIUS_TIERS_METERS) {
      competitors = await searchNearbyCompetitors(industryLabel, excludePlaceId, MAX_COMPETITORS_TO_LIST, { ...location, radiusMeters });
      if (competitors.length >= MIN_COMPETITORS_BEFORE_WIDENING) break;
    }
  } else {
    competitors = await searchNearbyCompetitors(industryLabel, excludePlaceId, MAX_COMPETITORS_TO_LIST);
  }

  const withWebsites: CompetitorCandidate[] = [];
  for (const c of competitors) {
    const website = await resolveCompetitorWebsite(c.place_id);
    withWebsites.push({ ...c, website });
  }

  const designSignals: CompetitorDesignSignal[] = [];
  for (const c of withWebsites.filter((c) => c.website).slice(0, MAX_COMPETITORS_TO_SCRAPE)) {
    try {
      const pages = await fetchSiteHtml(c.website!, 1);
      const homepage = pages[0];
      if (!homepage) continue;
      const inventory = extractPageInventory(homepage);
      const logoColor = extractLogoColor(homepage);
      const structural = extractStructuralSignals(homepage);
      designSignals.push({
        name: c.name,
        website: c.website!,
        headline: inventory.headings[0] ?? null,
        brandColorHex: logoColor.brandColorHex,
        structural,
      });
    } catch (err) {
      console.error("[research-competitors] failed to scrape", c.website, err);
    }
  }

  const headlines = designSignals.map((s) => s.headline).filter(Boolean);
  const colors = designSignals.map((s) => s.brandColorHex).filter(Boolean);
  const designBrief =
    designSignals.length > 0
      ? `Real competitors in this niche/area (${designSignals.map((s) => s.name).join(", ")}) tend to open with headlines like: ${headlines
          .map((h) => `"${h}"`)
          .join("; ")}.${colors.length > 0 ? ` Common brand colors in this space: ${colors.join(", ")}.` : ""} Write something that fits this category's expectations without copying any of these phrases verbatim.`
      : "";

  const structuralSummary = summarizeStructuralSignals(designSignals);

  return { competitors: withWebsites, designSignals, designBrief, structuralSummary };
}

function summarizeStructuralSignals(signals: CompetitorDesignSignal[]): StructuralSummary {
  const n = signals.length;
  if (n === 0) {
    return { sampleSize: 0, heroImagePct: 0, statsAboveFoldPct: 0, testimonialPct: 0, galleryPct: 0, avgNavLinks: 0 };
  }
  const pct = (predicate: (s: CompetitorStructuralSignals) => boolean) =>
    Math.round((signals.filter((s) => predicate(s.structural)).length / n) * 100);

  return {
    sampleSize: n,
    heroImagePct: pct((s) => s.heroImagePresent),
    statsAboveFoldPct: pct((s) => s.statsAboveFold),
    testimonialPct: pct((s) => s.testimonialPresent),
    galleryPct: pct((s) => s.galleryPresent),
    avgNavLinks: Math.round(signals.reduce((sum, s) => sum + s.structural.navLinkCount, 0) / n),
  };
}
