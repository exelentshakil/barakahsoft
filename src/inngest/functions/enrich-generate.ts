import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateHeadline, generateSubhead, type Facts, type GenerationContext } from "@/lib/ai";
import { detectIndustry, loadPlaybook } from "@/lib/playbooks";
import { deriveServiceCandidates } from "@/lib/derive-services";
import { generateServiceSection, generateDifferentiatorSection, generateFaqSections } from "@/lib/generate-section";
import {
  generateTrustStripSection,
  generateExpertiseSection,
  generateCtaBannerSection,
  generateProcessSection,
  generateAudienceSegmentsSection,
  generateCertificationsSection,
} from "@/lib/generate-extra-sections";
import { runPhotoWaterfall } from "@/lib/photo-waterfall";
import { researchCompetitors } from "@/lib/research-competitors";
import { loadSectionVariantCatalog, selectSectionVariants } from "@/lib/compose-sections";
import { loadNicheScreenshots } from "@/lib/design-reference";
import { buildHeroVideoPrompt, startHeroVideoGeneration, checkHeroVideoOperation, storeHeroVideo } from "@/lib/google/veo";
import type { PageInventory } from "@/lib/scrape/extract-text";
import type { FunnelPageSection } from "@/types/database";

// v3 (Phase L) — this is now the FAST homepage-only pass: services are
// capped to the top few real ones (see FAST_PASS_SERVICE_CAP below). The
// rest, plus real service-area extraction and deeper standalone-page copy,
// happen in enrich-expand.ts once an operator QA-approves the lead —
// "areas intentionally left empty" no longer describes the whole pipeline,
// just this fast pass.
const FAST_PASS_SERVICE_CAP = 6;

