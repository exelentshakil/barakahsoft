import { createAdminClient } from "@/lib/supabase/admin";
import { renderShell } from "@/lib/render-shell";
import type { SitePayload } from "@/components/site-shell/types";
import type { Lead, Artifact, ScrapeResults, MediaAsset } from "@/types/database";

// Shared by the homepage, the standalone service/area routes, and
// sitemap.ts/robots.ts — one fetch, one place that knows the join shape.
//
// Returning null means "no site data yet", which is NOT the same as "no such
// lead". Callers must distinguish: a real lead whose build has not finished
// deserves a progress page, and 404ing it meant a client who followed their
// link early concluded the whole thing was broken.
export async function getSiteData(
  leadSlug: string
): Promise<{ payload: SitePayload; lead: Lead; scrapeResults: ScrapeResults; artifact: Artifact } | null> {
  const admin = createAdminClient();

  const { data: lead } = await admin.from("leads").select("*").eq("slug", leadSlug).maybeSingle<Lead>();
  if (!lead) return null;

  const { data: artifact } = await admin.from("artifacts").select("*").eq("lead_id", lead.id).maybeSingle<Artifact>();
  if (!artifact) return null;

  const { data: scrapeResults } = await admin.from("scrape_results").select("*").eq("lead_id", lead.id).maybeSingle<ScrapeResults>();
  if (!scrapeResults) return null;

  const { data: mediaAssets } = await admin.from("media_assets").select("*").eq("lead_id", lead.id).returns<MediaAsset[]>();

  const payload = renderShell(lead, artifact, scrapeResults, mediaAssets ?? []);
  return { payload, lead, scrapeResults, artifact };
}

/** Whether a slug belongs to a real lead, and how far its build has got. */
export async function getLeadProgress(
  leadSlug: string
): Promise<{ lead: Lead; analysed: boolean; built: boolean } | null> {
  const admin = createAdminClient();

  const { data: lead } = await admin.from("leads").select("*").eq("slug", leadSlug).maybeSingle<Lead>();
  if (!lead) return null;

  const [{ data: scrape }, { data: artifact }] = await Promise.all([
    admin.from("scrape_results").select("id").eq("lead_id", lead.id).maybeSingle(),
    admin.from("artifacts").select("bespoke_homepage_html").eq("lead_id", lead.id).maybeSingle<{ bespoke_homepage_html: string | null }>(),
  ]);

  return { lead, analysed: !!scrape, built: !!artifact?.bespoke_homepage_html };
}
