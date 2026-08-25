import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchDailyInsights } from "@/lib/meta/ads-insights";

// Nightly ad spend sync.
//
// The manual button in the costs dialog is for checking a number mid-day.
// This is what keeps the margin figure true without anyone remembering to
// press it — a cost report that is only correct when someone maintains it
// stops being consulted, and then stops being correct.
//
// It re-pulls the last seven days rather than yesterday alone. Meta keeps
// attributing conversions for days after the spend, so a day fetched once at
// midnight is a guess; each re-pull is an upsert on the account and date, so
// re-reading a day corrects it instead of adding to it.
export const syncAdSpend = inngest.createFunction(
  { id: "sync-ad-spend", retries: 2 },
  // Every six hours rather than nightly.
  //
  // Insights is not a demanding call — one account, one week, account level —
  // and Meta's own spend figures refresh on roughly an hour, so this is well
  // inside any rate limit while never showing a number more than a quarter of
  // a day stale. Polling faster than the source updates buys nothing: the
  // limit on freshness is Meta's attribution, not our schedule.
  { cron: "15 */6 * * *" },
  async ({ step }) => {
    const result = await step.run("fetch-insights", async () => fetchDailyInsights(7));

    // Not thrown: a missing or revoked token is a configuration problem
    // fixed in Business Settings, and a job that fails on every run becomes
    // noise that gets muted rather than read.
    if (result.error) {
      console.warn(`[sync-ad-spend] skipped — ${result.error}`);
      return { synced: 0, skipped: result.error };
    }

    const account = (process.env.META_AD_ACCOUNT_ID ?? "").replace(/^act_/, "");

    return step.run("write-rows", async () => {
      const rows = result.days
        .filter((d) => d.date && d.spend > 0)
        .map((d) => ({
          kind: "ads" as const,
          label: d.campaignName ?? "Meta ads",
          amount_usd: d.spend,
          incurred_on: d.date,
          external_ref: `meta:${account}:${d.date}`,
          impressions: d.impressions,
          clicks: d.clicks,
          results: d.results,
        }));

      if (rows.length === 0) return { synced: 0 };

      const admin = createAdminClient();
      const { error } = await admin.from("operating_costs").upsert(rows, { onConflict: "external_ref" });
      if (error) throw new Error(`sync-ad-spend: ${error.message}`);

      return { synced: rows.length };
    });
  }
);
