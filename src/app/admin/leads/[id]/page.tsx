import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminLeadWorkspace } from "@/components/admin/AdminLeadWorkspace";
import type { Lead, Artifact, ScrapeResults } from "@/types/database";

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

  return (
    <AdminLeadWorkspace
      lead={lead}
      artifact={artifact ?? null}
      scrapeResults={scrapeResults ?? null}
      otherLeads={sortedLeads}
    />
  );
}
