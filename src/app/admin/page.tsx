import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AddUrlDialog } from "@/components/admin/AddUrlDialog";

export default async function AdminLeadsPage() {
  // Service-role client — `leads` has RLS enabled with zero policies, so the
  // session-bound client (which respects RLS) silently returns nothing here.
  const supabase = createAdminClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, business_name, source_url, status, created_at")
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
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {leads.map((lead) => (
              <Link key={lead.id} href={`/admin/leads/${lead.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-accent">
                <div>
                  <p className="font-medium">{lead.business_name || lead.source_url}</p>
                  <p className="text-sm text-muted-foreground">{lead.source_url}</p>
                </div>
                <Badge variant="outline">{lead.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
