import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperator } from "@/lib/tenant-scope";
import { fetchDailyInsights } from "@/lib/meta/ads-insights";

// Pull ad spend from Meta into the period totals.
//
// Idempotent by construction: each day is keyed on the account and date and
// upserted, so re-running updates a figure rather than adding to it.
// Yesterday's spend is not final until Meta finishes attributing, so the
// same day is deliberately pulled more than once — an insert-only sync would
// make the period total climb every time it ran.

export const maxDuration = 60;

export async function POST(req: Request) {
  const ctx = await requireOperator();
  if (!ctx) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  // META_ADS_TOKEN and META_AD_ACCOUNT_ID are the platform's, so this pulls
  // the platform's spend. Left ungated it would import BarakahSoft's ad spend
  // into a partner's P&L and make their unit economics fiction. Per-tenant ad
  // credentials are the fix when a partner runs ads; refusing is the honest
  // answer until then.
  if (ctx.tenantSlug !== "barakahsoft") {
    return NextResponse.json(
      { error: "Ad-spend sync is not configured for this account. Add costs manually for now." },
      { status: 501 }
    );
  }

  const body = await req.json().catch(() => null);
  const days = [7, 14, 30].includes(Number(body?.days)) ? Number(body.days) : 14;

  const { days: rows, error } = await fetchDailyInsights(days);
  if (error) return NextResponse.json({ error }, { status: 400 });
  if (rows.length === 0) return NextResponse.json({ synced: 0, note: "Meta returned no days for that range." });

  const account = (process.env.META_AD_ACCOUNT_ID ?? "").replace(/^act_/, "");

  // Days with no spend are skipped rather than stored as zero: a zero row
  // reads as "we spent nothing" when it usually means the campaign was off.
  const payload = rows
    .filter((r) => r.date && r.spend > 0)
    .map((r) => ({
      kind: "ads" as const,
      label: r.campaignName ?? "Meta ads",
      amount_usd: r.spend,
      incurred_on: r.date,
      external_ref: `meta:${account}:${r.date}`,
      impressions: r.impressions,
      clicks: r.clicks,
      results: r.results,
    }));

  if (payload.length === 0) return NextResponse.json({ synced: 0, note: "No days with spend in that range." });

  const admin = createAdminClient();
  const { error: writeError } = await admin.from("operating_costs").upsert(payload, { onConflict: "external_ref" });
  if (writeError) return NextResponse.json({ error: writeError.message }, { status: 500 });

  const totalSpend = payload.reduce((n, r) => n + r.amount_usd, 0);
  // The column is amount_usd and revenue is compared against it in USD. An
  // account billing in another currency would be stored under the wrong
  // label and quietly skew the margin, so it is reported rather than
  // converted with a rate nobody supplied.
  const currencyWarning =
    (rows[0]?.currency ?? "USD") !== "USD"
      ? `This ad account bills in ${rows[0]?.currency}. Figures are stored as-is against a USD total — convert before trusting the net.`
      : null;
  const totalResults = payload.reduce((n, r) => n + (r.results ?? 0), 0);
  const currency = rows[0]?.currency ?? "USD";

  return NextResponse.json({
    synced: payload.length,
    totalSpend,
    totalResults,
    currency,
    // Reported rather than derived on the client, so the figure shown is the
    // one the spend was actually divided by.
    costPerResult: totalResults > 0 ? totalSpend / totalResults : null,
    campaign: rows[0]?.campaignName ?? null,
    currencyWarning,
  });
}
