import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPlaybook } from "@/lib/playbooks";
import { deriveServiceCandidates } from "@/lib/derive-services";
import { generateServiceSection, generateServiceLongBodySection, generateLocationServiceSection } from "@/lib/generate-section";
import { extractServiceAreas } from "@/lib/scrape/extract-service-areas";
import { runPhotoWaterfall } from "@/lib/photo-waterfall";
import { slugifyText } from "@/lib/slug";
import type { PageInventory } from "@/lib/scrape/extract-text";
import type { Facts, GenerationContext } from "@/lib/ai";
import type { FunnelPageSection, Lead, Artifact, ScrapeResults } from "@/types/database";

const MAX_LOCATION_PAGES = 12;

// v4 (Phase W) — moved from lead/qa.approved to enrich/completed. Confirmed
// real structural gap: firing this off approval meant full-site content
// (remaining services, long-form copy, about/faq/legal, location pages)
// didn't exist yet when an operator was actually reviewing the lead in
// QA -- "review everything before approving" was genuinely impossible,
// not a missing button. Now a fan-out sibling of render-build.ts on
// enrich/completed instead (same fan-out pattern already used elsewhere,
// e.g. rebuild-inner-pages.ts + go-live.ts both on stripe/invoice.paid),
// so the whole site exists by the time QA opens. deliver-send.ts stays
// tied to lead/qa.approved -- delivery to the client should still gate on
// approval; only the expansion's timing moved.
export const enrichExpand = inngest.createFunction(
  { id: "enrich-expand" },
  { event: "enrich/completed" },
  async ({ event, step }) => {
    const { lead_id } = event.data as { lead_id: string };
    const admin = createAdminClient();

    await step.run("mark-expanding", async () => {
      await admin.from("artifacts").update({ full_site_status: "building" }).eq("lead_id", lead_id);
    });

    try {
      const { lead, facts, artifact } = await step.run("load-context", async () => {
        const [{ data: leadRow }, { data: scrapeRow }, { data: artifactRow }] = await Promise.all([
          admin.from("leads").select("*").eq("id", lead_id).single<Lead>(),
          admin.from("scrape_results").select("*").eq("lead_id", lead_id).single<ScrapeResults>(),
          admin.from("artifacts").select("*").eq("lead_id", lead_id).single<Artifact>(),
        ]);
        if (!leadRow || !scrapeRow || !artifactRow) throw new Error(`enrich-expand: missing lead/scrape/artifact for ${lead_id}`);
        return { lead: leadRow, facts: scrapeRow.facts as Facts, artifact: artifactRow };
      });

      const playbook = loadPlaybook(lead.industry || "home-services");
      const town = (facts.town as string) || null;
      const genContext: GenerationContext = { industryLabel: playbook.industry_label, town, designBrief: (facts.design_brief as string) || "" };
      const pages = (facts.pages as PageInventory[]) ?? [];

      // Real remaining services — the fast pass capped this list; diff
      // against what's already in funnel_pages so this only generates the
      // delta, idempotently, with no separate "deferred slugs" column.
      const newServices = await step.run("generate-remaining-services", async () => {
        const allCandidates = deriveServiceCandidates(pages);
        const existingSlugs = new Set(artifact.funnel_pages.filter((s) => s.kind === "service").map((s) => s.slug));
        const remaining = allCandidates.filter((c) => !existingSlugs.has(c.slug));
        const sections = await Promise.all(remaining.map((c) => generateServiceSection(facts, c.name, c.slug, [])));

        if (sections.length > 0) {
          const requiredSlots = sections.map((s) => ({ slotHint: `service:${s.slug}`, playbookQueryKey: "team" }));
          await runPhotoWaterfall(lead_id, facts, playbook, requiredSlots);
        }
        return sections;
      });

      // Real neighborhood/city names the business itself published, never
      // invented — payload.areas was unconditionally empty before this.
      const areas = await step.run("extract-service-areas", async () => extractServiceAreas(pages));

      const existingServiceSections = artifact.funnel_pages.filter((s) => s.kind === "service");
      const allServices = [
        ...existingServiceSections.map((s) => ({ slug: s.slug, name: s.h2 })),
        ...newServices.map((s) => ({ slug: s.slug, name: s.h2 })),
      ];

      // Deeper standalone-page SEO copy for every service (fast-pass and
      // newly-added), plus a bounded set of real service x area combination
      // pages — this is the actual organic-SEO investment, only ever spent
      // on a lead an operator has already decided is worth it.
      const longForm = await step.run("generate-long-form-content", async () => {
        const serviceLongForms = await Promise.all(
          allServices.map(async (s) => ({ slug: s.slug, ...(await generateServiceLongBodySection(facts, s.name, s.slug, genContext)) }))
        );

        const combos: { serviceSlug: string; serviceName: string; area: string }[] = [];
        outer: for (const area of areas) {
          for (const service of allServices) {
            if (combos.length >= MAX_LOCATION_PAGES) break outer;
            combos.push({ serviceSlug: service.slug, serviceName: service.name, area });
          }
        }
        const locationSections = await Promise.all(
          combos.map(async (c) => ({ ...c, ...(await generateLocationServiceSection(facts, c.serviceName, c.area, genContext)) }))
        );

        return { serviceLongForms, locationSections };
      });

      await step.run("save-expanded-artifact", async () => {
        const { data: current } = await admin.from("artifacts").select("funnel_pages, qa_notes").eq("lead_id", lead_id).single();
        if (!current) throw new Error(`enrich-expand: artifact for ${lead_id} disappeared`);

        const longBodyBySlug = new Map(
          longForm.serviceLongForms.filter((r): r is typeof r & { longBody: string } => !!r.longBody).map((r) => [r.slug, r.longBody])
        );

        const patchedFunnelPages: FunnelPageSection[] = (current.funnel_pages as FunnelPageSection[]).map((s) => {
          if (s.kind !== "service") return s;
          const longBody = longBodyBySlug.get(s.slug);
          return longBody ? { ...s, long_body_content: longBody } : s;
        });

        const newServiceEntries: FunnelPageSection[] = newServices.map((s) => ({
          slug: s.slug,
          kind: s.kind,
          h2: s.h2,
          body_content: s.body_content,
          media_asset_ids: s.media_asset_ids,
          cta: s.cta,
          ...(longBodyBySlug.has(s.slug) ? { long_body_content: longBodyBySlug.get(s.slug) } : {}),
        }));

        const locationEntries: FunnelPageSection[] = longForm.locationSections
          .filter((r): r is typeof r & { longBody: string } => !!r.longBody)
          .map((r) => ({
            slug: `${r.serviceSlug}--${slugifyText(r.area)}`,
            kind: "location-service",
            h2: `${r.serviceName} in ${r.area}`,
            body_content: r.longBody.slice(0, 200),
            media_asset_ids: [],
            cta: "Get a free quote",
            long_body_content: r.longBody,
            variant_props: { service_slug: r.serviceSlug, service_name: r.serviceName, area: r.area },
          }));

        const newWarnings = [
          ...longForm.serviceLongForms.flatMap((r) => r.groundingWarnings.map((w) => `[${r.slug} long-form] ${w}`)),
          ...longForm.locationSections.flatMap((r) => r.groundingWarnings.map((w) => `[${r.serviceSlug} in ${r.area}] ${w}`)),
        ];
        const qaNotes = [current.qa_notes, ...newWarnings].filter(Boolean).join("\n") || null;

        await admin
          .from("artifacts")
          .update({
            funnel_pages: [...patchedFunnelPages, ...newServiceEntries, ...locationEntries],
            qa_notes: qaNotes,
            full_site_status: "complete",
            full_site_built_at: new Date().toISOString(),
          })
          .eq("lead_id", lead_id);
      });
    } catch (err) {
      await step.run("mark-expand-failed", async () => {
        await admin.from("artifacts").update({ full_site_status: "failed" }).eq("lead_id", lead_id);
      });
      throw err;
    }

    return { lead_id };
  }
);