// enrich.generate — RedesignEngine stage 2 (plan §5): detect_industry +
// load_playbook + ResearchCompetitors + GenerateSectionContent x N (hero,
// differentiator, services, FAQ) + PhotoWaterfall -> one artifacts row with
// funnel_pages.
export const enrichGenerate = inngest.createFunction(
  { id: "enrich-generate" },
  { event: "scrape/completed" },
  async ({ event, step }) => {
    const { lead_id } = event.data as { lead_id: string };
    const admin = createAdminClient();

    await step.run("mark-enriching", async () => {
      await admin.from("leads").update({ status: "enriching" }).eq("id", lead_id);
      await admin.from("build_jobs").insert({ lead_id, stage: "enrich", status: "running", pages_total: 1 });
    });

    const { scrapeResults, placeId, persona } = await step.run("load-scrape-results", async () => {
      const [{ data: scrape }, { data: lead }] = await Promise.all([
        admin.from("scrape_results").select("*").eq("lead_id", lead_id).single(),
        admin.from("leads").select("place_id, persona").eq("id", lead_id).single(),
      ]);
      if (!scrape) throw new Error(`enrich-generate: no scrape_results for lead ${lead_id}`);
      return { scrapeResults: scrape, placeId: lead?.place_id ?? undefined, persona: lead?.persona ?? null };
    });

    const facts = scrapeResults.facts as Facts;
    const placesRaw = scrapeResults.places_raw as { lat: number | null; lng: number | null } | null;
    const location = placesRaw?.lat != null && placesRaw?.lng != null ? { lat: placesRaw.lat, lng: placesRaw.lng } : null;

    const industry = await step.run("detect-industry", async () => {
      // v4 Phase R3 — a self-identified persona at intake is a stronger
      // prior than post-hoc keyword scraping for the personas that map to
      // a real distinct playbook (salon-beauty, agency-freelancer).
      const detected = detectIndustry(facts, persona);
      await admin.from("leads").update({ industry: detected }).eq("id", lead_id);
      return detected;
    });

    const playbook = loadPlaybook(industry);
    const town = (facts.town as string) || null;

    // Real local competitors, not a generic prompt in a vacuum — the
    // explicit ask: research 5-10 real businesses in this niche/location
    // and let their real headlines/brand colors inform tone before writing
    // this business's own copy. Also seeds the Phase 8 Competitors tab.
    const competitorResearch = await step.run("research-competitors", async () => {
      const research = await researchCompetitors(playbook.industry_label, location, placeId);
      await admin
        .from("scrape_results")
        .update({ facts: { ...facts, competitors: research.competitors, design_brief: research.designBrief } })
        .eq("lead_id", lead_id);
      return research;
    });

    const genContext: GenerationContext = { industryLabel: playbook.industry_label, town, designBrief: competitorResearch.designBrief };

    // v6 -- real curated screenshots for this exact trade (leads.persona,
    // e.g. "roofers"), loaded as a PLAIN call (not its own step.run) --
    // Inngest durably serializes every step's return value, and a niche's
    // full screenshot set (up to 20 base64-encoded images) is multiple MB,
    // comfortably over Inngest's per-step output size limit ("step output
    // size is greater than the limit", confirmed in production). They're
    // read-only and deterministic, so re-fetching on any replay is fine.
    // Loaded once here, reused by both the bespoke generator below and the
    // legacy catalog-composition fallback.
    const nicheScreenshots = await loadNicheScreenshots(persona);

    // Which pre-built, hand-QA'd section variant renders in each fixed
    // slot when the bespoke homepage above didn't generate — a real
    // per-lead pick grounded in this lead's own facts, the live competitor
    // research, and (when available) real vision input from this exact
    // trade's curated reference screenshots. Any invalid/missing pick
    // safely falls back to the default variant at render time
    // (sections/registry.ts).
    const composition = await step.run("select-section-variants", async () => {
      const catalog = await loadSectionVariantCatalog(industry);
      return selectSectionVariants(facts, playbook, competitorResearch, catalog, nicheScreenshots);
    });

    // v4 Phase N5/O2 — resolve hero-video eligibility BEFORE deciding the
    // premium overrides below, instead of only generating a video when the
    // AI's independent composition pick happened to land on it (which then
    // got silently overridden anyway — the original bug report). A real
    // video on the client's own site (extracted + hotlink-safety-checked
    // during scrapeBusiness) always wins over spending a Veo call; Veo is
    // the fallback, not the first choice.
    let heroVideoAvailable = false;
    let heroVideoFailureReason: string | null = null;

    const siteVideo = (facts as { site_video?: { url: string; posterUrl: string | null } | null }).site_video;
    if (siteVideo) {
      await step.run("store-site-hero-video", async () => {
        await admin.from("media_assets").insert({
          lead_id,
          storage_path: siteVideo.url,
          public_url: siteVideo.url,
          source: "site",
          slot_hint: "hero-video",
          storage_mode: "hotlink",
        });
      });
      heroVideoAvailable = true;
    } else {
      // Phase H — bounded poll: ~3.3 min at 10s intervals (20 polls, up from
      // 15), then gives up and lets HeroVideoBackground's own static-hero
      // fallback handle it -- never blocks the rest of the pipeline on a
      // slow/failed video job.
      const { operationName, reason: startReason } = await step.run("start-hero-video", async () => {
        const prompt = buildHeroVideoPrompt(playbook.industry_label, town, playbook.hero_video_cinematography);
        return startHeroVideoGeneration(prompt);
      });
      heroVideoFailureReason = startReason;

      if (operationName) {
        const MAX_POLLS = 20;
        for (let i = 0; i < MAX_POLLS; i++) {
          await step.sleep(`wait-hero-video-${i}`, "10s");
          const status = await step.run(`check-hero-video-${i}`, () => checkHeroVideoOperation(operationName));
          if (status.done) {
            if (status.videoUri) {
              const stored = await step.run("store-hero-video", () => storeHeroVideo(lead_id, status.videoUri!));
              heroVideoAvailable = !!stored.publicUrl;
              heroVideoFailureReason = stored.reason;
            } else {
              heroVideoFailureReason = status.reason;
            }
            break;
          }
          if (i === MAX_POLLS - 1) heroVideoFailureReason = "timeout";
        }
      }
    }

    // v3 — "the homepage should be a masterpiece" for every new lead: these
    // kinds should never fall back to a plain, un-premium look. v6 — this
    // used to unconditionally overwrite the composition step's pick for 10
    // of 14 kinds, which meant the (now vision-grounded) research above only
    // ever actually reached rendering for the 4 kinds not listed here — a
    // confirmed real bug, not by design. Now it's fallback-only: a real,
    // valid pick from selectSectionVariants (informed by this trade's real
    // reference screenshots when available) wins; this map only fills in
    // when that pick is missing/invalid, same safety guarantee as before.
    // hero stays a hard, unconditional override — real video availability is
    // a fact, not an aesthetic judgment call the vision step should weigh in on.
    const PREMIUM_VARIANT_OVERRIDES: Record<string, string> = {
      hero: heroVideoAvailable ? "video-background" : "split-image-premium",
      proof: "stat-grid-premium",
      "services-grid": "card-grid-premium",
      reviews: "carousel-premium",
      "trust-strip": "badges-premium",
      expertise: "split-glow-premium",
      "cta-banner": "gradient-premium",
      process: "timeline-premium",
      "audience-segments": "cards-premium",
      certifications: "glow-premium",
    };
    composition.selections.hero = PREMIUM_VARIANT_OVERRIDES.hero;
    for (const [kind, premiumSlug] of Object.entries(PREMIUM_VARIANT_OVERRIDES)) {
      if (kind === "hero") continue;
      composition.selections[kind] = composition.selections[kind] ?? premiumSlug;
    }

    const sections = await step.run("generate-sections", async () => {
      const [headline, subhead] = await Promise.all([generateHeadline(facts, genContext), generateSubhead(facts, genContext)]);
      const heroSection: FunnelPageSection = { slug: "hero", kind: "hero", h2: headline, body_content: subhead, media_asset_ids: [], cta: null };

      const differentiator = await generateDifferentiatorSection(facts, genContext);

      // v3 (Phase L) — the fast homepage pass caps services to a handful of
      // top real ones; the rest are only generated once an operator
      // QA-approves the lead (enrich-expand.ts, triggered by the same
      // lead/qa.approved event deliver-send.ts already listens to). This is
      // the one real cost lever — everything else on the homepage (hero,
      // FAQ, trust sections, video) stays full quality since that IS the
      // "max wow factor" sales artifact, not the wasteful part.
      const serviceCandidates = deriveServiceCandidates((facts.pages as PageInventory[]) ?? [], FAST_PASS_SERVICE_CAP, town);
      const serviceSections = (
        await Promise.all(serviceCandidates.map((c) => generateServiceSection(facts, c.name, c.slug, [])))
      ).filter((s): s is NonNullable<typeof s> => s !== null);

      const faqSections = await generateFaqSections(facts, playbook.faq_seed_questions);

      return { heroSection, differentiator, serviceSections, faqSections };
    });

    await step.run("run-photo-waterfall", async () => {
      // One slot per service (up to MAX_SERVICES=15) plus a differentiator
      // slot and a handful of gallery slots so real surplus site photos get
      // used instead of sitting unconsumed in facts.site_photos — a lead
      // with 12 real services previously only ever got 3 real photos used.
      const requiredSlots = [
        { slotHint: "hero", playbookQueryKey: "hero" },
        { slotHint: "proof", playbookQueryKey: "proof" },
        { slotHint: "differentiator", playbookQueryKey: "team" },
        ...sections.serviceSections.map((s) => ({ slotHint: `service:${s.slug}`, playbookQueryKey: "team" })),
        ...Array.from({ length: 6 }, (_, i) => ({ slotHint: `gallery:${i + 1}`, playbookQueryKey: "team" })),
      ];
      await runPhotoWaterfall(lead_id, facts, playbook, requiredSlots);
    });

    // Phase E's six extra section kinds — after the photo waterfall so
    // expertise can check whether a real differentiator photo landed
    // (its OR-gate: a real photo, or ≥2 grounded trust signals). Each
    // generator returns null when real facts don't genuinely support it —
    // never rendered just to hit a section count.
    const extraSections = await step.run("generate-extra-sections", async () => {
      const { data: mediaAssets } = await admin.from("media_assets").select("id, slot_hint").eq("lead_id", lead_id);
      const mediaBySlot = new Map((mediaAssets ?? []).map((m) => [m.slot_hint, m.id]));
      const hasDifferentiatorPhoto = mediaBySlot.has("differentiator");

      const [trustStrip, expertise, ctaBanner, process, audienceSegments, certifications] = await Promise.all([
        Promise.resolve(generateTrustStripSection(facts)),
        generateExpertiseSection(facts, genContext, hasDifferentiatorPhoto),
        Promise.resolve(generateCtaBannerSection(facts, (facts.business_name as string) || playbook.industry_label)),
        generateProcessSection(facts, genContext),
        generateAudienceSegmentsSection(facts, genContext),
        Promise.resolve(generateCertificationsSection(facts)),
      ]);

      return {
        trustStrip,
        expertise: expertise ? { ...expertise, media_asset_ids: mediaBySlot.has("differentiator") ? [mediaBySlot.get("differentiator")!] : [] } : null,
        ctaBanner,
        process,
        audienceSegments,
        certifications,
      };
    });

    await step.run("save-artifact", async () => {
      const { data: shell } = await admin.from("template_shells").select("id").eq("slug", "home-services-v1").single();
      if (!shell) throw new Error("enrich-generate: home-services-v1 template shell not found — did migrations run?");

      const { data: mediaAssets } = await admin.from("media_assets").select("id, slot_hint").eq("lead_id", lead_id);
      const mediaBySlot = new Map((mediaAssets ?? []).map((m) => [m.slot_hint, m.id]));

      const extraSectionList = [
        extraSections.trustStrip,
        extraSections.expertise,
        extraSections.ctaBanner,
        extraSections.process,
        extraSections.audienceSegments,
        extraSections.certifications,
      ].filter((s): s is NonNullable<typeof s> => s !== null);

      const funnelPages: FunnelPageSection[] = [
        { ...sections.heroSection, media_asset_ids: mediaBySlot.has("hero") ? [mediaBySlot.get("hero")!] : [] },
        { ...sections.differentiator, media_asset_ids: mediaBySlot.has("differentiator") ? [mediaBySlot.get("differentiator")!] : [] },
        ...sections.serviceSections.map((s) => ({
          slug: s.slug,
          kind: s.kind,
          h2: s.h2,
          body_content: s.body_content,
          media_asset_ids: mediaBySlot.has(`service:${s.slug}`) ? [mediaBySlot.get(`service:${s.slug}`)!] : [],
          cta: s.cta,
        })),
        ...extraSectionList.map((s) => ({
          slug: s.slug,
          kind: s.kind,
          h2: s.h2,
          body_content: s.body_content,
          media_asset_ids: s.media_asset_ids,
          cta: s.cta,
          variant_props: s.variant_props,
        })),
        ...sections.faqSections.map((f) => ({ slug: f.slug, kind: f.kind, h2: f.h2, body_content: f.body_content, media_asset_ids: [], cta: f.cta })),
      ];

      // Grounding warnings from GenerateSectionContent aren't a hard gate
      // (PRD §7 stage 5: a human makes the final call) — surfaced as
      // qa_notes so QAReviewPanel shows the reviewer exactly what to check
      // instead of re-reading every section from scratch.
      const groundingWarnings = [
        ...sections.differentiator.groundingWarnings.map((w) => `[Why choose us] ${w}`),
        ...sections.serviceSections.flatMap((s) => s.groundingWarnings.map((w) => `[${s.h2}] ${w}`)),
        ...sections.faqSections.flatMap((f) => f.groundingWarnings.map((w) => `[${f.h2}] ${w}`)),
        ...extraSectionList.flatMap((s) => s.groundingWarnings.map((w) => `[${s.h2 || s.kind}] ${w}`)),
        // v4 Phase O1 — real reason a lead has no video hero, instead of an
        // unexplained gap (was previously a silently swallowed console.error).
        ...(!heroVideoAvailable && heroVideoFailureReason ? [`[Hero video] Generation did not complete: ${heroVideoFailureReason}`] : []),
      ];

      await admin.from("artifacts").upsert(
        {
          lead_id,
          template_shell_id: shell.id,
          extracted_assets: { guarantee: "Straightforward pricing, no surprises — confirmed before any work begins." },
          funnel_pages: funnelPages,
          qa_notes: groundingWarnings.length > 0 ? groundingWarnings.join("\n") : null,
          section_variant_selections: composition.selections,
          composition_rationale: composition.rationale || null,
          // AI supplies grounded copy and composition choices. The homepage
          // itself is rendered by reviewed React sections, never raw model
          // HTML. Existing bespoke columns remain for migration history only.
          bespoke_homepage_html: null,
          bespoke_rationale: null,
        },
        { onConflict: "lead_id" }
      );
    });

    await step.run("mark-enrich-complete", async () => {
      await admin.from("build_jobs").update({ status: "complete", pages_done: 1 }).eq("lead_id", lead_id).eq("stage", "enrich");
    });

    await step.sendEvent("emit-enrich-completed", { name: "enrich/completed", data: { lead_id } });

    return { lead_id };
  }
);
