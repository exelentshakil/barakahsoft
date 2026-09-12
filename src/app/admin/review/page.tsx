import { requireOperator } from "@/lib/tenant-scope";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewGrid, type ReviewCard } from "@/components/admin/ReviewGrid";
import type { Lead } from "@/types/database";

// The screen that gets used every day.
//
// Everything built and not yet sent, as real pages rather than thumbnails of
// pages. Look, untick the ones that did not come out well, send the rest.
export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const ctx = await requireOperator();
  const supabase = createAdminClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("id, business_name, source_url, email, status, outreach_draft, created_at")
    .eq("tenant_slug", ctx?.tenantSlug ?? "__none__")
    .is("delivered_at", null)
    .order("created_at", { ascending: false })
    .limit(120)
    .returns<Pick<Lead, "id" | "business_name" | "source_url" | "email" | "status" | "outreach_draft" | "created_at">[]>();

  const rows = leads ?? [];
  if (rows.length === 0) return <ReviewGrid cards={[]} />;

  // Only the ids — the documents themselves are fetched by each card's iframe,
  // so a page of thirty mockups is not thirty documents in the RSC payload.
  const { data: built } = await supabase
    .from("artifacts")
    .select("lead_id")
    .in("lead_id", rows.map((r) => r.id))
    .not("bespoke_homepage_html", "is", null)
    .returns<{ lead_id: string }[]>();

  const hasPage = new Set((built ?? []).map((b) => b.lead_id));

  const cards: ReviewCard[] = rows
    .filter((lead) => hasPage.has(lead.id))
    .map((lead) => ({
      id: lead.id,
      name: lead.business_name || hostOf(lead.source_url),
      host: hostOf(lead.source_url),
      email: lead.email,
      draft: lead.outreach_draft ?? null,
    }));

  return <ReviewGrid cards={cards} />;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
