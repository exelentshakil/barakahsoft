import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState } from "@/components/ui/empty-state";
import { AddUrlDialog } from "@/components/admin/AddUrlDialog";
import { LeadsTable } from "@/components/admin/LeadsTable";

export default async function AdminLeadsPage() {
  // Service-role client — `leads` has RLS enabled with zero policies, so the
  // session-bound client (which respects RLS) silently returns nothing here.
  const supabase = createAdminClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, business_name, contact_name, source_url, source, help_needed, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Leads</h1>
        <AddUrlDialog />
      </div>

      {!leads || leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          body="Leads land here the moment someone submits the landing page intake form, or you add a URL manually."
        />
      ) : (
        <LeadsTable leads={leads} />
      )}
    </div>
  );
}
