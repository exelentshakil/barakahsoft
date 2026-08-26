import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminLeadWorkspace } from "@/components/admin/AdminLeadWorkspace";
import { leadCost } from "@/lib/cost/lead-cost";
import type { Lead, Artifact, ScrapeResults } from "@/types/database";

// Live operator data, and the workspace reads its active tab from the query
// string — both make a prerendered copy wrong. Marked dynamic explicitly so
// that stays true regardless of what the page happens to import.
export const dynamic = "force-dynamic";
export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: lead }, { data: otherLeads }, { data: artifact }, { data: scrapeResults }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).maybeSingle<Lead>(),
    supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(20).returns<Lead[]>(),
    // maybeSingle, not single: a lead that has not been analysed yet has
    // neither row, and .single() throws — which turned every brand-new lead
    // into a 500 on its own detail page.
    supabase.from("artifacts").select("*").eq("lead_id", id).maybeSingle<Artifact>(),
    supabase.from("scrape_results").select("*").eq("lead_id", id).maybeSingle<ScrapeResults>(),
  ]);

  if (!lead) notFound();

  const all = otherLeads ?? [];
  const sortedLeads = [
    ...all.filter((l) => l.source !== "outreach" && l.source !== "manual"),
    ...all.filter((l) => l.source === "outreach" || l.source === "manual"),
  ];

  const cost = await leadCost(lead.id);

  const { data: viewsData } = await supabase.from("lead_inquiries").select("created_at").eq("lead_id", id).eq("channel", "proposal_view").order("created_at", { ascending: false });
  const proposalViews = viewsData?.map(v => v.created_at) || [];


  return (
    <AdminLeadWorkspace
      lead={lead}
      artifact={artifact ?? null}
      scrapeResults={scrapeResults ?? null}
      otherLeads={sortedLeads}
      cost={cost}
      proposalViews={proposalViews}
    />
  );
}
