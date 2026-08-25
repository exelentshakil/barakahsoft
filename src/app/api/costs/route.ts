import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { pricingConfigured } from "@/lib/cost/pricing";

// What a period cost and what it returned.
//
// Model spend, other operating costs and collected revenue in one answer,
// because the question is never any one of them — it is whether the week
// paid for itself.

export interface CostSummary {
  from: string;
  to: string;
  ai: { calls: number; promptTokens: number; completionTokens: number; costUsd: number; unpricedCalls: number };
  otherCosts: { kind: string; amountUsd: number }[];
  revenueUsd: number;
  pricingConfigured: boolean;
}

function rangeFor(period: string, fromParam: string | null, toParam: string | null): { from: Date; to: Date } {
  const to = toParam ? new Date(toParam) : new Date();
  if (period === "custom" && fromParam) return { from: new Date(fromParam), to };

  const from = new Date(to);
  if (period === "month") from.setUTCMonth(from.getUTCMonth() - 1);
  else if (period === "fortnight") from.setUTCDate(from.getUTCDate() - 14);
  else from.setUTCDate(from.getUTCDate() - 7);
  return { from, to };
}

export async function GET(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const url = new URL(req.url);
  const { from, to } = rangeFor(url.searchParams.get("period") ?? "week", url.searchParams.get("from"), url.searchParams.get("to"));
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }

  const admin = createAdminClient();

  const [usage, costs, paid] = await Promise.all([
    admin
      .from("ai_usage")
      .select("prompt_tokens, completion_tokens, cost_usd")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .returns<{ prompt_tokens: number; completion_tokens: number; cost_usd: number | null }[]>(),
    admin
      .from("operating_costs")
      .select("kind, amount_usd")
      .gte("incurred_on", from.toISOString().slice(0, 10))
      .lte("incurred_on", to.toISOString().slice(0, 10))
      .returns<{ kind: string; amount_usd: number }[]>(),
    admin
      .from("leads")
      .select("id, paid_at")
      .not("paid_at", "is", null)
      .gte("paid_at", from.toISOString())
      .lte("paid_at", to.toISOString())
      .returns<{ id: string; paid_at: string }[]>(),
  ]);

  const rows = usage.data ?? [];
  const ai = {
    calls: rows.length,
    promptTokens: rows.reduce((n, r) => n + (r.prompt_tokens ?? 0), 0),
    completionTokens: rows.reduce((n, r) => n + (r.completion_tokens ?? 0), 0),
    costUsd: rows.reduce((n, r) => n + Number(r.cost_usd ?? 0), 0),
    // Surfaced rather than folded into the total: a spend figure that
    // silently omits unpriced models is worse than one that says so.
    unpricedCalls: rows.filter((r) => r.cost_usd === null).length,
  };

  const byKind = new Map<string, number>();
  for (const c of costs.data ?? []) byKind.set(c.kind, (byKind.get(c.kind) ?? 0) + Number(c.amount_usd ?? 0));

  const summary: CostSummary = {
    from: from.toISOString(),
    to: to.toISOString(),
    ai,
    otherCosts: [...byKind.entries()].map(([kind, amountUsd]) => ({ kind, amountUsd })),
    // Paid leads in the window. The amount actually charged lives in Stripe,
    // so this counts conversions rather than inventing a figure per lead.
    revenueUsd: 0,
    pricingConfigured: await pricingConfigured(),
  };

  return NextResponse.json({ ...summary, paidLeads: (paid.data ?? []).length });
}
