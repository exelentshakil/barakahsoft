import { requireOperator } from "@/lib/tenant-scope";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { LeadDetail } from "@/components/admin/LeadDetail";
import { leadCost } from "@/lib/cost/lead-cost";
import { buildSiteBrief } from "@/lib/build-site-brief";
import { resolveLogoUrl, resolveFooterLogoUrl } from "@/lib/brand-assets";
import type { BriefFields } from "@/components/admin/BriefPanel";
import type { ListingState } from "@/components/admin/GoogleListing";
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

  const assets = (artifact?.extracted_assets ?? {}) as Record<string, unknown>;
  const overrides = (assets.brief_overrides ?? {}) as Record<string, unknown>;
  const brief = scrapeResults ? buildSiteBrief(lead, scrapeResults, overrides) : null;
  const facts = (scrapeResults?.facts ?? {}) as Record<string, unknown>;

  // Pre-filled from what the brief actually resolved to, not from the override
  // alone — so the operator sees the real value the page would be built with
  // and only has to touch the ones that are wrong.
  const briefFields: BriefFields = {
    businessName: brief?.businessName ?? lead.business_name ?? "",
    founder: brief?.founder ?? "",
    city: brief?.city === "the local area" ? "" : brief?.city ?? "",
    industry: brief?.industry ?? lead.industry ?? "",
    aboutContent: brief?.aboutContent ?? "",
    services: (brief?.services ?? []).join("\n"),
    areas: (brief?.areas ?? []).join("\n"),
    logoUrl: resolveLogoUrl(assets, facts) ?? "",
    footerLogoUrl: resolveFooterLogoUrl(assets, facts) ?? "",
    heroImage: brief?.heroImage ?? "",
    brandHex:
      (typeof overrides.brandHex === "string" ? overrides.brandHex : "") ||
      (typeof facts.brand_color_hex === "string" ? facts.brand_color_hex : ""),
  };

  // What is actually available to build with, not how many URLs the scrape saw.
  //
  // The panel reported brief.photos.length — every image URL found on the site,
  // most of them thumbnails too small to use. It said "24 usable" for a lead
  // that had eight, which is exactly the wrong direction for a number whose job
  // is to warn you the page will be thin.
  const { count: photoCount } = await supabase
    .from("media_assets")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", id)
    .eq("usable", true);

  const places = (scrapeResults?.places_raw ?? null) as {
    name?: string;
    formatted_address?: string;
    rating?: number;
    user_ratings_total?: number;
    reviews?: unknown[];
  } | null;

  const listing: ListingState = {
    placeId: (typeof facts.place_id === "string" ? facts.place_id : null) ?? lead.place_id ?? null,
    name: places?.name ?? null,
    address: places?.formatted_address ?? null,
    rating: typeof facts.rating === "number" ? facts.rating : places?.rating ?? null,
    reviewCount:
      typeof facts.review_count === "number" ? facts.review_count : places?.user_ratings_total ?? null,
    reviewsPulled: Array.isArray(facts.reviews) ? facts.reviews.length : 0,
    pinned: facts.place_pinned === true,
  };

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
      briefFields={briefFields}
      listing={listing}
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
          photos: photoCount ?? 0,
        }
      }
      costUsd={(await leadCost(lead.id)).costUsd}
    />
  );
}
