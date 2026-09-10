import { inngest } from "@/inngest/client";
import { updateArtifact } from "@/lib/artifact-write";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSiteBrief, buildKnownPaths, servicesForMatching, type BriefOverrides } from "@/lib/build-site-brief";
import { resolveVerticalAsync } from "@/lib/verticals/resolve";
import type { VerticalProfile } from "@/lib/verticals/types";
import {
  generateBespokePage,
  type InnerPageRequest,
  type SiteBrief,
} from "@/lib/generate-bespoke-site";
import { callBestModel, type GenerationProvider } from "@/lib/generate/model";
import { DEFAULT_DESIGN_DNA, DesignDnaSchema, type DesignDna } from "@/lib/design-dna";
import { ingestRealPhotos, planMedia, type MediaPlan } from "@/lib/media/plan-media";
import { buildChromeSpec } from "@/lib/chrome-spec";
import { writeLivePage, HOME_KEY } from "@/lib/page-versions";
import { resolveLogoUrl } from "@/lib/brand-assets";
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

/**
 * What the retired creative-director pass used to return. The pass itself is
 * gone — it cost a model call to produce notes the deterministic gate already
 * produces, and it could not see the rendered page — but qa_notes still reads
 * this shape, so it is stated here rather than imported from a deleted module.
 */
