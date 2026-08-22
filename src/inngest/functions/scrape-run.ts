import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeBusiness } from "@/lib/scrape";
import { autoSelectOrResearch, presetFor } from "@/lib/inspiration-library";
import { compileDesignTokens } from "@/lib/design-tokens";

// lead/analyse.requested — step 1 of the operator flow.
//
// Triggered by a person, never by intake. Everything in here costs money —
// Firecrawl credits, Places calls, PageSpeed runs — and intake is a public
// form, so a pipeline that started itself was a pipeline a spam submission
// could bill.
//
// Light depth reads the site's URL map plus its homepage: two credits, and
// the sitemap names the real services. Deep crawls real pages and is an
// explicit choice for a lead worth the spend.
export const scrapeRun = inngest.createFunction(
  { id: "scrape-run" },
  { event: "lead/analyse.requested" },
  async ({ event, step }) => {
    const { lead_id, depth, researchDesign } = event.data as {
      lead_id: string;
      depth?: "light" | "deep";
      researchDesign?: boolean;
    };
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
      await scrapeBusiness(lead_id, lead.source_url, lead.business_name ?? undefined, depth ?? "light");
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

      const industry = fresh?.industry ?? fresh?.persona ?? lead.industry;

      // Researching a new trade costs a search plus three page reads. It is
      // worth it once per industry and never worth it on a lead nobody has
      // qualified, so it is opt-in; without it this falls back to the
      // library or a house direction, both of which are free.
      // Without research this falls back to the house direction for the
      // trade -- deliberately NOT to a saved reference. Reusing another
      // lead's reference is free, but it hands two businesses in the same
      // trade the same site, which is the one outcome worth paying to avoid.
      const selected = researchDesign
        ? await autoSelectOrResearch(industry)
        : { ...presetFor(industry), sourceUrl: null, from: "preset" as const };
      const { dna, label, sourceUrl, from } = selected;

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
