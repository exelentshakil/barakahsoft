import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeBusiness } from "@/lib/scrape";
import { autoSelectDna } from "@/lib/inspiration-library";
import { compileDesignTokens } from "@/lib/design-tokens";

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

    // A design direction is chosen automatically the moment the facts land,
    // so opening a lead already shows a committed look rather than an empty
    // box waiting for the operator to go and find a reference site. The
    // Studio can override it, and saving a better reference to the library
    // makes every future lead in that industry use it instead.
    await step.run("auto-select-design-direction", async () => {
      const { data: fresh } = await admin
        .from("leads")
        .select("industry, persona")
        .eq("id", lead_id)
        .single<{ industry: string | null; persona: string | null }>();

      const { dna, label, sourceUrl, from } = await autoSelectDna(fresh?.industry ?? fresh?.persona ?? lead.industry);

      const { data: artifact } = await admin
        .from("artifacts")
        .select("id, inspiration_branding")
        .eq("lead_id", lead_id)
        .maybeSingle<{ id: string; inspiration_branding: unknown }>();

      // Never overwrite a direction the operator already chose.
      if (artifact?.inspiration_branding) return;

      const patch = {
        inspiration_branding: dna,
        inspiration_url: sourceUrl,
        design_tokens: compileDesignTokens(dna),
      };

      if (artifact) {
        await admin.from("artifacts").update(patch).eq("lead_id", lead_id);
      } else {
        const { data: shell } = await admin.from("template_shells").select("id").limit(1).single();
        if (!shell) return;
        await admin.from("artifacts").insert({
          lead_id,
          template_shell_id: shell.id,
          funnel_pages: [],
          qa_status: "pending",
          ...patch,
        });
      }

      console.log(`[scrape-run] design direction for ${lead_id}: ${label} (from ${from})`);
    });

    await step.run("mark-scrape-complete", async () => {
      await admin.from("leads").update({ status: "ready" }).eq("id", lead_id);
      await admin.from("build_jobs").update({ status: "complete", pages_done: 1 }).eq("lead_id", lead_id).eq("stage", "scrape");
    });

    return { lead_id, status: "ready_for_operator_studio" };
  }
);
