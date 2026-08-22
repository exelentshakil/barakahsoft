import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { auditCurrentSite } from "@/lib/audit/site-audit";
import { benchmarkCompetitors, type CompetitorBenchmark } from "@/lib/audit/competitors";
import type { Lead, ScrapeResults } from "@/types/database";

export const maxDuration = 300;

// The SEO audit and the competitor benchmark.
//
// The audit is free: every finding comes from the crawl and PageSpeed run
// already paid for during analysis, so it is computed on read rather than
// stored. The benchmark costs a search and a few API calls, so it is
// explicit and cached once measured.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: lead }, { data: scrape }] = await Promise.all([
    admin.from("leads").select("*").eq("id", leadId).single<Lead>(),
    admin.from("scrape_results").select("*").eq("lead_id", leadId).maybeSingle<ScrapeResults>(),
  ]);

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!scrape) return NextResponse.json({ audit: null, competitors: null, analysed: false });

  const facts = scrape.facts as Record<string, unknown>;

  const audit = auditCurrentSite({
    facts,
    pagespeedMobile: scrape.pagespeed_mobile,
    businessName: lead.business_name ?? "",
    city: (facts.town as string) ?? null,
    services: (facts.derived_services as string[]) ?? [],
    rating: (facts.rating as number) ?? null,
    reviewCount: (facts.review_count as number) ?? null,
  });

  return NextResponse.json({
    analysed: true,
    audit,
    competitors: (scrape.competitors as CompetitorBenchmark | null) ?? null,
  });
}

/** Measure competitors. Explicit, because it costs a search and API calls. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: lead }, { data: scrape }] = await Promise.all([
    admin.from("leads").select("*").eq("id", leadId).single<Lead>(),
    admin.from("scrape_results").select("*").eq("lead_id", leadId).maybeSingle<ScrapeResults>(),
  ]);

  if (!lead || !scrape) {
    return NextResponse.json({ error: "Analyse this lead first" }, { status: 409 });
  }

  const facts = scrape.facts as Record<string, unknown>;
  const city = (facts.town as string) ?? null;
  const trade = lead.industry ?? null;

  if (!trade || !city) {
    return NextResponse.json(
      { error: "The lead needs an industry and a city before competitors can be found." },
      { status: 409 }
    );
  }

  const benchmark = await benchmarkCompetitors(leadId, trade, city, {
    name: lead.business_name ?? city,
    website: lead.source_url,
    rating: (facts.rating as number) ?? null,
    reviewCount: (facts.review_count as number) ?? null,
    speedScore: (scrape.pagespeed_mobile?.score as number) ?? null,
  });

  if (!benchmark) {
    return NextResponse.json(
      { error: "No usable competitors were found for that trade and city." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, competitors: benchmark });
}
