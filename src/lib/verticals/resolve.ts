import { DEFAULT_PROFILE, PERSONA_VERTICAL, PROFILES, getCuratedProfile } from "@/lib/verticals/index";
import { VerticalProfileSchema, type VerticalProfile, type VerticalResolution } from "@/lib/verticals/types";
import { isPersonaSlug } from "@/lib/personas";
import { generateProfileFor, industryKey, loadGeneratedProfile } from "@/lib/verticals/generate-profile";
import type { Artifact, Lead } from "@/types/database";

// Step 0: which kind of business is this?
//
// Everything downstream — the section order, the nouns, the call to action,
// the photo queries, the art direction, the schema.org type — is chosen by the
// profile this returns. One router, N profiles, one render engine.
//
// Resolution is ordered by how much we trust the source, most trusted first,
// and every step is cheap. Nothing here calls a model; the generated-profile
// path lives in resolveVerticalWithFallback and is reached only when a
// business matches nothing curated.

/** Regexes are compiled once per profile rather than per lead. */
const COMPILED = new Map<string, RegExp[]>(
  PROFILES.map((profile) => [profile.slug, profile.match.map((source) => new RegExp(source, "i"))])
);

function matchCurated(haystack: string): VerticalProfile | null {
  if (!haystack.trim()) return null;
  for (const profile of PROFILES) {
    const patterns = COMPILED.get(profile.slug) ?? [];
    if (patterns.some((pattern) => pattern.test(haystack))) return profile;
  }
  return null;
}

/**
 * The text a profile's match patterns are tested against.
 *
 * The business name and its own service names carry as much signal as the
 * classifier's one-line industry — "Bloom & Stem" and "bridal bouquets" say
 * florist more reliably than an industry string that came back "retail".
 */
export function matchText(lead: Pick<Lead, "industry" | "business_name">, services: string[] = []): string {
  return [lead.industry ?? "", lead.business_name ?? "", ...services].join(" ");
}

/**
 * Resolve a profile without touching the network.
 *
 * Used everywhere a build or a preview needs the profile for a lead that has
 * already been classified: the generate route, the operator prompt, section
 * surgery, the delivered page's JSON-LD. The scrape is where classification
 * actually happens.
 */
export function resolveVerticalSync(
  lead: Pick<Lead, "industry" | "business_name" | "persona" | "vertical_slug" | "icp_category">,
  artifact?: Pick<Artifact, "vertical_profile"> | null,
  services: string[] = []
): VerticalResolution {
  const icpCategory = lead.icp_category ?? "unclassified";

  // 1. The frozen snapshot this lead was built against. A delivered page must
  //    render against the profile it was generated with, not whatever the
  //    registry says today.
  if (artifact?.vertical_profile) {
    const parsed = VerticalProfileSchema.safeParse(artifact.vertical_profile);
    if (parsed.success) {
      return { profile: parsed.data, icpCategory, fit: "native", source: "operator" };
    }
    // A snapshot written by an older schema version must never break a build.
    console.warn("[verticals] stored profile failed validation, falling through");
  }

  // 2. The operator's explicit choice, from the brief screen.
  if (lead.vertical_slug) {
    const chosen = getCuratedProfile(lead.vertical_slug);
    if (chosen) return { profile: chosen, icpCategory, fit: "native", source: "operator" };
  }

  // 3. The trade they picked on the intake form. All eleven are trades.
  if (lead.persona && isPersonaSlug(lead.persona)) {
    const slug = PERSONA_VERTICAL[lead.persona];
    const byPersona = getCuratedProfile(slug);
    if (byPersona) return { profile: byPersona, icpCategory, fit: "native", source: "persona" };
  }

  // 4. What their own content says they are.
  const matched = matchCurated(matchText(lead, services));
  if (matched) return { profile: matched, icpCategory, fit: "native", source: "curated" };

  // 5. Nothing recognised it. home-services is the historical default and
  //    remains the safest structure for an unknown local business: it is the
  //    only profile whose behaviour is proven across a real corpus.
  return { profile: DEFAULT_PROFILE, icpCategory, fit: "adapted", source: "fallback" };
}

/** The profile alone, for the many callers that need nothing else. */
export function profileForLead(
  lead: Pick<Lead, "industry" | "business_name" | "persona" | "vertical_slug" | "icp_category">,
  artifact?: Pick<Artifact, "vertical_profile"> | null,
  services: string[] = []
): VerticalProfile {
  return resolveVerticalSync(lead, artifact, services).profile;
}

/**
 * The full router, including the generated fallback.
 *
 * resolveVerticalSync answers from what is already in hand and is what render
 * paths use. This one may reach the database, and may write a profile — so it
 * belongs in the scrape and the build, never in a page render.
 *
 * The order is the same, with two steps appended: a profile generated earlier
 * for this industry, then one written now. Everything structural is inherited
 * from a curated base either way; see generate-profile.ts for why.
 */
export async function resolveVerticalAsync(
  lead: Pick<Lead, "industry" | "business_name" | "persona" | "vertical_slug" | "icp_category">,
  artifact?: Pick<Artifact, "vertical_profile"> | null,
  services: string[] = []
): Promise<VerticalResolution> {
  const sync = resolveVerticalSync(lead, artifact, services);

  // Anything the sync path recognised is already right. Only the fallback —
  // "nothing matched, here is home-services" — is worth spending a model call
  // on, and that fallback is precisely what made every unrecognised business
  // read like a trade.
  if (sync.source !== "fallback") return sync;

  const chosen = lead.vertical_slug ?? "";
  if (chosen.startsWith("gen:")) {
    const cached = await loadGeneratedProfile(chosen);
    if (cached) return { ...sync, profile: cached, source: "cached" };
  }

  const industry = (lead.industry ?? "").trim();
  if (!industry) return sync;

  const slug = `gen:${industryKey(industry)}`;
  const cached = await loadGeneratedProfile(slug);
  if (cached) return { ...sync, profile: cached, source: "cached" };

  const generated = await generateProfileFor(industry);
  return {
    ...sync,
    profile: generated,
    source: generated.origin === "generated" ? "generated" : "fallback",
  };
}
