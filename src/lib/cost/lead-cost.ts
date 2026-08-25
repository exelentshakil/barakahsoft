import { createAdminClient } from "@/lib/supabase/admin";

// What one lead has cost, end to end.
//
// Two halves that are usually reported in different places and mean little
// apart: the ads that brought them, and the model spend that produced their
// site. Shown on the lead header beside the price being asked, because that
// comparison is the whole question — this lead cost X and you are about to
// ask for Y.

export interface LeadCost {
  calls: number;
  promptTokens: number;
  completionTokens: number;
  /** Model spend. Null when no model involved has a confirmed price. */
  costUsd: number | null;
  /** Calls whose model has no price, so the figure above is a floor. */
  unpricedCalls: number;
  /**
   * This lead's share of the ad spend on the day it arrived.
   *
   * Null for a lead no advert produced — an outreach prospect was found, not
   * bought, and charging it a share of the ad budget would overstate the cost
   * of every lead that actually came from one.
   */
  adShareUsd: number | null;
  /** Leads the day's spend was divided between, for showing the working. */
  adShareCohort: number | null;
  /** Ads plus models, where both are known. */
  totalUsd: number | null;
}

const EMPTY: LeadCost = {
  calls: 0,
  promptTokens: 0,
  completionTokens: 0,
  costUsd: null,
  unpricedCalls: 0,
  adShareUsd: null,
  adShareCohort: null,
  totalUsd: null,
};

/**
 * Allocate a day's ad spend across the leads that arrived that day.
 *
 * A per-lead figure from Meta would need a campaign per client, which is not
 * how this runs — one campaign brings everyone. Dividing the day's spend by
 * the day's inbound leads is the honest approximation, and the cohort size is
 * returned alongside so the number can be checked rather than believed.
 */
async function adShare(
  admin: ReturnType<typeof createAdminClient>,
  leadId: string,
  createdAt: string,
  source: string
): Promise<{ share: number | null; cohort: number | null }> {
  // Outreach and manual prospects were not bought.
  if (source !== "home" && source !== "redesign") return { share: null, cohort: null };

  const day = createdAt.slice(0, 10);
  const dayStart = `${day}T00:00:00.000Z`;
  const dayEnd = `${day}T23:59:59.999Z`;

  const [{ data: spendRows }, { count }] = await Promise.all([
    admin
      .from("operating_costs")
      .select("amount_usd")
      .eq("kind", "ads")
      .eq("incurred_on", day)
      .returns<{ amount_usd: number }[]>(),
    admin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .in("source", ["home", "redesign"])
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd),
  ]);

  const spend = (spendRows ?? []).reduce((n, r) => n + Number(r.amount_usd ?? 0), 0);
  if (spend <= 0) return { share: null, cohort: null };

  // At least one: this lead. A zero would divide by nothing.
  const cohort = Math.max(count ?? 1, 1);
  void leadId;
  return { share: spend / cohort, cohort };
}

export async function leadCost(leadId: string): Promise<LeadCost> {
  try {
    const admin = createAdminClient();

    const [{ data: usage, error }, { data: lead }] = await Promise.all([
      admin
        .from("ai_usage")
        .select("prompt_tokens, completion_tokens, cost_usd")
        .eq("lead_id", leadId)
        .returns<{ prompt_tokens: number; completion_tokens: number; cost_usd: number | null }[]>(),
      admin
        .from("leads")
        .select("created_at, source")
        .eq("id", leadId)
        .maybeSingle<{ created_at: string; source: string }>(),
    ]);

    // The tables may not exist yet where the migration has not run. A missing
    // cost figure must never take the lead page down.
    const rows = error ? [] : (usage ?? []);
    const priced = rows.filter((r) => r.cost_usd !== null);
    const modelCost = priced.length > 0 ? priced.reduce((n, r) => n + Number(r.cost_usd), 0) : null;

    const { share, cohort } = lead
      ? await adShare(admin, leadId, lead.created_at, lead.source)
      : { share: null, cohort: null };

    return {
      calls: rows.length,
      promptTokens: rows.reduce((n, r) => n + (r.prompt_tokens ?? 0), 0),
      completionTokens: rows.reduce((n, r) => n + (r.completion_tokens ?? 0), 0),
      costUsd: modelCost,
      unpricedCalls: rows.length - priced.length,
      adShareUsd: share,
      adShareCohort: cohort,
      totalUsd: modelCost !== null || share !== null ? (modelCost ?? 0) + (share ?? 0) : null,
    };
  } catch {
    return EMPTY;
  }
}
