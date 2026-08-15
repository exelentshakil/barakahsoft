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

    const { scrapeResults, placeId } = await step.run("load-scrape-results", async () => {
      const [{ data: scrape }, { data: lead }] = await Promise.all([
        admin.from("scrape_results").select("*").eq("lead_id", lead_id).single(),
        admin.from("leads").select("place_id").eq("id", lead_id).single(),
      ]);
      if (!scrape) throw new Error(`enrich-generate: no scrape_results for lead ${lead_id}`);
      return { scrapeResults: scrape, placeId: lead?.place_id ?? undefined };
    });

    const facts = scrapeResults.facts as Facts;
    const placesRaw = scrapeResults.places_raw as { lat: number | null; lng: number | null } | null;
    const location = placesRaw?.lat != null && placesRaw?.lng != null ? { lat: placesRaw.lat, lng: placesRaw.lng } : null;

    const industry = await step.run("detect-industry", async () => {
      const detected = detectIndustry(facts);
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

    // Which pre-built, hand-QA'd section variant renders in each fixed
    // slot — a real per-lead pick grounded in this lead's own facts and the
    // live competitor research above, not one static layout for everyone.
    // Any invalid/missing pick safely falls back to the default variant at
    // render time (src/components/site-shell/sections/registry.ts).
    const composition = await step.run("select-section-variants", async () => {
      const catalog = await loadSectionVariantCatalog(industry);
      return selectSectionVariants(facts, playbook, competitorResearch, catalog);
    });

    // v3 — "the homepage should be a masterpiece" applies unconditionally
    // for every new lead, not just when the AI composition step happens to
    // pick it: these ten kinds now have one clearly best-in-class variant,
    // so use it directly instead of leaving it to chance (same "one single
    // premium design, not several competing options" philosophy as the rest
    // of v3). Never touches already-delivered leads — this only runs inside
    // enrich-generate.ts, which only ever executes once per brand-new lead;
    // the plain variants stay the untouched registry.ts fallback for legacy
    // artifacts and any total composition failure. hero is skipped when the
    // AI already picked video-background — an even stronger premium
    // experience that shouldn't be downgraded.
    const PREMIUM_VARIANT_OVERRIDES: Record<string, string> = {
      hero: "split-image-premium",
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
    for (const [kind, premiumSlug] of Object.entries(PREMIUM_VARIANT_OVERRIDES)) {
      if (kind === "hero" && composition.selections.hero === "video-background") continue;
      composition.selections[kind] = premiumSlug;
    }

    // Phase H — only bother generating if the composed hero variant would
    // actually use it (an AI pick from the same catalog compose-sections
    // already draws from). Bounded poll: ~2.5 min at 10s intervals, then
    // gives up and lets HeroVideoBackground's own static-hero fallback
    // handle it -- never blocks the rest of the pipeline on a slow/failed
    // video job.
    if (composition.selections.hero === "video-background") {
      const operationName = await step.run("start-hero-video", async () => {
        const prompt = buildHeroVideoPrompt(playbook.industry_label, town, playbook.hero_video_cinematography);
        return startHeroVideoGeneration(prompt);
      });

      if (operationName) {
        const MAX_POLLS = 15;
        for (let i = 0; i < MAX_POLLS; i++) {
          await step.sleep(`wait-hero-video-${i}`, "10s");
          const status = await step.run(`check-hero-video-${i}`, () => checkHeroVideoOperation(operationName));
          if (status.done) {
            if (status.videoUri) await step.run("store-hero-video", () => storeHeroVideo(lead_id, status.videoUri!));
            break;
          }
        }
      }
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
      const serviceCandidates = deriveServiceCandidates((facts.pages as PageInventory[]) ?? [], FAST_PASS_SERVICE_CAP);
      const serviceSections = await Promise.all(
        serviceCandidates.map((c) => generateServiceSection(facts, c.name, c.slug, []))
      );

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
