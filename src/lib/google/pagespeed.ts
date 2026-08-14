// call_pagespeed_api atom — mobile + desktop scores become Audit-tab facts,
// not vibes (PRD §7). One call per strategy since the API only returns one
// strategy's Lighthouse run at a time.

export interface PageSpeedResult {
  score: number | null;
  lcp_ms: number | null;
  cls: number | null;
  ttfb_ms: number | null;
  opportunities: { id: string; title: string }[];
}

async function fetchStrategy(url: string, strategy: "mobile" | "desktop"): Promise<PageSpeedResult | null> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) {
    console.error("[pagespeed] GOOGLE_PAGESPEED_API_KEY is not set");
    return null;
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${apiKey}`
    );
    if (!res.ok) throw new Error(`PageSpeed API ${res.status}`);
    const data = await res.json();
    const lighthouse = data.lighthouseResult;
    const audits = lighthouse?.audits ?? {};

    return {
      score: lighthouse?.categories?.performance?.score != null ? Math.round(lighthouse.categories.performance.score * 100) : null,
      lcp_ms: audits["largest-contentful-paint"]?.numericValue ?? null,
      cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
      ttfb_ms: audits["server-response-time"]?.numericValue ?? null,
      opportunities: Object.values(audits as Record<string, { id: string; title: string; score: number | null }>)
        .filter((a) => a.score != null && a.score < 0.9 && a.id?.includes("-"))
        .slice(0, 5)
        .map((a) => ({ id: a.id, title: a.title })),
    };
  } catch (err) {
    console.error(`[pagespeed] ${strategy} call failed`, err);
    return null;
  }
}

export async function callPagespeedApi(url: string): Promise<{ mobile: PageSpeedResult | null; desktop: PageSpeedResult | null }> {
  const [mobile, desktop] = await Promise.all([fetchStrategy(url, "mobile"), fetchStrategy(url, "desktop")]);
  return { mobile, desktop };
}
