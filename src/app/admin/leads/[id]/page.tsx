import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { LeadDetailTabs } from "@/components/admin/LeadDetailTabs";
import { OverviewTab } from "@/components/admin/lead-tabs/OverviewTab";
import { RedesignTab } from "@/components/admin/lead-tabs/RedesignTab";
import { AuditTab } from "@/components/admin/lead-tabs/AuditTab";
import { MapGridTab } from "@/components/admin/lead-tabs/MapGridTab";
import { CompetitorsTab } from "@/components/admin/lead-tabs/CompetitorsTab";
import { HowToCloseTab } from "@/components/admin/lead-tabs/HowToCloseTab";
import { EditLeadDialog } from "@/components/admin/EditLeadDialog";
import { DeleteLeadButton } from "@/components/admin/DeleteLeadButton";
import { Badge } from "@/components/ui/badge";
import type { Lead, Artifact, ScrapeResults, ClosePlanStep } from "@/types/database";
import type { CompetitorCandidate } from "@/lib/google/places";

// Six lead tabs (Overview, Redesign, Audit, Map grid, Competitors, How to
// close) — everything an operator needs for one lead in one place, per the
// atomic breakdown's admin page spec.
export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Service-role client — these tables have RLS enabled with zero policies,
  // so the session-bound client (which respects RLS) silently returns nothing.
  const supabase = createAdminClient();

  const { data: lead } = await supabase.from("leads").select("*").eq("id", id).single<Lead>();
  if (!lead) notFound();

  const [{ data: artifact }, { data: scrapeResults }, { data: closePlanSteps }] = await Promise.all([
    supabase.from("artifacts").select("*").eq("lead_id", id).single<Artifact>(),
    supabase.from("scrape_results").select("*").eq("lead_id", id).single<ScrapeResults>(),
    supabase.from("close_plan_steps").select("*").eq("lead_id", id).returns<ClosePlanStep[]>(),
  ]);

  const facts = (scrapeResults?.facts ?? {}) as Record<string, unknown>;
  const competitors = (facts.competitors as CompetitorCandidate[]) ?? [];
  const designBrief = (facts.design_brief as string) ?? "";
  const address = (facts.nap as { address?: string } | undefined)?.address ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{lead.business_name || lead.source_url}</h1>
          <p className="text-sm text-muted-foreground">{lead.source_url}</p>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline">{lead.status}</Badge>
          <EditLeadDialog leadId={lead.id} businessName={lead.business_name} sourceUrl={lead.source_url} />
          <DeleteLeadButton leadId={lead.id} />
        </div>
      </div>

      <LeadDetailTabs
        tabs={[
          { id: "overview", label: "Overview", content: <OverviewTab lead={lead} /> },
          { id: "redesign", label: "Redesign", content: <RedesignTab lead={lead} artifact={artifact ?? null} /> },
          { id: "audit", label: "Audit", content: await AuditTab({ scrapeResults: scrapeResults ?? null }) },
          {
            id: "map",
            label: "Map grid",
            content: <MapGridTab address={address} competitors={competitors} />,
          },
          { id: "competitors", label: "Competitors", content: <CompetitorsTab competitors={competitors} designBrief={designBrief} /> },
          { id: "close", label: "How to close", content: <HowToCloseTab steps={closePlanSteps ?? []} /> },
        ]}
      />
    </div>
  );
}
