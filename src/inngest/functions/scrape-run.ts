import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeBusiness } from "@/lib/scrape";
import { autoSelectOrResearch, presetFor } from "@/lib/inspiration-library";
import { classifyBusiness } from "@/lib/classify-business";
import { classifyIcp } from "@/lib/verticals/icp";
import { resolveVerticalAsync } from "@/lib/verticals/resolve";
import { compileDesignTokens } from "@/lib/design-tokens";
import { evaluateLeadValue } from "@/lib/audit/lead-value";

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

    // Identify the business before choosing a design direction, because the
    // direction is searched for BY TRADE. Without this the industry stayed
    // null, research fell straight through to the house default, and the
    // lead silently got a generic direction instead of a researched one.
    await step.run("identify-business", async () => {
      const { data: scrape } = await admin
        .from("scrape_results")
        .select("facts")
        .eq("lead_id", lead_id)
        .single<{ facts: Record<string, unknown> }>();
      if (!scrape) return;

      const identity = await classifyBusiness(scrape.facts);
      if (!identity) return;

      const updates: Record<string, unknown> = {};
      if (identity.industry && !lead.industry) updates.industry = identity.industry;

      // Only a value a HUMAN set is protected. Guarding on "is it empty"
      // treated the previous scrape's own guess as sacred, so a name lifted
      // from a title tag — "Take the BUSY Out of BUSYness" — survived a
      // re-analysis that had correctly identified the business as HeartCore
      // Growth. A stored name that matches what the last scrape derived is
      // machine output, and is safe to improve.
      const previousDerived = (scrape.facts.business_name as string | undefined) ?? null;
      const nameIsMachineDerived = !lead.business_name || lead.business_name === previousDerived;
      if (identity.businessName && nameIsMachineDerived) updates.business_name = identity.businessName;

      // Step 0 of the router: which of the nine macro-ICPs is this, and can
      // this engine serve it well? Recorded on the lead so coverage is a
      // measured number rather than an estimate, and read by the generate
      // route, which refuses to build a page for a business whose proof and
      // conversion model this engine has nothing to fill.
      //
      // Free: no model call, just patterns over what classifyBusiness already
      // returned plus the two facts that decide whether a page can be thick.
      const places = (scrape.facts.places as { rating?: number | null } | undefined) ?? undefined;
      const nap = (scrape.facts.nap as { phones?: string[] } | undefined) ?? undefined;
      const icp = classifyIcp({
        industry: identity.industry,
        businessName: identity.businessName,
        services: identity.services,
        isLocal: identity.isLocal,
        hasPhone: Boolean(nap?.phones?.length || lead.phone),
        hasReviews: Boolean(places?.rating),
      });
      updates.icp_category = icp.category.slug;
      updates.icp_fit = icp.fit;
      // Only fills a vertical the operator has not already chosen.
      //
      // An industry nothing curated recognises gets its own profile written
      // here, once, and cached for every business in that industry after it.
      // Doing it at scrape time rather than at build time means the operator
      // sees the real vertical on the brief screen before they generate,
      // instead of discovering it in the finished page.
      if (!lead.vertical_slug) {
        const resolved = await resolveVerticalAsync(
          { ...lead, icp_category: icp.category.slug, vertical_slug: null },
          null,
          identity.services
        );
        updates.vertical_slug = resolved.profile.slug;
      }
      if (Object.keys(updates).length > 0) {
        await admin.from("leads").update(updates).eq("id", lead_id);
      }

      // The scraped title is usually a tagline, and the town is often absent
      // from the page entirely, so both are written back onto the facts the
      // brief is built from.
      const facts = { ...scrape.facts };
      if (identity.businessName) facts.business_name = identity.businessName;
      if (identity.city && !facts.town) facts.town = identity.city;
      facts.is_local_business = identity.isLocal;

      // A model reading the page content beats URL and navigation
      // heuristics, which produced sitemap filenames and menu labels as
      // services on two real sites. The heuristic result is kept only when
      // the model found nothing.
      if (identity.services.length > 0) facts.derived_services = identity.services;
      if (identity.areas.length > 0) facts.derived_areas = identity.areas;
      await admin.from("scrape_results").update({ facts }).eq("lead_id", lead_id);
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
        .select("id, inspiration_branding, inspiration_url")
        .eq("lead_id", lead_id)
        .maybeSingle<{ id: string; inspiration_branding: unknown; inspiration_url: string | null }>();

      // Protect a direction that was actually chosen — by the operator, or
      // by research that found a real reference site. The house default is
      // neither: it is what gets used when nothing better was available, and
      // treating it as a choice meant re-analysing could never upgrade it.
      // The first run of this lead had no industry, so it fell back to the
      // house default and then refused every later attempt to improve on it.
      const existingSource = (artifact?.inspiration_branding as { sourceName?: string } | null)?.sourceName;
      const alreadyChosen =
        !!artifact?.inspiration_url || (!!existingSource && !existingSource.startsWith("House "));
      if (alreadyChosen) return;

      const { data: scrapeRes } = await admin
        .from("scrape_results")
        .select("facts")
        .eq("lead_id", lead_id)
        .maybeSingle<{ facts: Record<string, unknown> }>();
      const clientHex = (scrapeRes?.facts?.brand_color_hex as string | undefined) ?? null;

      const patch = {
        inspiration_branding: dna,
        inspiration_url: sourceUrl,
        design_tokens: compileDesignTokens(dna, { clientBrandHex: clientHex }),
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

    // What this lead can pay, worked out from the scrape that has just been
    // paid for. It runs here rather than on demand because the operator
    // needs it before the first call, and because everything it reads is
    // already in memory at this point.
    await step.run("evaluate-lead-value", async () => {
      const { data: scrape } = await admin
        .from("scrape_results")
        .select("facts, pagespeed_mobile")
        .eq("lead_id", lead_id)
        .maybeSingle<{ facts: Record<string, unknown>; pagespeed_mobile: Record<string, unknown> | null }>();
      if (!scrape?.facts) return { skipped: "no facts" };

      const value = await evaluateLeadValue({
        facts: scrape.facts,
        industry: lead.industry ?? (typeof scrape.facts.industry === "string" ? scrape.facts.industry : null),
        pagespeedMobile: scrape.pagespeed_mobile,
      });

      await admin
        .from("scrape_results")
        .update({ facts: { ...scrape.facts, lead_value: value } })
        .eq("lead_id", lead_id);

      console.log(`[scrape-run] lead value for ${lead_id}: ${value.tier} (${value.score}/100)`);
      return { tier: value.tier, score: value.score };
    });

    await step.run("mark-scrape-complete", async () => {
      await admin.from("leads").update({ status: "ready" }).eq("id", lead_id);
      await admin.from("build_jobs").update({ status: "complete", pages_done: 1 }).eq("lead_id", lead_id).eq("stage", "scrape");
    });

    return { lead_id, status: "ready_for_operator_studio" };
  }
);
