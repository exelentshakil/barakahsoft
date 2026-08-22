import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { measureSearchVisibility } from "@/lib/audit/search-visibility";
import type { Lead, ScrapeResults } from "@/types/database";

// lead/visibility.requested — measuring where a business actually appears
// across its service area.
//
// A background job because each area is a real web search and a full report
// is dozens of them: minutes of work, well past a request's budget.
export const measureVisibility = inngest.createFunction(
  { id: "measure-visibility", retries: 1 },
  { event: "lead/visibility.requested" },
  async ({ event, step }) => {
    const { lead_id, cellCount, provider } = event.data as {
      lead_id: string;
      cellCount: number;
      provider?: "gemini" | "openai";
    };
    const admin = createAdminClient();

    const context = await step.run("load", async () => {
      const [{ data: lead }, { data: scrape }] = await Promise.all([
        admin.from("leads").select("*").eq("id", lead_id).single<Lead>(),
        admin.from("scrape_results").select("facts").eq("lead_id", lead_id).single<ScrapeResults>(),
      ]);
      if (!lead || !scrape) throw new Error(`measure-visibility: lead ${lead_id} is not analysed yet`);
      return { lead, facts: scrape.facts as Record<string, unknown> };
    });

    const { lead, facts } = context;
    const businessName = (facts.business_name as string) || lead.business_name || "";
    const trade = lead.industry || lead.persona || "local services";
    const town =
      (facts.town as string) ||
      (facts.nap as { address?: string } | undefined)?.address?.split(",").slice(-3, -2)[0]?.trim() ||
      "";

    if (!businessName || !town) {
      throw new Error("measure-visibility: the lead needs a business name and a city before it can be measured");
    }

    // Their own location pages name the areas they actually serve, which
    // beats a generated neighbourhood list when it exists.
    const ownAreas = (facts.derived_areas as string[] | undefined) ?? [];

    const report = await step.run("measure", async () => {
      const result = await measureSearchVisibility(businessName, trade, town, {
        areas: ownAreas,
        cellCount,
        provider,
      });
      if (!result) {
        throw new Error(
          "Measurement failed — too few areas returned usable search results. Either the search provider returned nothing grounded, or no search-capable model is available. Check /api/diag/openai."
        );
      }
      return result;
    });

    await step.run("save", async () => {
      await admin
        .from("scrape_results")
        .update({ search_visibility: report, search_visibility_at: new Date().toISOString() })
        .eq("lead_id", lead_id);
    });

    return { lead_id, measured: report.cells.length, missing: report.missing };
  }
);
