import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminLeadWorkspace } from "@/components/admin/AdminLeadWorkspace";
import type { Lead, Artifact, ScrapeResults } from "@/types/database";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: lead }, { data: otherLeads }, { data: artifact }, { data: scrapeResults }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).single<Lead>(),
    supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(20).returns<Lead[]>(),
    supabase.from("artifacts").select("*").eq("lead_id", id).single<Artifact>(),
    supabase.from("scrape_results").select("*").eq("lead_id", id).single<ScrapeResults>(),
  ]);

  if (!lead) notFound();

  return (
    <AdminLeadWorkspace
      lead={lead}
      artifact={artifact ?? null}
      scrapeResults={scrapeResults ?? null}
      otherLeads={otherLeads ?? []}
    />
  );
}
