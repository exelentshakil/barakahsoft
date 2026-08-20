import { createAdminClient } from "@/lib/supabase/admin";
import { renderShell } from "@/lib/render-shell";
import type { SitePayload } from "@/components/site-shell/types";
import type { Lead, Artifact, ScrapeResults, MediaAsset } from "@/types/database";

// Shared by the homepage, the standalone service/area routes, and
// sitemap.ts/robots.ts — one fetch, one place that knows the join shape.
export async function getSiteData(
  leadSlug: string
): Promise<{ payload: SitePayload; lead: Lead; scrapeResults: ScrapeResults; artifact: Artifact } | null> {
  const admin = createAdminClient();

  const { data: lead } = await admin.from("leads").select("*").eq("slug", leadSlug).single<Lead>();
  if (!lead) return null;

  const { data: artifact } = await admin.from("artifacts").select("*").eq("lead_id", lead.id).single<Artifact>();
  if (!artifact) return null;

  const { data: scrapeResults } = await admin.from("scrape_results").select("*").eq("lead_id", lead.id).single<ScrapeResults>();
  if (!scrapeResults) return null;

  const { data: mediaAssets } = await admin.from("media_assets").select("*").eq("lead_id", lead.id).returns<MediaAsset[]>();

  const payload = renderShell(lead, artifact, scrapeResults, mediaAssets ?? []);
  return { payload, lead, scrapeResults, artifact };
}
