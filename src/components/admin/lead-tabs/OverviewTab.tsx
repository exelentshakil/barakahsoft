import { Phone, Mail, Globe, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DomainManager } from "@/components/admin/DomainManager";
import { PricingManager } from "@/components/admin/PricingManager";
import type { Lead, Artifact } from "@/types/database";

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function OverviewTab({ lead, artifact }: { lead: Lead; artifact?: Artifact | null }) {
  const pricing = (artifact?.extracted_assets?.pricing as any) ?? null;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card>
        <CardContent className="divide-y divide-border p-4">
          <Row icon={Globe} label="Website" value={lead.source_url} />
          <Row icon={Phone} label="Phone" value={lead.phone} />
          <Row icon={Mail} label="Email" value={lead.email} />
          <Row icon={Calendar} label="Submitted" value={new Date(lead.created_at).toLocaleString()} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium">Pipeline</p>
          {[
            { label: "Delivered", value: lead.delivered_at },
            { label: "Paid", value: lead.paid_at },
            { label: "Live", value: lead.live_at },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <span className={s.value ? "font-medium" : "text-muted-foreground"}>
                {s.value ? new Date(s.value).toLocaleDateString() : "Not yet"}
              </span>
            </div>
          ))}
          {lead.pain_points.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">Pain points mentioned</p>
              <p className="mt-1 text-sm">{lead.pain_points.join(", ")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="sm:col-span-2">
        <PricingManager leadId={lead.id} currentPricing={pricing} />
      </div>

      <div className="sm:col-span-2">
        <DomainManager lead={lead} />
      </div>
    </div>
  );
}
