import { searchWithFirecrawl } from "@/lib/scrape/firecrawl";
import { extractDesignDna } from "@/lib/design-dna";
import { callOpenAI } from "@/lib/openai-client";
import { presetFor } from "@/lib/inspiration-library";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DesignDna } from "@/lib/design-dna";

// Researching the best-designed site in a trade, per lead.
//
// This is what makes the design direction a finding rather than a preset.
// Seven house directions cannot cover every trade, and two roofers receiving
// the same direction is the template feeling the whole system exists to
// escape.
//
// Per LEAD, not per industry, and that distinction is the whole point.
// Caching a trade's winning reference would be cheaper, but it would hand
// every electrician the same design — the exact outcome this system exists
// to avoid, and worse when two of them compete in the same town. Research
// runs for each lead, and references already used in that trade are excluded
// so the search cannot quietly return the same winner twice.
//
// It costs a search plus up to three page reads, and it only ever runs on a
// lead an operator has already decided is real.

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
  options: { maxCandidates?: number; excludeHosts?: string[] } = {}
): Promise<{ dna: DesignDna; sourceUrl: string; label: string } | null> {
  const trade = industry.trim();
  if (!trade) return null;

  const maxCandidates = options.maxCandidates ?? 3;
  const excluded = new Set((options.excludeHosts ?? []).map((h) => h.toLowerCase()));

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
      // Two businesses in the same trade must not be built from the same
      // reference. Re-running the search alone would not achieve that --
      // the same query returns the same top result -- so previously used
      // references are excluded outright.
      if (excluded.has(host)) return false;
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

/** Reference hosts already used by other leads in this trade. */
async function hostsAlreadyUsed(industry: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("artifacts")
    .select("inspiration_url, leads!inner(industry)")
    .not("inspiration_url", "is", null)
    .returns<{ inspiration_url: string; leads: { industry: string | null } }[]>();

  const trade = industry.trim().toLowerCase();
  return (data ?? [])
    .filter((row) => {
      const other = (row.leads?.industry ?? "").toLowerCase();
      return other && (other.includes(trade) || trade.includes(other));
    })
    .map((row) => {
      try {
        return new URL(row.inspiration_url).hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

/**
 * The design direction for one lead.
 *
 * Researched per lead, never reused across leads. Caching a trade's winning
 * reference was cheaper, but it meant every electrician was built from the
 * same design — which is the template outcome this whole system exists to
 * avoid. Two businesses in the same trade competing in the same market must
 * not be handed the same look.
 *
 * References already used in this trade are excluded before the model ever
 * sees them, because re-running the search alone would return the same top
 * result and quietly produce the duplicate anyway.
 */
export async function researchForLead(
  industry: string
): Promise<{ dna: DesignDna; sourceUrl: string | null; label: string; from: "research" | "preset" }> {
  const excludeHosts = await hostsAlreadyUsed(industry);
  const researched = await researchDesignReference(industry, { excludeHosts });

  if (researched) return { ...researched, from: "research" };

  const preset = presetFor(industry);
  return { dna: preset.dna, sourceUrl: null, label: preset.label, from: "preset" };
}
