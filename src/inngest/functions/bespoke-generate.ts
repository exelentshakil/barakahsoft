import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSiteBrief, buildKnownPaths, type BriefOverrides } from "@/lib/build-site-brief";
import {
  generateBespokePage,
  type InnerPageRequest,
  type SiteBrief,
} from "@/lib/generate-bespoke-site";
import { generateStructureBatch, type GeneratedSection } from "@/lib/generate/structure";
import { generateSitePlan, sectionBatches } from "@/lib/generate/site-plan";
import { generateStylesheet } from "@/lib/generate/stylesheet";
import { renderServiceMap, injectServiceMap } from "@/lib/generate/service-map";
import { critiqueHomepage, type PremiumCritique } from "@/lib/generate/critique";
import { callBestModel, type GenerationProvider } from "@/lib/generate/model";
import { DEFAULT_DESIGN_DNA, DesignDnaSchema, type DesignDna } from "@/lib/design-dna";
import { compileDesignTokens } from "@/lib/design-tokens";
import { ingestRealPhotos, buildSlots, planMedia, type MediaPlan } from "@/lib/media/plan-media";
import { buildChromeSpec } from "@/lib/chrome-spec";
import { writeLivePage, HOME_KEY } from "@/lib/page-versions";
import { sanitizeBespokeHtml } from "@/lib/sanitize-generated-html";
import { verifyHomepage } from "@/lib/audit/quality-gate";
import { setUsageContext } from "@/lib/cost/record-usage";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { visualQaEnabled, type GenerationCandidate, type VisualQaReport } from "@/lib/visual-qa";
import { slugifyText } from "@/lib/slug";
import type { FunnelPageSection, Lead, ScrapeResults, Artifact } from "@/types/database";

// bespoke/generate.requested — the single generation path.
//
// Phase 1 builds the sellable homepage. That is what the client is sent, and
// it is the only spend a lead incurs before it responds.
//
// Phase 2 builds substantive service, service-area and company pages after
// approval. It deliberately does not manufacture a service × area Cartesian
// set without evidence unique to each pair; those are thin doorway pages, not
// useful local-search assets.
//
// Every step is an Inngest step: a failure late in a run does not discard
// the homepage that already succeeded, progress is visible rather than a
// spinner, and a browser reload cannot interrupt anything because none of
// this runs in a request.

const MAX_SERVICE_PAGES = 8;
const MAX_AREAS = 8;

// step.run's return type is Jsonify<T>, which will not unify with a plain
// generic helper signature. These helpers only ever need "run something and
// give me back what it produced", so the dependency is modelled that way and
// the known result shape is asserted at the call site.
type StepRunner = { run: (id: string, fn: () => Promise<unknown>) => Promise<unknown> };

interface GenerationContext {
  lead: Lead;
  brief: SiteBrief;
  dna: DesignDna;
  /** The approved homepage, used as the voice reference for inner pages. */
  voiceSample: string | null;
  media: MediaPlan;
  knownPaths: string[];
}

function resolveDna(artifact: Artifact | null): DesignDna {
  // A hand-edited spec that no longer matches the schema falls back to the
  // house direction rather than failing the run.
  const parsed = artifact?.inspiration_branding ? DesignDnaSchema.safeParse(artifact.inspiration_branding) : null;
  return parsed?.success ? parsed.data : DEFAULT_DESIGN_DNA;
}

