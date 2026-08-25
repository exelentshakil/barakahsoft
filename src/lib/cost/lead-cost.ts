import { createAdminClient } from "@/lib/supabase/admin";

// What one lead has cost in model spend so far.
//
// Shown on the lead header so the number sits next to the price being asked
// for the job, which is the only place the comparison means anything.

export interface LeadCost {
  calls: number;
  promptTokens: number;
  completionTokens: number;
  /** Null when no model involved has a configured price. */
  costUsd: number | null;
  /** Calls whose model has no price, so the figure above is a floor. */
  unpricedCalls: number;
}

export async function leadCost(leadId: string): Promise<LeadCost> {
  const empty: LeadCost = { calls: 0, promptTokens: 0, completionTokens: 0, costUsd: null, unpricedCalls: 0 };
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("ai_usage")
      .select("prompt_tokens, completion_tokens, cost_usd")
      .eq("lead_id", leadId)
      .returns<{ prompt_tokens: number; completion_tokens: number; cost_usd: number | null }[]>();

    // The table may not exist yet on an environment where the migration has
    // not run. A missing cost figure must not take the lead page down.
    if (error || !data) return empty;

    const priced = data.filter((r) => r.cost_usd !== null);
    return {
      calls: data.length,
      promptTokens: data.reduce((n, r) => n + (r.prompt_tokens ?? 0), 0),
      completionTokens: data.reduce((n, r) => n + (r.completion_tokens ?? 0), 0),
      costUsd: priced.length > 0 ? priced.reduce((n, r) => n + Number(r.cost_usd), 0) : null,
      unpricedCalls: data.length - priced.length,
    };
  } catch {
    return empty;
  }
}
