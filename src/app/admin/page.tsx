import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState } from "@/components/ui/empty-state";
import { AddUrlDialog } from "@/components/admin/AddUrlDialog";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminLeadsPage() {
  // Service-role client — `leads` has RLS enabled with zero policies, so the
  // session-bound client (which respects RLS) silently returns nothing here.
  const supabase = createAdminClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, business_name, contact_name, source_url, source, help_needed, status, created_at, slug, paid_at, delivered_at")
    .order("created_at", { ascending: false });

  const rows = leads ?? [];
  const active = rows.filter((lead) => !["lost", "live"].includes(lead.status)).length;
  const ready = rows.filter((lead) => ["ready", "qa_approved", "delivered"].includes(lead.status)).length;
  const paid = rows.filter((lead) => !!lead.paid_at).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review research, open client portals, and move qualified leads toward payment.</p>
        </div>
        <AddUrlDialog />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active leads</p><p className="mt-1 text-2xl font-semibold">{active}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ready for review</p><p className="mt-1 text-2xl font-semibold">{ready}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Paid</p><p className="mt-1 text-2xl font-semibold">{paid}</p></CardContent></Card>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No leads yet"
          body="Leads land here the moment someone submits the landing page intake form, or you add a URL manually."
        />
      ) : (
        <LeadsTable leads={rows} />
      )}
    </div>
  );
}
