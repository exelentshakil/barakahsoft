import { searchWithFirecrawl } from "@/lib/scrape/firecrawl";
import { extractDesignDna } from "@/lib/design-dna";
import { callOpenAI } from "@/lib/openai-client";
import { saveToLibrary, presetFor } from "@/lib/inspiration-library";
import type { DesignDna } from "@/lib/design-dna";

// Researching the best-designed site in a trade.
//
// This is what makes the design direction a finding rather than a preset.
// Seven house directions cannot cover every trade, and two roofers receiving
// the same direction is the template feeling the whole system exists to
// escape.
//
// Cost is bounded and amortised: it runs once per NEW industry, and the
// winner is cached into the reference library so every later lead in that
// trade reuses it for nothing. A handful of pages buys a direction for an
// entire market.

// Directories, marketplaces and listicles dominate these searches and are
// useless as design references — they are not the sites we want to look like.
const NOT_A_REFERENCE =
  /(yelp|angi|angieslist|thumbtack|houzz|homeadvisor|bbb\.org|facebook|instagram|linkedin|pinterest|reddit|wikipedia|youtube|indeed|glassdoor|amazon|etsy|fiverr|upwork|wix\.com|squarespace\.com|godaddy|wordpress\.com|shopify\.com|template|themeforest|envato|dribbble|behance|medium\.com|quora)/i;

// A listicle about good design is not itself good design.
const LISTICLE = /\b(\d+\s+best|top\s+\d+|examples|inspiration|ideas|templates|roundup|listicle)\b/i;

function candidateQueries(industry: string): string[] {
  const trade = industry.trim().toLowerCase();
  return [
    `award winning ${trade} company website`,
    `best designed ${trade} website`,
  ];
}

interface Candidate {
  url: string;
  title: string;
  dna: DesignDna;
}

/**
 * Find and extract the strongest design direction available for a trade.
 *
 * Returns null rather than throwing when research does not pan out — a lead
 * must never fail to generate because a search was thin, and the caller
 * falls back to a house direction.
 */
export async function researchDesignReference(
  industry: string,
  options: { maxCandidates?: number } = {}
): Promise<{ dna: DesignDna; sourceUrl: string; label: string } | null> {
  const trade = industry.trim();
  if (!trade) return null;

  const maxCandidates = options.maxCandidates ?? 3;

  const hits = (await Promise.all(candidateQueries(trade).map((q) => searchWithFirecrawl(q, 8)))).flat();

  const seen = new Set<string>();
  const shortlist = hits
    .filter((hit) => {
      if (NOT_A_REFERENCE.test(hit.url)) return false;
      if (LISTICLE.test(hit.title)) return false;
      let host: string;
      try {
        host = new URL(hit.url).hostname.replace(/^www\./, "");
      } catch {
        return false;
      }
      if (seen.has(host)) return false;
      seen.add(host);
      return true;
    })
    .slice(0, maxCandidates);

  if (shortlist.length === 0) {
    console.warn(`[design-research] no usable candidates for "${trade}"`);
    return null;
  }

  // Extracting in parallel: these are independent, and this is the slowest
  // part of onboarding a new industry.
  const extracted = await Promise.all(
    shortlist.map(async (hit) => {
      const result = await extractDesignDna(hit.url);
      // extractDesignDna falls back to the house default when a site cannot
      // be read, and a default dressed up as research is worse than no
      // research at all.
      if (result.dna.sourceName === "House standard") return null;
      return { url: hit.url, title: hit.title, dna: result.dna } as Candidate;
    })
  );

  const candidates = extracted.filter((c): c is Candidate => c !== null);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) {
    return { dna: candidates[0].dna, sourceUrl: candidates[0].url, label: candidates[0].title || trade };
  }

  const chosen = await pickStrongest(trade, candidates);
  return { dna: chosen.dna, sourceUrl: chosen.url, label: chosen.title || trade };
}

/**
 * Judge the extracted directions against each other.
 *
 * Judging the SPECS rather than the sites is deliberate: the spec is what
 * will actually be built, so a beautiful site whose extraction came out
 * muddled is correctly rejected in favour of a clean one.
 */
async function pickStrongest(trade: string, candidates: Candidate[]): Promise<Candidate> {
  const raw = await callOpenAI(
    `You are a creative director choosing which design direction to build a premium ${trade} website against. Below are ${candidates.length} directions extracted from real sites.

Judge each on: whether it would produce a page that looks expensive; whether its palette has real contrast and a usable accent; whether its motifs are concrete enough to actually build; and whether it suits a ${trade} customer making a real buying decision.

Reject anything washed out, low-contrast, or so generic it would suit any industry.

${candidates
  .map(
    (c, i) => `[${i}] ${c.url}
  mood: ${c.dna.mood}
  palette: primary ${c.dna.palette.primary}, accent ${c.dna.palette.accent}, surface ${c.dna.palette.surface}, ink ${c.dna.palette.ink}
  type: ${c.dna.typography.displayFamily} / ${c.dna.typography.bodyFamily}, ${c.dna.typography.scale}
  layout: ${c.dna.layout.heroTreatment}, ${c.dna.layout.serviceLayout}, ${c.dna.layout.proofStyle}, ${c.dna.layout.sectionRhythm}
  motifs: ${c.dna.motifs.join("; ") || "none"}
  read: ${c.dna.rationale}`
  )
  .join("\n\n")}

Reply with only the index number of the strongest direction. Nothing else.`,
    { maxTokens: 4000, temperature: 0.2 }
  );

  const index = Number(raw?.match(/\d+/)?.[0] ?? 0);
  return candidates[Number.isFinite(index) && index >= 0 && index < candidates.length ? index : 0];
}

/**
 * The direction for a lead, researched once per trade then reused.
 *
 * Every later lead in the same trade gets the cached result instantly and at
 * no cost, which is what makes researching each new market affordable.
 */
export async function researchAndCache(
  industry: string
): Promise<{ dna: DesignDna; sourceUrl: string | null; label: string; from: "research" | "preset" }> {
  const researched = await researchDesignReference(industry);

  if (researched) {
    await saveToLibrary(industry, researched.label, researched.dna, researched.sourceUrl);
    return { ...researched, from: "research" };
  }

  const preset = presetFor(industry);
  return { dna: preset.dna, sourceUrl: null, label: preset.label, from: "preset" };
}
