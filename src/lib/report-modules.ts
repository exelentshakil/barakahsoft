import { auditCurrentSite, type SiteAudit } from "@/lib/audit/site-audit";
import type { CompetitorBenchmark } from "@/lib/audit/competitors";
import type { Lead, ScrapeResults } from "@/types/database";

// Which parts of the client report actually apply to this business.
//
// The portal used to render a fixed set of panels filled with hardcoded
// data — the same forty-nine Queens neighbourhoods and the same invented
// competitors, shown to every client regardless of trade or geography. A
// Philadelphia roofer and a national agency both received a map of Queens.
//
// The replacement is not a different fixed report. It is a set of modules,
// each of which renders only when two things are true: there is real
// measured data behind it, and it is relevant to this kind of business.
//
// That second condition matters as much as the first. A forty-nine point
// local search grid is the most persuasive thing you can show a roofer and
// completely meaningless to an agency that serves clients anywhere — and an
// empty grid reads as broken rather than as inapplicable. A shorter report
// for a national business is correct: less applies to them.

export interface ReportModules {
  /** Whether this business competes geographically at all. */
  isLocal: boolean;

  // ---- Universal: every business, when the data exists ----------------
  audit: SiteAudit | null;
  speed: { score: number; lcpSeconds: number | null } | null;
  /** Pages Google currently has to rank. */
  contentDepth: { pageCount: number; services: string[] } | null;
  competitors: CompetitorBenchmark | null;

  // ---- Local businesses only ------------------------------------------
  visibility: {
    cells: { area: string; rank: number | null; topCompetitor: string | null }[];
    visible: number;
    missing: number;
    dominant: number;
  } | null;
  /** Real reviews the current site never mentions. */
  reviewsGap: { rating: number; reviewCount: number; mentionedOnSite: boolean } | null;
  serviceAreas: string[];

  /** True when nothing measurable exists — the report should not be sent. */
  isEmpty: boolean;
}

export function buildReportModules(
  lead: Lead,
  scrape: ScrapeResults | null
): ReportModules {
  if (!scrape) {
    return {
      isLocal: false,
      audit: null,
      speed: null,
      contentDepth: null,
      competitors: null,
      visibility: null,
      reviewsGap: null,
      serviceAreas: [],
      isEmpty: true,
    };
  }

  const facts = scrape.facts as Record<string, unknown>;
  const city = (facts.town as string) ?? null;
  const rating = (facts.rating as number) ?? null;
  const reviewCount = (facts.review_count as number) ?? null;
  const services = (facts.derived_services as string[]) ?? [];
  const areas = (facts.derived_areas as string[]) ?? [];

  // Classification decides this. Where it has not run, a business with a
  // town and a Google listing is treated as local, which is the safer
  // default: showing a local module to a national business is a smaller
  // error than hiding the map from a roofer.
  const isLocal =
    typeof facts.is_local_business === "boolean"
      ? (facts.is_local_business as boolean)
      : !!(city && reviewCount);

  const audit = auditCurrentSite({
    facts,
    pagespeedMobile: scrape.pagespeed_mobile,
    businessName: lead.business_name ?? "",
    city,
    services,
    rating,
    reviewCount,
  });

  const score = typeof scrape.pagespeed_mobile?.score === "number" ? (scrape.pagespeed_mobile.score as number) : null;
  const lcpMs = typeof scrape.pagespeed_mobile?.lcp_ms === "number" ? (scrape.pagespeed_mobile.lcp_ms as number) : null;

  const pageCount = Math.max(
    Array.isArray(facts.pages) ? (facts.pages as unknown[]).length : 0,
    Array.isArray(facts.sitemap_urls) ? (facts.sitemap_urls as unknown[]).length : 0
  );

  const homepageText =
    (Array.isArray(facts.pages) ? ((facts.pages as { bodyText?: string }[])[0]?.bodyText ?? "") : "") || "";

  const visibilityRaw = scrape.search_visibility;

  const modules: ReportModules = {
    isLocal,
    audit: audit.findings.length > 0 ? audit : null,
    speed: score !== null ? { score, lcpSeconds: lcpMs ? Number((lcpMs / 1000).toFixed(1)) : null } : null,
    contentDepth: pageCount > 0 ? { pageCount, services } : null,
    competitors: (scrape.competitors as CompetitorBenchmark | null) ?? null,

    // Geography-dependent modules are withheld from businesses that do not
    // compete geographically, even when the data happens to exist.
    visibility:
      isLocal && visibilityRaw && visibilityRaw.cells.length >= 3
        ? {
            cells: visibilityRaw.cells.map((c) => ({
              area: c.area,
              rank: c.rank,
              topCompetitor: c.topCompetitor,
            })),
            visible: visibilityRaw.visible,
            missing: visibilityRaw.missing,
            dominant: visibilityRaw.dominant,
          }
        : null,

    reviewsGap:
      isLocal && rating && reviewCount
        ? {
            rating,
            reviewCount,
            // The gap IS the pitch: strong proof the site never mentions.
            mentionedOnSite: /\b(review|rating|star)/i.test(homepageText),
          }
        : null,

    serviceAreas: isLocal ? areas : [],
    isEmpty: false,
  };

  modules.isEmpty =
    !modules.audit && !modules.speed && !modules.competitors && !modules.visibility && !modules.reviewsGap;

  return modules;
}
