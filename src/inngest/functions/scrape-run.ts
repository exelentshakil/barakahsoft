import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeBusiness } from "@/lib/scrape";

// scrape.run — Stage 1: Ingests Firecrawl facts, Google Places ratings, real photos,
// and PageSpeed metrics. Does NOT blindly build the website automatically — instead,
// it saves the verified brief data and leaves the lead ready for operator curation
// and on-demand high-value generation in the Admin Studio.
export const scrapeRun = inngest.createFunction(
  { id: "scrape-run" },
  { event: "lead/intake.submitted" },
  async ({ event, step }) => {
    const { lead_id } = event.data as { lead_id: string };
    const admin = createAdminClient();

    const lead = await step.run("load-lead", async () => {
      const { data } = await admin.from("leads").select("*").eq("id", lead_id).single();
      if (!data) throw new Error(`scrape-run: lead ${lead_id} not found`);
      return data;
    });

    await step.run("mark-scraping", async () => {
      await admin.from("leads").update({ status: "scraping" }).eq("id", lead_id);
      await admin.from("build_jobs").insert({ lead_id, stage: "scrape", status: "running", pages_total: 1 });
    });

    await step.run("scrape-business", async () => {
      await scrapeBusiness(lead_id, lead.source_url, lead.business_name ?? undefined);
    });

    await step.run("mark-scrape-complete", async () => {
      await admin.from("leads").update({ status: "ready" }).eq("id", lead_id);
      await admin.from("build_jobs").update({ status: "complete", pages_done: 1 }).eq("lead_id", lead_id).eq("stage", "scrape");
    });

    return { lead_id, status: "ready_for_operator_studio" };
  }
);
