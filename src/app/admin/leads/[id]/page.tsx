import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
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
import { personaLabel } from "@/lib/personas";

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

  const [{ data: artifact }, { data: scrapeResults }, { data: closePlanSteps }, { data: subscription }] = await Promise.all([
    supabase.from("artifacts").select("*").eq("lead_id", id).single<Artifact>(),
    supabase.from("scrape_results").select("*").eq("lead_id", id).single<ScrapeResults>(),
    supabase.from("close_plan_steps").select("*").eq("lead_id", id).returns<ClosePlanStep[]>(),
    supabase.from("subscriptions").select("status, stripe_subscription_id, created_at").eq("lead_id", id).maybeSingle(),
  ]);

  const facts = (scrapeResults?.facts ?? {}) as Record<string, unknown>;
  const competitors = (facts.competitors as CompetitorCandidate[]) ?? [];
  const designBrief = (facts.design_brief as string) ?? "";
  const address = (facts.nap as { address?: string } | undefined)?.address ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{lead.business_name || lead.contact_name || lead.source_url}</h1>
          <p className="text-sm text-muted-foreground">{lead.source_url}</p>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={`/s/${lead.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#533afd] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#432bd9] mr-1"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Customer Proposal Portal
          </a>
          <Badge variant="outline">{lead.status}</Badge>
          <Badge variant="secondary">{lead.source}</Badge>
          {/* v4 Phase R2 — operator context for closing-script personalization,
              distinct from the AI-inferred industry badge shown elsewhere. */}
          {personaLabel(lead.persona) && <Badge variant="outline">{personaLabel(lead.persona)}</Badge>}
          <EditLeadDialog
            leadId={lead.id}
            businessName={lead.business_name}
            sourceUrl={lead.source_url}
            facebookPixelId={lead.facebook_pixel_id}
            googleSiteVerification={lead.google_site_verification}
          />
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
      <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <span className="font-medium">Lead Engine billing:</span>{" "}
        <span className={subscription?.status === "active" ? "font-semibold text-success" : "text-muted-foreground"}>
          {subscription?.status === "active" ? "Active — $500/week" : subscription?.status || "Not active"}
        </span>
        {subscription?.created_at && <span className="ml-2 text-muted-foreground">since {new Date(subscription.created_at).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}
