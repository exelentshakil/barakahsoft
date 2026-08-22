import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeBusiness } from "@/lib/scrape";
import { scrapeWithFirecrawl } from "@/lib/scrape/firecrawl";
import { callPlacesApi } from "@/lib/google/places";

// lead/rescrape.requested — refreshing a lead's facts, in two sizes.
//
// Runs as a job because a full crawl is minutes of work and cannot live in
// a request. The light mode exists because the page budget is finite and
// most re-scrapes are asked for after a logo, a colour or a review count
// changed — none of which need the site re-crawled.
export const rescrapeLead = inngest.createFunction(
  { id: "rescrape-lead", retries: 1 },
  { event: "lead/rescrape.requested" },
  async ({ event, step }) => {
    const { lead_id, mode } = event.data as { lead_id: string; mode: "light" | "full" };
    const admin = createAdminClient();

    const lead = await step.run("load-lead", async () => {
      const { data } = await admin.from("leads").select("*").eq("id", lead_id).single();
      if (!data) throw new Error(`rescrape: lead ${lead_id} not found`);
      return data;
    });

    await step.run("mark-running", async () => {
      await admin.from("build_jobs").delete().eq("lead_id", lead_id).eq("stage", "scrape");
      await admin.from("build_jobs").insert({ lead_id, stage: "scrape", status: "running", pages_total: 1 });
      await admin.from("leads").update({ status: "scraping" }).eq("id", lead_id);
    });

    if (mode === "full") {
      await step.run("full-recrawl", async () => {
        await scrapeBusiness(lead_id, lead.source_url, lead.business_name ?? undefined);
      });
    } else {
      // One page plus the Places lookup: enough to refresh brand colours, the
      // logo, the rating and the review count without touching the crawl.
      await step.run("light-refresh", async () => {
        const [firecrawl, places] = await Promise.all([
          scrapeWithFirecrawl(lead.source_url),
          callPlacesApi(lead.business_name ?? new URL(lead.source_url).hostname, lead.phone ?? undefined),
        ]);

        const { data: existing } = await admin
          .from("scrape_results")
          .select("facts")
          .eq("lead_id", lead_id)
          .maybeSingle<{ facts: Record<string, unknown> }>();

        if (!existing) throw new Error("rescrape: nothing to refresh — run a full crawl first");

        const branding = firecrawl?.branding ?? {};

        // Only overwrite what was actually re-read. A light refresh must
        // never blank the crawled page inventory it did not look at.
        const facts: Record<string, unknown> = { ...existing.facts };
        if (branding.colors?.primary) facts.brand_color_hex = branding.colors.primary;
        if (branding.images?.logo) facts.logo_url = branding.images.logo;
        if (places?.rating) facts.rating = places.rating;
        if (places?.review_count) facts.review_count = places.review_count;
        if (places?.reviews) facts.reviews = places.reviews;
        if (places?.formatted_address) {
          facts.nap = { ...(facts.nap as object), address: places.formatted_address };
        }

        await admin.from("scrape_results").update({ facts, scraped_at: new Date().toISOString() }).eq("lead_id", lead_id);
      });
    }

    await step.run("mark-complete", async () => {
      await admin.from("leads").update({ status: "ready" }).eq("id", lead_id);
      await admin
        .from("build_jobs")
        .update({ status: "complete", pages_done: 1 })
        .eq("lead_id", lead_id)
        .eq("stage", "scrape");
    });

    return { lead_id, mode };
  }
);
