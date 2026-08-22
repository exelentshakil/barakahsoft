import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSiteBrief, buildKnownPaths, type BriefOverrides } from "@/lib/build-site-brief";
import {
  generateBespokeHomepage,
  generateBespokePage,
  type InnerPageRequest,
  type SiteBrief,
} from "@/lib/generate-bespoke-site";
import { generateCopyPlan, critiqueCopyPlan, CopyPlanSchema, type CopyPlan } from "@/lib/generate-copy-plan";
import { DEFAULT_DESIGN_DNA, DesignDnaSchema, type DesignDna } from "@/lib/design-dna";
import { compileDesignTokens } from "@/lib/design-tokens";
import { ingestRealPhotos, buildSlots, planMedia, type MediaPlan } from "@/lib/media/plan-media";
import { buildChromeSpec } from "@/lib/chrome-spec";
import { writeLivePage, HOME_KEY } from "@/lib/page-versions";
import { slugifyText } from "@/lib/slug";
import type { FunnelPageSection, Lead, ScrapeResults, Artifact } from "@/types/database";

// bespoke/generate.requested — the single generation path.
//
// Phase 1 builds the sellable core: homepage, every service page, about,
// FAQ, contact. That is what the client is sent, and it is the only spend a
// lead incurs before it responds.
//
// Phase 2 builds the rest — location×service pages, service areas, the blog
// — and is triggered explicitly after the client approves, so deep spend
// only happens on leads that convert.
//
// Every step is an Inngest step: a failure late in a run does not discard
// the homepage that already succeeded, progress is visible rather than a
// spinner, and a browser reload cannot interrupt anything because none of
// this runs in a request.

const MAX_SERVICE_PAGES = 8;
const MAX_AREAS = 12;
const MAX_LOCATION_PAGES = 24;

// step.run's return type is Jsonify<T>, which will not unify with a plain
// generic helper signature. These helpers only ever need "run something and
// give me back what it produced", so the dependency is modelled that way and
// the known result shape is asserted at the call site.
type StepRunner = { run: (id: string, fn: () => Promise<unknown>) => Promise<unknown> };

