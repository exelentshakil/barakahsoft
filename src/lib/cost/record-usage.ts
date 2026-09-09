import { createAdminClient } from "@/lib/supabase/admin";
import { costOf } from "@/lib/cost/pricing";

// Persist what a model call used.
//
// Both clients already knew this and only wrote it to a log line, so the
// numbers existed and were unrecoverable a minute later.
//
// Never throws and never blocks: a bookkeeping write must not be able to
// fail a generation that otherwise succeeded. A dropped usage row costs an
// accurate total; a thrown one would cost the client their homepage.

export interface UsageRecord {
  leadId?: string | null;
  /** Whose spend this is. Defaults to the platform when unset. */
  tenantSlug?: string | null;
  provider: "openai" | "gemini";
  model: string;
  purpose?: string | null;
  promptTokens: number;
  completionTokens: number;
}

export async function recordUsage(usage: UsageRecord): Promise<void> {
  try {
    const prompt = Number.isFinite(usage.promptTokens) ? Math.max(0, Math.round(usage.promptTokens)) : 0;
    const completion = Number.isFinite(usage.completionTokens) ? Math.max(0, Math.round(usage.completionTokens)) : 0;
    if (prompt === 0 && completion === 0) return;

    const admin = createAdminClient();
    await admin.from("ai_usage").insert({
      lead_id: usage.leadId ?? null,
      tenant_slug: usage.tenantSlug ?? "barakahsoft",
      provider: usage.provider,
      model: usage.model,
      purpose: usage.purpose ?? null,
      prompt_tokens: prompt,
      completion_tokens: completion,
      // Priced at write time. A later price change should not rewrite what
      // last month reported it had spent.
      cost_usd: await costOf(usage.model, prompt, completion),
    });
  } catch (err) {
    console.error("[ai-usage] could not record usage", err);
  }
}

/**
 * The lead a model call belongs to.
 *
 * Threading a lead id through every generation function would touch a great
 * many signatures for a bookkeeping concern. Generation already runs one
 * lead at a time (the Inngest function is concurrency-limited per lead), so
 * the current lead is set once at the top of a run and read by the clients.
 */
let currentLeadId: string | null = null;
let currentTenant: string | null = null;
let currentPurpose: string | null = null;

export function setUsageContext(
  leadId: string | null,
  purpose?: string | null,
  /**
   * Whose spend this is.
   *
   * Carried separately from the lead because lead_id is deliberately nullable
   * — work not tied to a lead would otherwise be unattributable, and a
   * partner's P&L would silently inherit the platform's model spend.
   */
  tenantSlug?: string | null
): void {
  currentLeadId = leadId;
  currentPurpose = purpose ?? null;
  currentTenant = tenantSlug ?? null;
}

export function usageContext(): { leadId: string | null; purpose: string | null; tenantSlug: string | null } {
  return { leadId: currentLeadId, purpose: currentPurpose, tenantSlug: currentTenant };
}
