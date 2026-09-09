import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperator } from "@/lib/tenant-scope";
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
  const ctx = await requireOperator();
  if (!ctx) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const url = new URL(req.url);
  const { from, to } = rangeFor(url.searchParams.get("period") ?? "week", url.searchParams.get("from"), url.searchParams.get("to"));
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }

  const admin = createAdminClient();
  // Every figure below is one brand's. A partner reading their own P&L must
  // not see the platform's model spend, ad spend or revenue — and the platform
  // must not book a partner's revenue as its own.
  const tenantSlug = ctx.tenantSlug;

  const [usage, costs, paid, coverage] = await Promise.all([
    admin
      .from("ai_usage")
      .select("prompt_tokens, completion_tokens, cost_usd")
      .eq("tenant_slug", tenantSlug)
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .returns<{ prompt_tokens: number; completion_tokens: number; cost_usd: number | null }[]>(),
    admin
      .from("operating_costs")
      .select("kind, amount_usd")
      .eq("tenant_slug", tenantSlug)
      .gte("incurred_on", from.toISOString().slice(0, 10))
      .lte("incurred_on", to.toISOString().slice(0, 10))
      .returns<{ kind: string; amount_usd: number }[]>(),
    admin
      .from("leads")
      .select("id, paid_at")
      .eq("tenant_slug", tenantSlug)
      .not("paid_at", "is", null)
      .gte("paid_at", from.toISOString())
      .lte("paid_at", to.toISOString())
      .returns<{ id: string; paid_at: string }[]>(),
    // ICP coverage, over every lead rather than the period: the question it
    // answers is "which businesses can this engine actually serve", and the
    // answer does not reset every fortnight. The unsupported bucket is the
    // roadmap — it says which section renderer to build next.
    admin
      .from("leads")
      .select("icp_category, icp_fit")
      .eq("tenant_slug", tenantSlug)
      .returns<{ icp_category: string | null; icp_fit: string | null }[]>(),
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

  // Coverage, folded into the same call the P&L panel already makes.
  const leads = coverage.data ?? [];
  const byFit: Record<string, number> = { native: 0, adapted: 0, unsupported: 0, unclassified: 0 };
  const byCategory: Record<string, number> = {};
  for (const lead of leads) {
    byFit[lead.icp_fit ?? "unclassified"] = (byFit[lead.icp_fit ?? "unclassified"] ?? 0) + 1;
    const category = lead.icp_category ?? "unclassified";
    byCategory[category] = (byCategory[category] ?? 0) + 1;
  }

  return NextResponse.json({
    ...summary,
    paidLeads: (paid.data ?? []).length,
    coverage: { total: leads.length, byFit, byCategory },
  });
}