interface GenerationContext {
  lead: Lead;
  brief: SiteBrief;
  dna: DesignDna;
  copy: CopyPlan;
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
  { id: "bespoke-generate", retries: 1 },
  { event: "bespoke/generate.requested" },
  async ({ event, step }) => {
    const { lead_id, overrides, phase } = event.data as {
      lead_id: string;
      overrides: BriefOverrides;
      phase: 1 | 2;
    };
    const admin = createAdminClient();

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
    const dna = resolveDna(loaded.artifact);
    const services = brief.services.slice(0, MAX_SERVICE_PAGES);
    const areas = brief.areas.slice(0, MAX_AREAS);

    // Phase 1 knows about no routes but the homepage. Anything the
    // generator links is rewritten to an on-page anchor, so during the
    // sales window every nav target lands somewhere real instead of on a
    // page that has not been built.
    const knownPaths =
      phase === 2
        ? buildKnownPaths(services, areas, { blog: true, locationServices: buildLocationPairs(services, areas) })
        : ["/"];

    // ---- Phase 2 reuses everything the client already approved ----------
    if (phase === 2) {
      const storedCopy = loaded.artifact?.copy_plan ? CopyPlanSchema.safeParse(loaded.artifact.copy_plan) : null;
      if (!storedCopy?.success) {
        throw new Error("bespoke-generate: phase 2 requires an approved phase 1 copy plan — run phase 1 first");
      }
      const media = (loaded.artifact?.media_plan as MediaPlan | null) ?? [];
      await runPhaseTwo(step, admin, {
        lead: loaded.lead,
        brief,
        dna,
        copy: storedCopy.data,
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
    const totalSteps = 4; // media, copy, chrome, homepage

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
      await admin.from("artifacts").update({ full_site_status: "building" }).eq("lead_id", lead_id);
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

    const copy = await step.run("write-copy", async () => {
      const draft = await generateCopyPlan(brief, dna);
      if (!draft) throw new Error("Copy generation returned nothing — check OPENAI_API_KEY and model access");
      // The editor pass is allowed to fail without failing the run; a good
      // draft beats no page.
      const edited = (await critiqueCopyPlan(draft, brief)) ?? draft;
      await admin.from("artifacts").update({ copy_plan: edited }).eq("lead_id", lead_id);
      return edited;
    });

    await bumpProgress(admin, lead_id, 2);

    // The nav and footer are per-lead designs too, derived from the same
    // DNA — a generic header on a bespoke page is the loudest possible tell
    // that the page came off a production line.
    await step.run("plan-chrome", async () => {
      const chrome = buildChromeSpec(dna, {
        services: copy.services.map((s) => s.name),
        areas: [],
        hasPhone: !!brief.phone,
        hasReviews: brief.reviews.length > 0,
      });
      await admin.from("artifacts").update({ chrome_spec: chrome }).eq("lead_id", lead_id);
    });

    await bumpProgress(admin, lead_id, 3);

    const funnelPages: FunnelPageSection[] = [
      {
        slug: "hero",
        kind: "hero",
        h2: copy.headline,
        body_content: copy.subhead,
        media_asset_ids: [],
        cta: copy.heroCta,
        variant_props: { phone: brief.phone, rating: brief.rating, review_count: brief.reviewCount },
      },
      ...copy.services.slice(0, MAX_SERVICE_PAGES).map((service) => ({
        slug: slugifyText(service.name),
        kind: "service" as const,
        h2: service.name,
        body_content: service.blurb,
        media_asset_ids: [],
        cta: null,
      })),
      ...copy.faq.map((f, index) => ({
        slug: `faq-${index + 1}`,
        kind: "faq" as const,
        h2: f.question,
        body_content: f.answer,
        media_asset_ids: [],
        cta: null,
      })),
    ];

    await step.run("save-sections", async () => {
      await admin
        .from("artifacts")
        .update({
          funnel_pages: funnelPages,
          design_tokens: compileDesignTokens(dna),
          inspiration_branding: dna,
        })
        .eq("lead_id", lead_id);
    });

    const homepage = await step.run("generate-homepage", async () => {
      const result = await generateBespokeHomepage(brief, copy, dna, media, knownPaths);
      if (!result) throw new Error("Homepage generation returned nothing");
      return result;
    });

    await step.run("save-homepage", async () => {
      await writeLivePage(lead_id, HOME_KEY, homepage.html, "generated", homepage.rationale);
      await admin
        .from("artifacts")
        .update({ bespoke_rationale: homepage.rationale })
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

function buildLocationPairs(services: string[], areas: string[]): { service: string; area: string }[] {
  const pairs: { service: string; area: string }[] = [];
  for (const area of areas) {
    for (const service of services.slice(0, 4)) {
      if (pairs.length >= MAX_LOCATION_PAGES) return pairs;
      pairs.push({ service, area });
    }
  }
  return pairs;
}

async function bumpProgress(admin: ReturnType<typeof createAdminClient>, leadId: string, done: number) {
  await admin.from("build_jobs").update({ pages_done: done }).eq("lead_id", leadId).eq("stage", "bespoke");
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
      generateBespokePage(ctx.brief, ctx.copy, ctx.dna, ctx.media, ctx.knownPaths, request)
    )) as string | null;

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
    case "blog-post":
      return `blog/${slugifyText(request.title)}`;
    case "blog-index":
      return "blog";
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
  const pairs = buildLocationPairs(services, areas);

  const articles = ctx.copy.faq.slice(0, 6).map((f) => f.question);

  const requests: InnerPageRequest[] = [
    ...ctx.copy.services.map((service) => ({
      kind: "service" as const,
      title: service.name,
      subject: service.name,
    })),
    { kind: "about" as const, title: `About ${ctx.brief.businessName}` },
    { kind: "faq" as const, title: "Frequently asked questions" },
    { kind: "contact" as const, title: `Contact ${ctx.brief.businessName}` },
    ...areas.map((area) => ({ kind: "area" as const, title: area, area })),
    ...pairs.map((p) => ({
      kind: "location-service" as const,
      title: `${p.service} in ${p.area}`,
      subject: p.service,
      area: p.area,
    })),
    ...(articles.length > 0
      ? [
          { kind: "blog-index" as const, title: `${ctx.brief.industry} advice` },
          ...articles.map((title) => ({ kind: "blog-post" as const, title })),
        ]
      : []),
  ];

  await step.run("start-phase-2", async () => {
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
      services: ctx.copy.services.map((s) => s.name),
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