interface PremiumCritique {
  passes: boolean;
  blockers: string[];
  warnings: string[];
}


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

    // Every model call this run makes is billed to this lead, and to the brand
    // that owns it. Generation is concurrency-limited to one run per lead, so
    // a module-level current context is accurate without threading an id
    // through every signature. Set after load-context because the tenant is
    // read from the lead.
    setUsageContext(lead_id, `phase-${phase}`, loaded.lead.tenant_slug);

    // Step 0 of the router: which kind of business is this? Everything below —
    // the section order, the nouns, the call to action, the photo queries, the
    // art direction, the schema.org type — is chosen by the profile this
    // returns. Resolved fresh at build time, then frozen into the artifact so
    // the delivered page always renders against what it was built with.
    const vertical = await resolveVerticalAsync(loaded.lead, null, servicesForMatching(loaded.scrapeResults));
    const brief = buildSiteBrief(loaded.lead, loaded.scrapeResults, vertical.profile, overrides ?? {});

    // Recorded so coverage is a measured number rather than an estimate: which
    // verticals real leads actually resolve to, and how they got there.
    if (loaded.lead.vertical_slug !== vertical.profile.slug) {
      await step.run("record-vertical", async () => {
        await admin.from("leads").update({ vertical_slug: vertical.profile.slug }).eq("id", lead_id);
      });
    }

    // Pad the lists so the mega menu looks balanced, inventing plausible
    // adjacent items to reach the profile's target counts.
    //
    // Gated on the profile, and off by default everywhere but home services.
    // A trade genuinely does adjacent work it has not listed and genuinely does
    // travel to the next town; a single-location florist does not, and an
    // invented service area becomes a factual claim on their live website —
    // which the home-services playbook's own forbidden_slop already forbids.
    const offeringTarget = brief.vertical.lists.offeringCount;
    const areaTarget = brief.vertical.lists.areaCount;
    const padded = await step.run("pad-brief-lists", async () => {
      let paddedServices = brief.services.slice(0, offeringTarget);
      let paddedAreas = brief.areas.slice(0, areaTarget);

      if (brief.vertical.lists.padOfferings && paddedServices.length > 0 && paddedServices.length < offeringTarget) {
        const prompt = `We have a local business in the ${brief.industry} industry.
They currently offer these services: ${paddedServices.join(", ")}.
We need exactly ${offeringTarget} services for their website navigation to look balanced.
Creatively invent highly relevant, inter-related realistic services that a business like this would also offer, to pad the list to exactly ${offeringTarget} items.
Return valid JSON only in this format: {"services": ["Service 1", "Service 2", ...]}`;

        const raw = await callBestModel(prompt, { maxTokens: 400, temperature: 0.7, model }, provider);
        const parsed = raw ? parseJsonResponse(raw) : null;
        if (parsed && Array.isArray(parsed.services) && parsed.services.length === offeringTarget) {
          paddedServices = parsed.services;
        }
      }

      if (brief.vertical.lists.padAreas && paddedAreas.length > 0 && paddedAreas.length < areaTarget) {
        const prompt = `We have a local business in ${brief.city}.
They currently serve these areas: ${paddedAreas.join(", ")}.
We need exactly ${areaTarget} service areas/locations for their website navigation to look balanced.
Invent highly relevant, nearby realistic towns, cities, or neighborhoods to pad the list to exactly ${areaTarget} items.
Return valid JSON only in this format: {"areas": ["Area 1", "Area 2", ...]}`;

        const raw = await callBestModel(prompt, { maxTokens: 400, temperature: 0.7, model }, provider);
        const parsed = raw ? parseJsonResponse(raw) : null;
        if (parsed && Array.isArray(parsed.areas) && parsed.areas.length === areaTarget) {
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
        ? buildKnownPaths(services, areas, brief.vertical.nouns)
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

    // ── 1 · the intake brief, written for this business ──
    //
    // A blueprint section the client cannot evidence used to be struck through
    // and dropped, and a page that lost enough of them fell back to the
    // vertical's generic list. That is how a distinctive reference produced a
    // boring page. Here the missing evidence becomes a question instead.
    const intake = (await step.run("intake-brief", async () => {
      await touchProgress(admin, lead_id);
      const { buildIntakeSpec } = await import("@/lib/intake-spec");
      const spec = await buildIntakeSpec({
        businessName: brief.businessName,
        industry: brief.industry,
        city: brief.city,
        vertical: brief.vertical,
        entities: loaded.scrapeResults.entities ?? [],
        dna,
        overrides: ((loaded.artifact?.extracted_assets as Record<string, unknown> | null)?.intake_answers as Record<string, unknown>) ?? {},
        facts: (loaded.scrapeResults.facts as Record<string, unknown>) ?? {},
      });
      if (spec) await admin.from("artifacts").update({ intake_spec: spec }).eq("lead_id", lead_id);
      return spec;
    })) as Awaited<ReturnType<typeof import("@/lib/intake-spec").buildIntakeSpec>>;

    await bumpProgress(admin, lead_id, 1);

    const facts = (loaded.scrapeResults.facts as Record<string, unknown>) || {};
    const clientBrandHex =
      (facts.brand_color_hex as string) ||
      ((facts.colors as any)?.primary as string) ||
      ((facts.branding as any)?.colors?.primary as string) ||
      ((loaded.artifact?.extracted_assets as any)?.branding?.colors?.primary as string) ||
      ((loaded.artifact?.extracted_assets as any)?.brand_color_hex as string) ||
      null;

    const logoUrl = resolveLogoUrl(loaded.artifact?.extracted_assets as Record<string, unknown> | null, facts);
    // The logo is not a photograph. Passing it in the photo list is exactly how
    // a previous build rendered a 900px-tall wordmark as its hero image.
    const photos = brief.photos.filter((url: string) => url && url !== logoUrl).slice(0, 12);

    // ── 2 · the PRD ──
    //
    // Written before a line of code exists, and committing to one aesthetic and
    // one structure. This is what makes two leads diverge by design rather than
    // by accident.
    const prd = (await step.run("write-prd", async () => {
      await touchProgress(admin, lead_id);
      const { writePrdWithReason } = await import("@/lib/generate/prd");
      return writePrdWithReason({
        businessName: brief.businessName,
        industry: brief.industry,
        city: brief.city,
        vertical: brief.vertical,
        entities: loaded.scrapeResults.entities ?? [],
        intake,
        dna,
        brandHex: clientBrandHex,
        rating: brief.rating,
        reviewCount: brief.reviewCount,
        services: brief.services,
        areas: brief.areas,
        // The argument the page has to make. This reached generation through
        // page-copy, which is being deleted; losing it would be a silent
        // regression on the one input the owner actually chose.
        painInstructions: brief.painInstructions,
        photoCount: photos.length,
      });
    })) as Awaited<ReturnType<typeof import("@/lib/generate/prd").writePrdWithReason>>;

    if (!prd?.prd) {
      // The reason travels with the failure. A build that stops with only "the
      // design brief could not be written" sends the operator to a log they are
      // not looking at, and the cause — a provider timing out, a response
      // truncated short of the section band — decides whether the answer is to
      // press the button again or to fix something.
      throw new Error(
        `The design brief could not be written after two attempts, so nothing was saved and the previous page is untouched.\n\n` +
          `Reason: ${prd?.reason ?? "no response from either provider"}`
      );
    }

    // Bound once, because narrowing does not survive the step boundary above.
    const design = prd.prd;

    await bumpProgress(admin, lead_id, 2);

    // ── 3 · compile the design system ──
    //
    // Deterministic and pure, so it is recomputed inside each step that needs
    // it rather than carried across a step boundary as serialized state.
    const { compileDesignSystem } = await import("@/lib/design");
    const { intentFrom, prdToMarkdown } = await import("@/lib/generate/prd");
    const system = compileDesignSystem(intentFrom(design, clientBrandHex));

    // ── 4 · photography, from the PRD's own slots ──
    //
    // Slots come from the sections, so a slot nothing uses cannot exist. The
    // old buildSlots() invented a fixed list before the page existed, which is
    // why the media panel showed images marked "not placed on any page".
    const media = (await step.run("plan-media", async () => {
      await touchProgress(admin, lead_id);
      const { slotsFromImageBriefs } = await import("@/lib/media/plan-media");
      const wanted = slotsFromImageBriefs(
        design.sections
          .filter((section) => section.image)
          .map((section) => ({
            slot: section.image!.slot,
            aspect: section.image!.aspect,
            brief: section.image!.brief,
            kind: section.kind,
          }))
      );

      // An existing plan is kept: it was being rebuilt from scratch every run,
      // which overwrote whatever the operator had chosen and regenerated every
      // image, so a photo could never be made to stick.
      const existing = (loaded.artifact?.media_plan as MediaPlan | null) ?? [];
      const covered = new Set(existing.filter((item) => item.url).map((item) => item.slot));
      const missing = wanted.filter((slot) => !covered.has(slot.key));
      if (!missing.length) return existing;

      const assets = await ingestRealPhotos(lead_id, brief.photos, brief.industry);
      const added = await planMedia(lead_id, assets, missing, dna.mood);
      const plan = [...existing, ...added];
      await admin.from("artifacts").update({ media_plan: plan }).eq("lead_id", lead_id);
      return plan;
    })) as MediaPlan;

    await bumpProgress(admin, lead_id, 3);

    const mediaAssets = design.sections
      .filter((section) => section.image)
      .map((section) => {
        const planned = media.find((item) => item.slot === section.image!.slot);
        return planned?.url
          ? {
              slot: section.image!.slot,
              url: planned.url,
              alt: planned.caption || section.image!.brief.slice(0, 120),
              width: 1600,
              height: 1000,
              aspect: section.image!.aspect,
            }
          : null;
      })
      .filter((asset): asset is NonNullable<typeof asset> => Boolean(asset));

    const authorInput = {
      prd: design,
      businessName: brief.businessName,
      city: brief.city,
      phone: brief.phone,
      email: brief.email,
      address: brief.address,
      services: brief.services,
      areas: brief.areas,
      facts: (loaded.scrapeResults.entities ?? []).map(
        (entity) => `${entity.kind}: ${entity.label}${entity.price ? ` — ${entity.price}${entity.period ? `/${entity.period}` : ""}` : ""}`
      ),
      reviews: brief.reviews.map((review) => ({ author: review.author, rating: review.rating, text: review.text })),
      media: mediaAssets,
      logoUrl,
      innerPagesBuilt: Boolean(loaded.artifact?.inner_pages_built),
    };

    // ── 5 · chrome ──
    const chrome = (await step.run("author-chrome", async () => {
      await touchProgress(admin, lead_id);
      const { authorChrome } = await import("@/lib/generate/author");
      return authorChrome(authorInput);
    })) as Awaited<ReturnType<typeof import("@/lib/generate/author").authorChrome>>;

    if (!chrome) throw new Error("The navigation and footer could not be authored. Nothing was saved.");

    await bumpProgress(admin, lead_id, 4);

    // ── 6 · the page body ──
    //
    // Its own step because a homepage plus stylesheet is 30-40k output tokens
    // and will not finish inside one invocation. It also gets the chrome's CSS
    // as input, so the classes it composes with already exist.
    const body = (await step.run("author-body", async () => {
      await touchProgress(admin, lead_id);
      const { authorBody } = await import("@/lib/generate/author");
      return authorBody(authorInput, system.css, chrome.css);
    })) as Awaited<ReturnType<typeof import("@/lib/generate/author").authorBody>>;

    if (!body) throw new Error("The page body could not be authored. Nothing was saved.");

    await bumpProgress(admin, lead_id, 5);

    // ── 7 · measure, repair, measure again ──
    //
    // Before anything is persisted. Auditing afterwards would mean publishing
    // a failure and repairing it in public.
    const assembled = (await step.run("assemble-and-audit", async () => {
      await touchProgress(admin, lead_id);
      const { assemble } = await import("@/lib/generate/assemble");
      const page = await assemble({ prd: design, system, chrome, body, media: mediaAssets });
      // The screenshot is a Buffer and would not survive the step boundary;
      // the queue reads it from storage instead.
      const { screenshot, ...rest } = page;
      let previewUrl: string | null = null;
      if (screenshot) {
        const path = `${lead_id}/audit/home-${Date.now()}.jpg`;
        const { error } = await admin.storage.from("lead-media").upload(path, screenshot, {
          contentType: "image/jpeg",
          upsert: true,
        });
        if (!error) previewUrl = admin.storage.from("lead-media").getPublicUrl(path).data.publicUrl;
      }
      return { ...rest, previewUrl };
    })) as Omit<Awaited<ReturnType<typeof import("@/lib/generate/assemble").assemble>>, "screenshot"> & {
      previewUrl: string | null;
    };

    const contrastBlockers = assembled.findings.filter(
      (finding) => finding.check === "contrast" && finding.severity === "blocker"
    );
    if (contrastBlockers.length) {
      throw new Error(
        `Unreadable after ${assembled.repairs} repair round(s). The page was not saved.\n` +
          contrastBlockers.map((finding) => finding.detail).join("\n")
      );
    }

    const built = {
      html: assembled.bodyHtml,
      css: assembled.css,
      rationale: prdToMarkdown(design),
      sections: assembled.sections,
      notes: assembled.findings.map((finding) => `[${finding.severity}] ${finding.check}: ${finding.detail}`),
    };

    // funnel_pages drives the mega menu, the footer and sitemap.xml. Structure,
    // not prose, so it needs the real section list rather than a written plan.
    const funnelPages: FunnelPageSection[] = design.sections.map((section) => ({
      slug: section.id,
      kind: section.kind === "hero" ? "hero" : ("service" as const),
      h2: section.kind,
      body_content: section.purpose,
      media_asset_ids: [],
      cta: null,
    }));

    await step.run("persist-build", async () => {
      await updateArtifact(
        lead_id,
        {
          bespoke_homepage_html: built.html,
          bespoke_chrome_html: assembled.chromeHtml,
          bespoke_footer_html: assembled.footerHtml,
          bespoke_css: built.css,
          bespoke_js: assembled.js,
          bespoke_sections: built.sections,
          bespoke_rationale: built.rationale,
          design_system: { prd: design, meta: system.meta, fontHref: system.fontHref },
          design_tokens: { vars: system.tokens, fontHref: system.fontHref, mood: dna.mood },
          audit_report: { findings: assembled.findings, score: assembled.score, repairs: assembled.repairs, previewUrl: assembled.previewUrl },
          review_state: "pending",
          approved_at: null,
          // Frozen for the same reason as the tokens: a delivered page has to
          // render against the profile it was built with, so editing a profile
          // in the registry must not retroactively restyle shipped sites.
          vertical_profile: brief.vertical,
          // A rebuild is a REPLACEMENT, not a merge. Inner pages belong to the
          // build that made them — their markup, classes and tokens — so
          // carrying the previous run's copies forward leaves a site whose
          // homepage is new and whose other pages are styled against a
          // stylesheet that no longer exists.
          bespoke_pages: {},
          // Cleared WITH bespoke_pages, never apart from it: this flag is what
          // the nav reads to choose between a real link and an anchor.
          inner_pages_built: false,
          funnel_pages: funnelPages,
          last_edited_at: new Date().toISOString(),
        },
        "persist-build"
      );
    });

    await bumpProgress(admin, lead_id, 6);

    const composedHtml = built.html;
    const stylesheetCss = built.css;

    const critique: PremiumCritique = { passes: true, blockers: [], warnings: [] };

    let visualReport: VisualQaReport | null = null;
    if (visualQaEnabled()) {
      const candidate = (await step.run("queue-visual-qa", async () => {
          const { data, error } = await admin
            .from("generation_candidates")
            .insert({
              lead_id,
              attempt: 1,
              html: composedHtml,
              css: stylesheetCss,
              rationale: built.rationale,
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
                   candidateNotes: built.rationale,
                   sectionPlan: [],
                 },
               },
               source_report: { findings: assembled.findings, score: assembled.score },
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

    const homepage = { html: composedHtml, css: stylesheetCss, rationale: built.rationale, visualReport };
    const homepageHtml = homepage.html;
    const verdict = { findings: assembled.findings };

    await step.run("save-homepage", async () => {
      await writeLivePage(lead_id, HOME_KEY, homepageHtml, "generated", homepage.rationale);
      // Split immediately so section-level repair is available the moment
      // the operator first looks at the page, rather than after some later
      // action happens to trigger it.
      await updateArtifact(
        lead_id,
        {
           bespoke_rationale: homepage.rationale,
           // The real per-section split, written by the build. It was
           // previously two entries both holding the ENTIRE page, so
           // editing "Hero" in the studio rewrote the whole homepage twice.
           bespoke_sections: built.sections,
          // Kept so the operator can see what the critic caught, rather than
          // trusting that it ran.
          // Stored so the operator sees exactly what the gate found rather
          // than trusting that it ran.
          qa_notes: [
            ...verdict.findings.map((finding) => `[${finding.severity}] ${finding.check}: ${finding.detail}`),
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
            ...built.notes,
          ].join("\n") || null,
          bespoke_css: homepage.css,
        },
        "save-homepage"
      );
      // Reviewable from here. Everything after is depth, not a blocker.
      await admin.from("leads").update({ status: "qa_pending" }).eq("id", lead_id);
    });

    await bumpProgress(admin, lead_id, 4);

    await step.run("finish-phase-1", async () => {
      // inner_pages_built was reset in persist-build, alongside the inner
      // pages themselves: those routes genuinely do not exist yet, and it is
      // the flag the nav reads to decide between a real link and an anchor.
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
    const key = pageKey(request, ctx.brief.vertical.nouns);
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

function pageKey(request: InnerPageRequest, nouns: VerticalProfile["nouns"]): string {
  switch (request.kind) {
    case "service":
      return `${nouns.offeringPath}/${slugifyText(request.subject ?? request.title)}`;
    case "area":
      return `${nouns.areaPath}/${slugifyText(request.area ?? request.title)}`;
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
  const profile = ctx.brief.vertical;
  // Whether this vertical is an area business at all. This used to read the
  // profile's fixed section list, which no longer exists; areaCount is the
  // honest signal and its own doc comment says so — 0 means no areas section,
  // no areas nav and no area pages.
  const servesAreas = profile.lists.areaCount > 0;

  // Only the pages this vertical actually has. A business with no service
  // areas got eight area pages built for towns it does not serve, and each one
  // was linked from the nav.
  const requests: InnerPageRequest[] = [
    ...services.map((name) => ({
      kind: "service" as const,
      title: name,
      subject: name,
    })),
    { kind: "about" as const, title: `About ${ctx.brief.businessName}` },
    { kind: "faq" as const, title: "Frequently asked questions" },
    { kind: "contact" as const, title: `Contact ${ctx.brief.businessName}` },
    ...(servesAreas
      ? areas.map((area) => ({ kind: "area" as const, title: area, area }))
      : []),
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
