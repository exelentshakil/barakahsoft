import { requireOperator } from "@/lib/tenant-scope";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { LeadDetail } from "@/components/admin/LeadDetail";
import { leadCost } from "@/lib/cost/lead-cost";
import { buildSiteBrief } from "@/lib/build-site-brief";
import type { Lead, Artifact, ScrapeResults } from "@/types/database";

// One lead, top to bottom, no tabs.
//
// The mockup, the brief it was built from, the photographs, a rebuild button
// and the email that will go out. What stood here was the same eight-tab
// workspace as /admin, which meant the two screens were indistinguishable and
// neither one told you what to do next.
export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 404 rather than 403 on a cross-tenant id: a 403 confirms the row exists.
  const ctx = await requireOperator();
  if (!ctx) notFound();

  const supabase = createAdminClient();
  const [{ data: lead }, { data: artifact }, { data: scrapeResults }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).eq("tenant_slug", ctx.tenantSlug).maybeSingle<Lead>(),
    // maybeSingle, not single: a lead that has not been built yet has neither
    // row, and .single() turned every new lead into a 500 on its own page.
    supabase.from("artifacts").select("*").eq("lead_id", id).maybeSingle<Artifact>(),
    supabase.from("scrape_results").select("*").eq("lead_id", id).maybeSingle<ScrapeResults>(),
  ]);

  if (!lead) notFound();

  const overrides = ((artifact?.extracted_assets as Record<string, unknown> | null)?.brief_overrides ?? {}) as Record<string, unknown>;
  const brief = scrapeResults ? buildSiteBrief(lead, scrapeResults, overrides) : null;

  return (
    <LeadDetail
      lead={{
        id: lead.id,
        name: lead.business_name,
        sourceUrl: lead.source_url,
        email: lead.email,
        industry: lead.industry,
        status: lead.status,
        draft: (lead.outreach_draft ?? null) as Record<string, unknown> | null,
      }}
      hasPage={!!artifact?.bespoke_homepage_html}
      rationale={artifact?.bespoke_rationale ?? null}
      analysed={!!scrapeResults}
      brief={
        brief && {
          businessName: brief.businessName,
          city: brief.city,
          industry: brief.industry,
          phone: brief.phone,
          services: brief.services,
          areas: brief.areas,
          rating: brief.rating,
          reviewCount: brief.reviewCount,
          photos: brief.photos.length,
        }
      }
      costUsd={(await leadCost(lead.id)).costUsd}
    />
  );
}
