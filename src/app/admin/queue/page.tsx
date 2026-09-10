import { requireOperator } from "@/lib/tenant-scope";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewQueue, type QueueRow } from "@/components/admin/ReviewQueue";
import type { Lead } from "@/types/database";

// The review gate between an unattended build and a real prospect.
//
// Builds run on their own and land here. Nothing is sent from this app — an
// approval marks an artifact fit to send and the outreach tool takes it from
// there — but nothing reaches a business owner without an operator having
// looked at it first, because a bad mockup burns that lead permanently.

export const dynamic = "force-dynamic";

interface Row {
  lead_id: string;
  review_state: string | null;
  audit_report: { score?: number; repairs?: number; previewUrl?: string | null; findings?: Array<{ check: string; severity: string; detail: string }> } | null;
  design_system: { prd?: { idea?: string; sections?: unknown[] } } | null;
  bespoke_homepage_html: string | null;
  updated_at?: string | null;
}

export default async function ReviewQueuePage() {
  const ctx = await requireOperator();
  const supabase = createAdminClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("id, business_name, industry, slug, source_url")
    .eq("tenant_slug", ctx?.tenantSlug ?? "__none__")
    .returns<Pick<Lead, "id" | "business_name" | "industry" | "slug" | "source_url">[]>();

  const byId = new Map((leads ?? []).map((lead) => [lead.id, lead]));

  const { data: artifacts } = await supabase
    .from("artifacts")
    .select("lead_id, review_state, audit_report, design_system, bespoke_homepage_html, updated_at")
    .in("lead_id", [...byId.keys()].slice(0, 500))
    .not("bespoke_homepage_html", "is", null)
    .order("updated_at", { ascending: false })
    .returns<Row[]>();

  const rows: QueueRow[] = (artifacts ?? [])
    .map((artifact): QueueRow | null => {
      const lead = byId.get(artifact.lead_id);
      if (!lead) return null;
      return {
        leadId: artifact.lead_id,
        businessName: lead.business_name ?? "Unnamed",
        industry: lead.industry ?? "",
        slug: lead.slug,
        websiteUrl: lead.source_url ?? null,
        state: artifact.review_state ?? "pending",
        score: artifact.audit_report?.score ?? null,
        repairs: artifact.audit_report?.repairs ?? 0,
        previewUrl: artifact.audit_report?.previewUrl ?? null,
        idea: artifact.design_system?.prd?.idea ?? null,
        sectionCount: Array.isArray(artifact.design_system?.prd?.sections) ? artifact.design_system!.prd!.sections!.length : null,
        findings: (artifact.audit_report?.findings ?? []).filter((finding) => finding.severity !== "note").slice(0, 4),
      };
    })
    .filter((row): row is QueueRow => row !== null);

  return <ReviewQueue rows={rows} />;
}
