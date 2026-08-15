import { createAdminClient } from "@/lib/supabase/admin";

// screenshot_page atom. Was screenshotone.com — swapped out because it has
// no free tier and its cheapest paid plan isn't worth committing to at this
// stage. Reuses the same Google PageSpeed Insights API this pipeline
// already calls for real (src/lib/google/pagespeed.ts, same
// GOOGLE_PAGESPEED_API_KEY, no new signup/cost) — a Lighthouse run's
// response already includes a full-page "final-screenshot" audit as a
// base64 JPEG, so no dedicated screenshot provider is needed at all.
// Google's free quota (25k requests/day per project) is far beyond what
// this stage needs. Trade-off: a Lighthouse run is much slower than a
// purpose-built screenshot API (10-30s+), but this only ever runs as an
// async Inngest step with nothing waiting on it synchronously, so the
// latency is free too.
export async function screenshotPage(url: string, leadId: string, viewport: "mobile" | "desktop" = "mobile"): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) {
    console.error("[screenshot] GOOGLE_PAGESPEED_API_KEY is not set");
    return null;
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${viewport}&key=${apiKey}`
    );
    if (!res.ok) throw new Error(`PageSpeed API ${res.status}`);
    const data = await res.json();

    const dataUri = data.lighthouseResult?.audits?.["final-screenshot"]?.details?.data as string | undefined;
    if (!dataUri) throw new Error("no final-screenshot audit in Lighthouse response");

    const match = /^data:(image\/\w+);base64,(.+)$/.exec(dataUri);
    if (!match) throw new Error("final-screenshot audit wasn't a base64 data URI");
    const [, contentType, base64] = match;
    const ext = contentType.split("/")[1] || "jpeg";
    const buffer = Buffer.from(base64, "base64");

    // Same "nothing hotlinked, everything lives in our own Storage"
    // convention as photo-waterfall.ts's copy_to_storage.
    const path = `${leadId}/screenshot/${viewport}-${Date.now()}.${ext}`;
    const admin = createAdminClient();
    const { error } = await admin.storage.from("lead-media").upload(path, buffer, { contentType, upsert: false });
    if (error) throw error;

    const { data: publicUrlData } = admin.storage.from("lead-media").getPublicUrl(path);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("[screenshot] failed for", url, err);
    return null;
  }
}
