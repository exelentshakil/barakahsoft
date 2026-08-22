import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSiteBrief, buildKnownPaths, type BriefOverrides } from "@/lib/build-site-brief";
import { generateBespokeHomepage, generateBespokePage } from "@/lib/generate-bespoke-site";
import { DEFAULT_DESIGN_DNA, DesignDnaSchema, type DesignDna } from "@/lib/design-dna";
import { compileDesignTokens } from "@/lib/design-tokens";
import { slugifyText } from "@/lib/slug";
import type { FunnelPageSection, Lead, ScrapeResults, Artifact } from "@/types/database";

// bespoke/generate.requested — the real generator behind the Studio's
// generate button.
//
// This runs as a background job rather than inside the request for a
// structural reason: a homepage is a large model call plus a critique pass
// plus a revise pass, and every inner page is another call. That is minutes
// of work, well past any serverless request ceiling. Each step below is an
// Inngest step, so a failure late in the run does not discard the homepage
// that already succeeded, and the operator sees real progress rather than a
// spinner.
//
// Order matters. The homepage is generated FIRST and committed on its own,
// because it is the artefact that sells the deal — the operator can review
// and send it while the inner pages are still building.

const HOMEPAGE_STEPS = 1;

export const bespokeGenerate = inngest.createFunction(
  { id: "bespoke-generate", retries: 1 },
  { event: "bespoke/generate.requested" },
  async ({ event, step }) => {
    const { lead_id, overrides } = event.data as { lead_id: string; overrides: BriefOverrides };
    const admin = createAdminClient();

    const context = await step.run("load-context", async () => {
      const [{ data: lead }, { data: scrapeResults }, { data: artifact }] = await Promise.all([
        admin.from("leads").select("*").eq("id", lead_id).single<Lead>(),
        admin.from("scrape_results").select("*").eq("lead_id", lead_id).single<ScrapeResults>(),
        admin.from("artifacts").select("*").eq("lead_id", lead_id).single<Artifact>(),
      ]);
      if (!lead) throw new Error(`bespoke-generate: lead ${lead_id} not found`);
      if (!scrapeResults) throw new Error(`bespoke-generate: lead ${lead_id} has not been scraped yet`);
      return { lead, scrapeResults, artifact };
    });

    const brief = buildSiteBrief(context.lead, context.scrapeResults, overrides ?? {});
    const knownPaths = buildKnownPaths(brief.services, brief.areas);

    // A hand-edited spec that no longer matches the schema should fall back
    // to the house default rather than fail the whole run.
    const parsedDna = context.artifact?.inspiration_branding
      ? DesignDnaSchema.safeParse(context.artifact.inspiration_branding)
      : null;
    const dna: DesignDna = parsedDna?.success ? parsedDna.data : DEFAULT_DESIGN_DNA;

    const innerPageCount = Math.min(brief.services.length, 6) + 3; // services + about/faq/contact

    await step.run("start-job", async () => {
      await admin.from("build_jobs").delete().eq("lead_id", lead_id).eq("stage", "bespoke");
      await admin.from("build_jobs").insert({
        lead_id,
        stage: "bespoke",
        status: "running",
        pages_done: 0,
        pages_total: HOMEPAGE_STEPS + innerPageCount,
      });
      await admin.from("leads").update({ status: "rendering" }).eq("id", lead_id);
    });

    // ---- Structured sections -------------------------------------------
    // The mega menu, footer, sitemap.xml and JSON-LD all read funnel_pages,
    // not the generated markup. Writing real sections here is what stops
    // the nav from being empty or pointing at pages that do not exist —
    // the "blank header with bad whitespace" failure.
    const funnelPages: FunnelPageSection[] = [
      {
        slug: "hero",
        kind: "hero",
        h2: `${brief.businessName}`,
        body_content: brief.factsDigest.slice(0, 240),
        media_asset_ids: [],
        cta: "Get a free quote",
        variant_props: { phone: brief.phone, rating: brief.rating, review_count: brief.reviewCount },
      },
      ...brief.services.slice(0, 6).map((name) => ({
        slug: slugifyText(name),
        kind: "service" as const,
        h2: name,
        body_content: `${name} in ${brief.city}.`,
        media_asset_ids: [],
        cta: `About ${name}`,
      })),
    ];

    await step.run("save-sections", async () => {
      await admin.from("artifacts").update({
        funnel_pages: funnelPages,
        design_tokens: compileDesignTokens(dna),
        inspiration_branding: dna,
        full_site_status: "building",
      }).eq("lead_id", lead_id);
    });

    // ---- Homepage -------------------------------------------------------
    const homepage = await step.run("generate-homepage", async () => {
      const result = await generateBespokeHomepage(brief, dna, knownPaths);
      if (!result) throw new Error("Homepage generation returned nothing — check OPENAI_API_KEY and model access");
      return result;
    });

    await step.run("save-homepage", async () => {
      await admin.from("artifacts").update({
        bespoke_homepage_html: homepage.html,
        bespoke_rationale: homepage.rationale,
        last_edited_at: new Date().toISOString(),
      }).eq("lead_id", lead_id);

      await admin.from("build_jobs").update({ pages_done: HOMEPAGE_STEPS }).eq("lead_id", lead_id).eq("stage", "bespoke");

      // The operator can review and send from here. Everything after this
      // point is additive depth, not a blocker.
      await admin.from("leads").update({ status: "qa_pending" }).eq("id", lead_id);
    });

    // ---- Inner pages ----------------------------------------------------
    // Each page is its own Inngest step so one failed page does not lose the
    // others, and progress advances visibly rather than in one jump.
    const pageJobs: { key: string; kind: "service" | "about" | "faq" | "contact"; title: string; subject?: string }[] = [
      ...brief.services.slice(0, 6).map((name) => ({
        key: `services/${slugifyText(name)}`,
        kind: "service" as const,
        title: name,
        subject: name,
      })),
      { key: "about", kind: "about", title: `About ${brief.businessName}` },
      { key: "faq", kind: "faq", title: "Frequently asked questions" },
      { key: "contact", kind: "contact", title: `Contact ${brief.businessName}` },
    ];

    let done = HOMEPAGE_STEPS;
    const built: Record<string, string> = {};

    for (const job of pageJobs) {
      const html = await step.run(`generate-page-${job.key.replace(/\//g, "-")}`, async () => {
        return await generateBespokePage(brief, dna, knownPaths, {
          kind: job.kind,
          title: job.title,
          subject: job.subject,
        });
      });

      done += 1;
      if (html) built[job.key] = html;

      await step.run(`save-page-${job.key.replace(/\//g, "-")}`, async () => {
        // Re-read rather than accumulating in memory: a retried step must
        // not clobber pages written by steps that already succeeded.
        const { data: current } = await admin
          .from("artifacts")
          .select("bespoke_pages")
          .eq("lead_id", lead_id)
          .single<{ bespoke_pages: Record<string, string> }>();

        await admin.from("artifacts").update({
          bespoke_pages: { ...(current?.bespoke_pages ?? {}), ...built },
        }).eq("lead_id", lead_id);

        await admin.from("build_jobs").update({ pages_done: done }).eq("lead_id", lead_id).eq("stage", "bespoke");
      });
    }

    await step.run("finish-job", async () => {
      await admin.from("artifacts").update({
        full_site_status: "complete",
        full_site_built_at: new Date().toISOString(),
        inner_pages_built: true,
      }).eq("lead_id", lead_id);

      await admin.from("build_jobs").update({ status: "complete", pages_done: done }).eq("lead_id", lead_id).eq("stage", "bespoke");
    });

    return { lead_id, pagesBuilt: Object.keys(built).length + HOMEPAGE_STEPS };
  }
);
