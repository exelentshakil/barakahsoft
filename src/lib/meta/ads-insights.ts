// Daily ad spend and performance, read from Meta rather than typed in.
//
// One campaign brings the leads, so the useful unit is the account's day:
// what it cost, and what it returned. Per-lead attribution would need a
// campaign per client, which is not how this runs.
//
// The token is a System User token from Business Settings, not one from the
// Graph API Explorer — an Explorer token is a short-lived user token that
// expires within a couple of hours, so a nightly sync built on one works
// once and then quietly stops.

const GRAPH_VERSION = "v19.0";

export interface DailyInsight {
  date: string;
  spend: number;
  currency: string;
  impressions: number;
  clicks: number;
  /** Leads, or whatever the campaign optimises for. Null when none reported. */
  results: number | null;
  campaignName: string | null;
}

export interface InsightsResult {
  days: DailyInsight[];
  error: string | null;
}

/** Meta reports the optimised action under whichever action_type applies. */
function readResults(actions: unknown): number | null {
  if (!Array.isArray(actions)) return null;
  const wanted = new Set([
    "lead",
    "onsite_conversion.lead_grouped",
    "offsite_conversion.fb_pixel_lead",
    "onsite_web_lead",
  ]);
  let total = 0;
  let found = false;
  for (const a of actions as { action_type?: string; value?: string }[]) {
    if (a?.action_type && wanted.has(a.action_type)) {
      total += Number(a.value ?? 0);
      found = true;
    }
  }
  return found ? total : null;
}

/**
 * Insights for the last `days` days, one row per day.
 *
 * Returns an error string rather than throwing: this runs from an operator
 * action and a token problem should be readable on screen, not a 500.
 */
export async function fetchDailyInsights(days = 14): Promise<InsightsResult> {
  const token = process.env.META_ADS_TOKEN;
  const account = process.env.META_AD_ACCOUNT_ID;

  if (!token) return { days: [], error: "META_ADS_TOKEN is not set." };
  if (!account) return { days: [], error: "META_AD_ACCOUNT_ID is not set." };

  // The API wants act_ prefixed; accept the id with or without it so a
  // pasted account number works either way.
  const actId = account.startsWith("act_") ? account : `act_${account}`;

  const params = new URLSearchParams({
    // time_increment=1 is what turns one summed figure into a row per day.
    time_increment: "1",
    date_preset: days <= 7 ? "last_7d" : days <= 14 ? "last_14d" : "last_30d",
    level: "account",
    fields: "date_start,spend,impressions,clicks,actions,account_currency,campaign_name",
    limit: "100",
    access_token: token,
  });

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${actId}/insights?${params}`, {
      // Never cache a spend figure; yesterday's is still moving.
      cache: "no-store",
    });
    const body = await res.json().catch(() => null);

    if (!res.ok) {
      const message = body?.error?.message ?? `Meta returned ${res.status}`;
      // The two failures worth naming, because the fix differs completely.
      if (body?.error?.code === 190) {
        return { days: [], error: `${message} — the token has expired or been revoked. A System User token with no expiry avoids this.` };
      }
      if (body?.error?.code === 200 || body?.error?.code === 10) {
        return { days: [], error: `${message} — the token is valid but lacks ads_read on ${actId}, or the app is not installed on that System User.` };
      }
      return { days: [], error: message };
    }

    const rows: Record<string, unknown>[] = Array.isArray(body?.data) ? body.data : [];
    return {
      days: rows.map((r) => ({
        date: String(r.date_start ?? ""),
        spend: Number(r.spend ?? 0),
        currency: String(r.account_currency ?? "USD"),
        impressions: Number(r.impressions ?? 0),
        clicks: Number(r.clicks ?? 0),
        results: readResults(r.actions),
        campaignName: typeof r.campaign_name === "string" ? r.campaign_name : null,
      })),
      error: null,
    };
  } catch (err) {
    return { days: [], error: err instanceof Error ? err.message : "Could not reach Meta." };
  }
}
