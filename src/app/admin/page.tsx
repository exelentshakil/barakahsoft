import { requireOperator } from "@/lib/tenant-scope";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState } from "@/components/ui/empty-state";
import { AddUrlDialog } from "@/components/admin/AddUrlDialog";
import { AdminLeadWorkspace } from "@/components/admin/AdminLeadWorkspace";
import { leadCost } from "@/lib/cost/lead-cost";
import type { Lead, Artifact, ScrapeResults } from "@/types/database";

// Live operator data, and the workspace reads its active tab from the query
// string — both make a prerendered copy wrong. Marked dynamic explicitly so
// that stays true regardless of what the page happens to import.
export const dynamic = "force-dynamic";
export default async function AdminLeadsPage() {
  // Scoped to the signed-in operator's brand. Middleware has already refused
  // anyone without an accounts row for this host's tenant, so a null context
  // here means the session lapsed between the two.
  const ctx = await requireOperator();
  const supabase = createAdminClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("tenant_slug", ctx?.tenantSlug ?? "__none__")
    .order("created_at", { ascending: false })
    .returns<Lead[]>();

  const all = leads ?? [];
  // Show inbound submissions at the top; manual outreach at the bottom
  const rows = [
    ...all.filter((l) => l.source !== "outreach" && l.source !== "manual"),
    ...all.filter((l) => l.source === "outreach" || l.source === "manual"),
  ];

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Leads Workspace</h1>
            <p className="mt-1 text-sm text-muted-foreground">No leads submitted yet. Submit a URL on the landing page or add one manually below.</p>
          </div>
          <AddUrlDialog />
        </div>
        <EmptyState
          title="No leads yet"
          body="Leads land here the moment someone submits the intake form."
        />
      </div>
    );
  }

  // Load active first lead's artifacts & scrape facts for the linear studio
  const activeLead = rows[0];
  const [{ data: artifact }, { data: scrapeResults }] = await Promise.all([
    supabase.from("artifacts").select("*").eq("lead_id", activeLead.id).maybeSingle<Artifact>(),
    supabase.from("scrape_results").select("*").eq("lead_id", activeLead.id).maybeSingle<ScrapeResults>(),
  ]);

  const cost = await leadCost(activeLead.id);

  return (
    <AdminLeadWorkspace
      lead={activeLead}
      artifact={artifact ?? null}
      scrapeResults={scrapeResults ?? null}
      otherLeads={rows}
      cost={cost}
    />
  );
}