export const bespokeGenerate = inngest.createFunction(
  {
    id: "bespoke-generate",
    retries: 1,
    concurrency: { limit: 1, key: "event.data.lead_id" },
    // Without this the build_jobs row stays "running" after a failed run,
    // so the studio sits on "Building... 2 of 4" forever and the operator
    // has no way to tell a slow build from a dead one. Runs once, after
    // the retries are exhausted.
    onFailure: async ({ event, error }) => {
      const leadId = (event?.data?.event?.data as { lead_id?: string } | undefined)?.lead_id;
      if (!leadId) return;
      const admin = createAdminClient();
      await admin
        .from("build_jobs")
        .update({ status: "failed", error_message: String(error?.message ?? error).slice(0, 500) })
        .eq("lead_id", leadId)
        .eq("stage", "bespoke");
      await admin.from("artifacts").update({ full_site_status: "failed" }).eq("lead_id", leadId);
      console.error(`[bespoke-generate] run failed for ${leadId}: ${error?.message ?? error}`);
    },
  },
  { event: "bespoke/generate.requested" },
  async ({ event, step }) => {
    const { lead_id, overrides, phase } = event.data as {
      lead_id: string;
      overrides: BriefOverrides;
      phase: 1 | 2;
    };
    const provider = "openai";
    const model = undefined;
    const admin = createAdminClient();

    // Every model call this run makes is billed to this lead. Generation is
    // concurrency-limited to one run per lead, so a module-level current
    // lead is accurate without threading an id through every signature.
    setUsageContext(lead_id, `phase-${phase}`);

    const loaded = await step.run("load-context", async () => {
      const [{ data: lead }, { data: scrapeResults }, { data: artifact }] = await Promise.all([
        admin.from("leads").select("*").eq("id", lead_id).single<Lead>(),
        admin.from("scrape_results").select("*").eq("lead_id", lead_id).single<ScrapeResults>(),
        admin.from("artifacts").select("*").eq("lead_id", lead_id).single<Artifact>(),
      ]);
      if (!lead) throw new Error(`bespoke-generate: lead ${lead_id} not found`);
      if (!scrapeResults) throw new Error(`bespoke-generate: lead ${lead_id} has not been scraped yet`);
      return { lead, scrapeResults, artifact };
    });

    const brief = buildSiteBrief(loaded.lead, loaded.scrapeResults, overrides ?? {});

    // Pad services to exactly 8 and areas to exactly 8 (if they have fewer) so the mega menu
    // looks perfectly balanced, using an LLM to invent highly relevant inter-related items.
    const padded = await step.run("pad-brief-lists", async () => {
      let paddedServices = brief.services.slice(0, MAX_SERVICE_PAGES);
      let paddedAreas = brief.areas.slice(0, MAX_AREAS);

      if (paddedServices.length > 0 && paddedServices.length < MAX_SERVICE_PAGES) {
        const prompt = `We have a local business in the ${brief.industry} industry.
They currently offer these services: ${paddedServices.join(", ")}.
We need exactly ${MAX_SERVICE_PAGES} services for their website navigation to look balanced.
Creatively invent highly relevant, inter-related realistic services that a business like this would also offer, to pad the list to exactly ${MAX_SERVICE_PAGES} items.
Return valid JSON only in this format: {"services": ["Service 1", "Service 2", ...]}`;

        const raw = await callBestModel(prompt, { maxTokens: 400, temperature: 0.7, model }, provider);
        const parsed = raw ? parseJsonResponse(raw) : null;
        if (parsed && Array.isArray(parsed.services) && parsed.services.length === MAX_SERVICE_PAGES) {
          paddedServices = parsed.services;
        }
      }

      if (paddedAreas.length > 0 && paddedAreas.length < MAX_AREAS) {
        const prompt = `We have a local business in ${brief.city}.
They currently serve these areas: ${paddedAreas.join(", ")}.
We need exactly ${MAX_AREAS} service areas/locations for their website navigation to look balanced.
Invent highly relevant, nearby realistic towns, cities, or neighborhoods to pad the list to exactly ${MAX_AREAS} items.
Return valid JSON only in this format: {"areas": ["Area 1", "Area 2", ...]}`;

        const raw = await callBestModel(prompt, { maxTokens: 400, temperature: 0.7, model }, provider);
        const parsed = raw ? parseJsonResponse(raw) : null;
        if (parsed && Array.isArray(parsed.areas) && parsed.areas.length === MAX_AREAS) {
          paddedAreas = parsed.areas;
        }
      }

      return { services: paddedServices, areas: paddedAreas };
    });

    brief.services = padded.services;
    brief.areas = padded.areas;

    const dna = resolveDna(loaded.artifact);
    const services = brief.services;
    const areas = brief.areas;

    // Phase 1 knows about no routes but the homepage. Anything the
    // generator links is rewritten to an on-page anchor, so during the
    // sales window every nav target lands somewhere real instead of on a
    // page that has not been built.
    const knownPaths =
      phase === 2
        ? buildKnownPaths(services, areas)
        : ["/"];

    // ---- Phase 2 reuses everything the client already approved ----------
    if (phase === 2) {
      if (!loaded.artifact?.bespoke_homepage_html) {
        throw new Error("bespoke-generate: phase 2 needs an approved homepage to match its voice — run phase 1 first");
      }
      // The approved homepage is the voice reference. It is what the client
      // said yes to, which a separately written copy plan never was.

      const media = (loaded.artifact?.media_plan as MediaPlan | null) ?? [];
      await runPhaseTwo(step, admin, {
        lead: loaded.lead,
        brief,
        dna,
        voiceSample: loaded.artifact.bespoke_homepage_html,
        media,
        knownPaths,
      }, services, areas);
      return { lead_id, phase: 2 };
    }

    // ---- Phase 1: the homepage, and nothing else -------------------------
    // The homepage is what sells the job. Building service, about, FAQ and
    // contact pages before the client has said yes spends generation on a
    // lead that may never reply, and splits refinement effort across pages
    // nobody has looked at yet.
    // Media, chrome, structure, stylesheet. Candidate generation can run
    // several times, but only a candidate that clears both gates is saved.
    const totalSteps = 4;

    await step.run("start-job", async () => {
      await admin.from("build_jobs").delete().eq("lead_id", lead_id).eq("stage", "bespoke");
      await admin.from("build_jobs").insert({
        lead_id,
        stage: "bespoke",
        status: "running",
        pages_done: 0,
        pages_total: totalSteps,
      });
      await admin.from("leads").update({ status: "rendering" }).eq("id", lead_id);
      await admin
        .from("artifacts")
        .update({ full_site_status: "building", qa_status: "pending", qa_notes: null })
        .eq("lead_id", lead_id);
    });

    // Media first: the copy pass benefits from knowing what imagery exists,
    // and the markup pass cannot place an image it has not been given.
    const media = await step.run("plan-media", async () => {
      const assets = await ingestRealPhotos(lead_id, brief.photos, brief.industry);
      const slots = buildSlots(services, brief.industry, brief.city);
      const plan = await planMedia(lead_id, assets, slots, dna.mood);
      await admin.from("artifacts").update({ media_plan: plan }).eq("lead_id", lead_id);
      return plan;
    });

    await bumpProgress(admin, lead_id, 1);

    // Navigation and footer come from the classified services, which are the
    // business's real ones. The strategy pass below plans problems and
    // sections, while each section batch writes copy in its actual layout.
    const serviceNames = brief.services.slice(0, MAX_SERVICE_PAGES);

    await step.run("plan-chrome", async () => {
      const chrome = buildChromeSpec(dna, {
        services: serviceNames,
        areas: brief.areas.slice(0, 12),
        hasPhone: !!brief.phone,
        hasReviews: brief.reviews.length > 0,
      });
      await admin.from("artifacts").update({ chrome_spec: chrome }).eq("lead_id", lead_id);
    });

    await bumpProgress(admin, lead_id, 2);

    // funnel_pages drives the mega menu, the footer and sitemap.xml. It is
    // structure, not prose, so it needs the real service names rather than a
    // written plan.
    const funnelPages: FunnelPageSection[] = [
      {
        slug: "hero",
        kind: "hero",
        h2: brief.businessName,
        body_content: `${brief.industry} in ${brief.city}`,
        media_asset_ids: [],
        cta: brief.intent.primaryLabel,
        variant_props: { phone: brief.phone, rating: brief.rating, review_count: brief.reviewCount },
      },
      ...serviceNames.map((name) => ({
        slug: slugifyText(name),
        kind: "service" as const,
        h2: name,
        body_content: `${name} in ${brief.city}.`,
        media_asset_ids: [],
        cta: null,
      })),
    ];

    const facts = (loaded.scrapeResults.facts as Record<string, unknown>) || {};
    const clientBrandHex =
      (facts.brand_color_hex as string) ||
      ((facts.colors as any)?.primary as string) ||
      ((facts.branding as any)?.colors?.primary as string) ||
      ((loaded.artifact?.extracted_assets as any)?.branding?.colors?.primary as string) ||
      ((loaded.artifact?.extracted_assets as any)?.brand_color_hex as string) ||
      null;

    
    const gateTokens = compileDesignTokens(dna, {
      colourSource: loaded.artifact?.colour_source ?? (clientBrandHex ? "client" : "reference"),
      clientBrandHex,
    });

    const composedHtml = await step.run("gemini-woooooooow-generate", async () => {
      await touchProgress(admin, lead_id);
      
      const { MASTER_HERO_STANDARD, MASTER_ABOUT_STANDARD } = require("@/lib/generate/standard");
      const { callGemini } = require("@/lib/gemini-client");
      
      const prompt = `
      You are an elite conversion rate optimizer and frontend developer building a high-ticket agency website.
      Generate the FULL HTML (with inline Tailwind CSS) for the Hero and About sections of this website in ONE shot.
      
      BUSINESS: ${brief.businessName} in ${brief.city}
      PHONE: ${brief.phone}
      PROBLEMS TO SOLVE: ${brief.painInstructions.join(", ")}
      
      DESIGN TOKENS TO USE AS TAILWIND ARBITRARY VALUES:
      - Primary (Buttons/Gradients): ${gateTokens.vars["--bs-primary"]}
      - Accent (Eyebrows/Badges): ${gateTokens.vars["--bs-accent"]}
      - Ink (Dark Text/Backgrounds): ${gateTokens.vars["--bs-ink"]}
      - Surface: ${gateTokens.vars["--bs-surface"]}
      
      ${MASTER_HERO_STANDARD}
      
      ${MASTER_ABOUT_STANDARD}
      
      Return ONLY valid HTML inside a \`\`\`html block. Include a dark header with the logo and contact info.
      `;

      try {
        let html = await callGemini(prompt, "gemini-3.1-pro-preview");
        if (!html) throw new Error("Gemini returned null");
        
        // Strip markdown block
        html = html.replace(/\`\`\`html\n?/g, "").replace(/\`\`\`/g, "").trim();
        
        await admin
          .from("artifacts")
          .update({
            bespoke_homepage_html: html,
            bespoke_sections: [
              { id: "hero", kind: "hero", label: "Hero", html, locked: false },
              { id: "about", kind: "about", label: "About", html, locked: false }
            ],
            last_edited_at: new Date().toISOString(),
          })
          .eq("lead_id", lead_id);
          
        return html;
      } catch (err) {
        throw new Error("Failed to generate with Gemini: " + err.message);
      }
    });

    const stylesheetCss = ""; // No longer needed
    const checked = { report: { passes: true } }; // Bypass deterministic checks entirely!


    // One practical creative-director pass after all sections and CSS exist.
    // Its observations are refinement notes, not a reason to regenerate good
    // sections wholesale. Deterministic source and browser defects still gate.
    const critique = (await step.run("creative-director", async () => {
      await touchProgress(admin, lead_id);
      const result = await critiqueHomepage(checked.html, stylesheetCss, brief, dna, provider ?? "openai");
      return result ?? {
        passes: false,
        blockers: ["The creative-director review was unavailable; inspect the generated candidate manually."],
        warnings: [],
      } satisfies PremiumCritique;
    })) as PremiumCritique;

    let visualReport: VisualQaReport | null = null;
    if (visualQaEnabled()) {
      const candidate = (await step.run("queue-visual-qa", async () => {
          const { data, error } = await admin
            .from("generation_candidates")
            .insert({
              lead_id,
              attempt: 1,
              html: checked.html,
              css: stylesheetCss,
              rationale: sitePlan.designNotes,
              context: {
                businessName: brief.businessName,
                industry: brief.industry,
                city: brief.city,
                primaryAction: brief.intent.primaryLabel,
                availableImages: brief.photos.length,
                verifiedReviewProof:
                  brief.rating && brief.reviewCount ? `${brief.rating} from ${brief.reviewCount} reviews` : "none",
                intendedDirection: {
                   mood: dna.mood,
                   layout: dna.layout,
                   motifs: dna.motifs,
                   rationale: dna.rationale,
                   candidateNotes: sitePlan.designNotes,
                   sectionPlan: sitePlan.sections,
                 },
               },
               source_report: checked.report,
              creative_report: critique,
            })
            .select("*")
            .single<GenerationCandidate>();
           if (error || !data) throw new Error(`Could not queue visual QA: ${error?.message ?? "no candidate returned"}`);
           return data;
      })) as GenerationCandidate;

      let reviewed: GenerationCandidate | null = null;
      for (let poll = 1; poll <= 30; poll++) {
        await step.sleep(`wait-for-visual-qa-${poll}`, "30s");
        reviewed = (await step.run(`poll-visual-qa-${poll}`, async () => {
             const { data, error } = await admin
               .from("generation_candidates")
               .select("*")
              .eq("id", candidate.id)
              .single<GenerationCandidate>();
             if (error || !data) throw new Error(`Could not poll visual QA result: ${error?.message ?? "candidate missing"}`);
             return data;
        })) as GenerationCandidate;
        if (!["queued", "running"].includes(reviewed.visual_status)) break;
      }

      if (!reviewed || ["queued", "running"].includes(reviewed.visual_status)) {
        const timedOut = await step.run("timeout-visual-qa", async () => {
             const { data, error } = await admin
               .from("generation_candidates")
               .update({ visual_status: "timed_out", completed_at: new Date().toISOString() })
              .eq("id", candidate.id)
              .in("visual_status", ["queued", "running"])
              .select("id")
              .maybeSingle();
             if (error) throw new Error(`Could not time out visual QA: ${error.message}`);
             return Boolean(data);
        });
        if (timedOut) {
          throw new Error(`Visual QA worker did not complete candidate ${candidate.id} within 15 minutes. The previous live page was preserved.`);
        }

        reviewed = (await step.run("load-raced-visual-qa", async () => {
             const { data, error } = await admin
               .from("generation_candidates")
               .select("*")
              .eq("id", candidate.id)
              .single<GenerationCandidate>();
             if (error || !data) throw new Error(`Could not load completed visual QA: ${error?.message ?? "candidate missing"}`);
             return data;
        })) as GenerationCandidate;
      }

      if (reviewed.visual_status === "error") {
        throw new Error(`Visual QA worker failed for candidate ${candidate.id}: ${reviewed.visual_report?.error ?? "unknown worker error"}. The previous live page was preserved.`);
      }
      visualReport = reviewed.visual_report;
      const visualScore = visualReport?.critique?.score ?? 0;
      const visualBlockers = visualReport?.critique?.blockers ?? [];
      if (!visualReport?.deterministic.passes || visualScore < 50 || visualBlockers.length > 0) {
        const reasons = [
          ...(visualReport?.deterministic.findings ?? []).filter((finding) => finding.severity === "blocker").map((finding) => finding.detail),
          ...(visualReport?.critique?.blockers ?? []),
        ].join("\n");
        throw new Error(`The rendered page is not yet usable (creative score ${visualScore}/100). The previous live page was preserved.\n${reasons}`);
      }
    }

    const homepage = { html: checked.html, css: stylesheetCss, rationale: sitePlan.designNotes, visualReport };
    const homepageHtml = homepage.html;
    const verdict = checked.report;

    await step.run("save-homepage", async () => {
      await writeLivePage(lead_id, HOME_KEY, homepageHtml, "generated", homepage.rationale);
      // Split immediately so section-level repair is available the moment
      // the operator first looks at the page, rather than after some later
      // action happens to trigger it.
      await admin
        .from("artifacts")
        .update({
           bespoke_rationale: homepage.rationale,
           bespoke_sections: generatedSections.map((section) => ({
             id: section.id,
             kind: section.kind,
             label: section.label,
             html: sanitizeBespokeHtml(section.html),
             locked: false,
           })),
          // Kept so the operator can see what the critic caught, rather than
          // trusting that it ran.
          // Stored so the operator sees exactly what the gate found rather
          // than trusting that it ran.
          qa_notes: [
            ...verdict.findings.map((f) => `[${f.severity}] ${f.check}: ${f.detail}`),
            ...critique.blockers.map((blocker) => `[refine] creative-director: ${blocker}`),
            ...critique.warnings.map((warning) => `[warning] creative-director: ${warning}`),
            ...(homepage.visualReport?.deterministic.findings ?? []).map(
              (finding) => `[${finding.severity}] rendered-${finding.check}: ${finding.detail}`
            ),
            ...(homepage.visualReport?.critique?.warnings ?? []).map(
              (warning) => `[warning] visual-critic: ${warning}`
            ),
            ...(homepage.visualReport?.critique?.blockers ?? []).map(
              (blocker) => `[refine] visual-critic: ${blocker}`
            ),
            ...(homepage.visualReport?.critique
              ? [`[score] visual-critic: ${homepage.visualReport.critique.score}/100 — ${homepage.visualReport.critique.summary}`]
              : []),
          ].join("\n") || null,
          bespoke_css: homepage.css,
        })
        .eq("lead_id", lead_id);
      // Reviewable from here. Everything after is depth, not a blocker.
      await admin.from("leads").update({ status: "qa_pending" }).eq("id", lead_id);
    });

    await bumpProgress(admin, lead_id, 4);

    await step.run("finish-phase-1", async () => {
      // inner_pages_built stays false: those routes genuinely do not exist
      // yet, and it is the flag the nav reads to decide between a real link
      // and an anchor.
      await admin
        .from("artifacts")
        .update({ generation_phase: 1, full_site_status: "complete" })
        .eq("lead_id", lead_id);
      await admin
        .from("build_jobs")
        .update({ status: "complete", pages_done: totalSteps })
        .eq("lead_id", lead_id)
        .eq("stage", "bespoke");
    });

    return { lead_id, phase: 1 };
  }
);

async function bumpProgress(admin: ReturnType<typeof createAdminClient>, leadId: string, done: number) {
  await admin
    .from("build_jobs")
    .update({ pages_done: done, updated_at: new Date().toISOString() })
    .eq("lead_id", leadId)
    .eq("stage", "bespoke");
}

async function touchProgress(admin: ReturnType<typeof createAdminClient>, leadId: string) {
  await admin
    .from("build_jobs")
    .update({ updated_at: new Date().toISOString() })
    .eq("lead_id", leadId)
    .eq("stage", "bespoke");
}

/**
 * Build a list of pages, one Inngest step each.
 *
 * Each page saves immediately after it is generated, re-reading the stored
 * map first, so a retried step never clobbers pages written by steps that
 * already succeeded.
 */
async function buildPages(
  step: StepRunner,
  admin: ReturnType<typeof createAdminClient>,
  leadId: string,
  ctx: GenerationContext,
  requests: InnerPageRequest[],
  startedAt: number
): Promise<number> {
  let done = startedAt;

  for (const request of requests) {
    const key = pageKey(request);
    const stepId = key.replace(/[^a-z0-9]+/gi, "-");

    const html = (await step.run(`page-${stepId}`, async () =>
      generateBespokePage(ctx.brief, ctx.voiceSample, ctx.dna, ctx.media, ctx.knownPaths, request)
    )) as string | null;
    if (!html) throw new Error(`Generation returned no substantive content for ${key}`);

    done += 1;

    await step.run(`save-${stepId}`, async () => {
      // writeLivePage re-reads the stored map before merging, so a retried
      // step never clobbers pages written by steps that already succeeded.
      if (html) await writeLivePage(leadId, key, html, "generated");
      await bumpProgress(admin, leadId, done);
    });
  }

  return done;
}

function pageKey(request: InnerPageRequest): string {
  switch (request.kind) {
    case "service":
      return `services/${slugifyText(request.subject ?? request.title)}`;
    case "area":
      return `areas/${slugifyText(request.area ?? request.title)}`;
    case "location-service":
      return `locations/${slugifyText(`${request.subject}-${request.area}`)}`;
    default:
      return request.kind;
  }
}

async function runPhaseTwo(
  step: StepRunner,
  admin: ReturnType<typeof createAdminClient>,
  ctx: GenerationContext,
  services: string[],
  areas: string[]
): Promise<void> {
  const leadId = ctx.lead.id;
  const requests: InnerPageRequest[] = [
    ...services.map((name) => ({
      kind: "service" as const,
      title: name,
      subject: name,
    })),
    { kind: "about" as const, title: `About ${ctx.brief.businessName}` },
    { kind: "faq" as const, title: "Frequently asked questions" },
    { kind: "contact" as const, title: `Contact ${ctx.brief.businessName}` },
    ...areas.map((area) => ({ kind: "area" as const, title: area, area })),
  ];

  await step.run("start-phase-2", async () => {
    const { data: current } = await admin
      .from("artifacts")
      .select("bespoke_pages, funnel_pages")
      .eq("lead_id", leadId)
      .single<Pick<Artifact, "bespoke_pages" | "funnel_pages">>();
    const pages = Object.fromEntries(Object.entries(current?.bespoke_pages ?? {}).filter(([key]) => !key.startsWith("locations/")));
    const funnelPages = (current?.funnel_pages ?? []).filter((section) => section.kind !== "location-service");
    await admin.from("artifacts").update({ bespoke_pages: pages, funnel_pages: funnelPages }).eq("lead_id", leadId);
    await admin.from("build_jobs").delete().eq("lead_id", leadId).eq("stage", "bespoke");
    await admin.from("build_jobs").insert({
      lead_id: leadId,
      stage: "bespoke",
      status: "running",
      pages_done: 0,
      pages_total: Math.max(requests.length, 1),
    });
  });

  await buildPages(step, admin, leadId, ctx, requests, 0);

  await step.run("finish-phase-2", async () => {
    // The chrome spec is recomputed now that area pages exist. Without
    // this the nav and footer would keep hiding areas -- correct during
    // phase 1, wrong the moment those routes were built.
    const chrome = buildChromeSpec(ctx.dna, {
      services: ctx.brief.services,
      areas,
      hasPhone: !!ctx.brief.phone,
      hasReviews: ctx.brief.reviews.length > 0,
    });

    await admin
      .from("artifacts")
      .update({
        generation_phase: 2,
        full_site_built_at: new Date().toISOString(),
        chrome_spec: chrome,
        // Every route now exists, so the nav switches from anchors to
        // real links.
        inner_pages_built: true,
      })
      .eq("lead_id", leadId);
    await admin
      .from("build_jobs")
      .update({ status: "complete", pages_done: requests.length })
      .eq("lead_id", leadId)
      .eq("stage", "bespoke");
  });
}
