import { requireOperator } from "@/lib/tenant-scope";
import { createAdminClient } from "@/lib/supabase/admin";
import { Pipeline, type PipelineRow } from "@/components/admin/Pipeline";
import type { Lead } from "@/types/database";

// The pipeline.
//
// One table, one job: see where every lead is, and push one along if you do not
// want to wait for the hour. What stood here was an eight-tab workspace that
// loaded the first lead in the list and hid everything else behind a query
// string — a screen that could only ever be about one lead, on a page whose
// name is plural.
export const dynamic = "force-dynamic";

export default async function AdminPipelinePage() {
  const ctx = await requireOperator();
  const supabase = createAdminClient();
  const tenant = ctx?.tenantSlug ?? "__none__";

  const { data: leads } = await supabase
    .from("leads")
    .select("id, business_name, source_url, email, status, created_at, delivered_at, outreach_stage")
    .eq("tenant_slug", tenant)
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<Pick<Lead, "id" | "business_name" | "source_url" | "email" | "status" | "created_at" | "delivered_at" | "outreach_stage">[]>();

  const rows = leads ?? [];

  // Which leads actually have a page. Selected as ids rather than joined, so a
  // list of five hundred never pulls five hundred generated documents.
  const { data: built } = await supabase
    .from("artifacts")
    .select("lead_id")
    .not("bespoke_homepage_html", "is", null)
    .returns<{ lead_id: string }[]>();

  const hasPage = new Set((built ?? []).map((b) => b.lead_id));

  const pipeline: PipelineRow[] = rows.map((lead) => ({
    id: lead.id,
    name: lead.business_name || hostOf(lead.source_url),
    host: hostOf(lead.source_url),
    sourceUrl: lead.source_url,
    email: lead.email,
    status: lead.status,
    built: hasPage.has(lead.id),
    sentAt: lead.delivered_at,
    createdAt: lead.created_at,
  }));

  return <Pipeline rows={pipeline} />;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
