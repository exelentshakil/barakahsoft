import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeBusiness } from "@/lib/scrape";
import { classifyBusiness } from "@/lib/classify-business";
import { extractEntities } from "@/lib/extract-entities";
import { ingestRealPhotos, topUpWithStock } from "@/lib/media/ingest";
import { buildSiteBrief, realPhotos, briefReadiness } from "@/lib/build-site-brief";
import { generateHomepage, usablePhotos, type CurrentSite } from "@/lib/generate-homepage";
import { resolveLogoUrl, resolveFooterLogoUrl } from "@/lib/brand-assets";
import { generateOutreachDraft } from "@/lib/outreach/personalise";
import { resolveBusinessContact } from "@/lib/business-contact";
import { updateArtifact } from "@/lib/artifact-write";
import { recordVersion, HOME_KEY } from "@/lib/page-versions";
import { setUsageContext } from "@/lib/cost/record-usage";
import type { Lead, ScrapeResults } from "@/types/database";

// One site an hour, for as long as there is a queue.
//
// The send rate is thirty a day, so the build rate is thirty a day, so this is
// a cron rather than a batch. That is the whole design: no fan-out, no
// concurrency ceiling, no progress table, no "build 300" button that can be
// pressed twice. An hour is also a long time to get a single lead wrong in, so
// a failure here costs one lead and the next hour fixes itself.
//
// Roughly $0.61 a lead on Gemini 3.1 Pro, so a full month of this is about $550
// — which is the reason it is paced rather than greedy.
export const buildNextLead = inngest.createFunction(
  { id: "build-next-lead" },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const admin = createAdminClient();

    // Claim before working.
    //
    // Flipping status to 'scraping' first is what stops the next hour's run —
    // or a manual Build now — picking up the same lead. The claim is a single
    // conditional update rather than a read-then-write, so two runners racing
    // cannot both win it.
    const claimed = await step.run("claim-a-lead", async () => {
      const { data: candidates } = await admin
        .from("leads")
        .select("id, source_url, business_name, industry")
        .eq("status", "new")
        .not("source_url", "is", null)
        .order("created_at", { ascending: true })
        .limit(5)
        .returns<Pick<Lead, "id" | "source_url" | "business_name" | "industry">[]>();

      for (const candidate of candidates ?? []) {
        const { data: won } = await admin
          .from("leads")
          .update({ status: "scraping" })
          .eq("id", candidate.id)
          .eq("status", "new")
          .select("id")
          .maybeSingle<{ id: string }>();
        if (won) return candidate;
      }
      return null;
    });

    if (!claimed) return { skipped: "queue is empty" };

    const leadId = claimed.id;
    setUsageContext(leadId, "hourly-build");
    console.log(`[build-next-lead] ${leadId} — ${claimed.source_url}`);

    try {
      // ---- 1. what the business actually is -------------------------------
      await step.run("scrape", async () => {
        await scrapeBusiness(leadId, claimed.source_url, claimed.business_name ?? undefined, "light");

        const { data: scrape } = await admin
          .from("scrape_results")
          .select("facts")
          .eq("lead_id", leadId)
          .maybeSingle<{ facts: Record<string, unknown> }>();
        if (!scrape?.facts) return { skipped: "no facts" };

        const identity = await classifyBusiness(scrape.facts);
        const facts = { ...scrape.facts };
        const updates: Record<string, unknown> = {};

        if (identity) {
          if (identity.industry && !claimed.industry) updates.industry = identity.industry;
          if (identity.businessName && !claimed.business_name) updates.business_name = identity.businessName;
          if (identity.businessName) facts.business_name = identity.businessName;
          if (identity.city && !facts.town) facts.town = identity.city;
          if (identity.services.length) facts.derived_services = identity.services;
          if (identity.areas.length) facts.derived_areas = identity.areas;
        }

        // The specific things this business has — the material the cold email's
        // first line is built from, and the reason it does not read like the
        // other forty in the inbox.
        const { entities } = await extractEntities(facts);

        await admin.from("scrape_results").update({ facts, entities }).eq("lead_id", leadId);
        if (Object.keys(updates).length) await admin.from("leads").update(updates).eq("id", leadId);
        return { entities: entities.length };
      });

      // ---- 2. an address to send to ---------------------------------------
      //
      // Written back onto the lead so the pipeline and the sender can both see
      // at a glance whether this one is mailable, without re-deriving it.
      await step.run("resolve-email", async () => {
        const { data: scrape } = await admin
          .from("scrape_results")
          .select("facts, places_raw")
          .eq("lead_id", leadId)
          .maybeSingle<Pick<ScrapeResults, "facts" | "places_raw">>();

        const { data: lead } = await admin
          .from("leads")
          .select("phone, email")
          .eq("id", leadId)
          .maybeSingle<{ phone: string | null; email: string | null }>();

        if (lead?.email) return { kept: lead.email };

        const contact = resolveBusinessContact(scrape, { phone: lead?.phone, email: lead?.email });
        if (!contact.email) return { found: false };

        await admin.from("leads").update({ email: contact.email }).eq("id", leadId);
        return { found: true };
      });

      // ---- 3. their photographs -------------------------------------------
      await step.run("photos", async () => {
        const { data: scrape } = await admin
          .from("scrape_results")
          .select("facts")
          .eq("lead_id", leadId)
          .maybeSingle<{ facts: Record<string, unknown> }>();
        if (!scrape?.facts) return { skipped: "no facts" };

        const urls = realPhotos(scrape.facts);
        if (!urls.length) return { skipped: "no photos on this site" };

        const { data: lead } = await admin
          .from("leads")
          .select("industry")
          .eq("id", leadId)
          .maybeSingle<{ industry: string | null }>();

        const assets = await ingestRealPhotos(leadId, urls, lead?.industry ?? "");
        return { stored: assets.length, usable: assets.filter((a) => a.usable).length };
      });

      // ---- 4. the page ------------------------------------------------------
      await step.run("generate", async () => {
        const [{ data: lead }, { data: scrape }, { data: artifact }] = await Promise.all([
          admin.from("leads").select("*").eq("id", leadId).single<Lead>(),
          admin.from("scrape_results").select("*").eq("lead_id", leadId).single<ScrapeResults>(),
          admin
            .from("artifacts")
            .select("id, extracted_assets, inspiration_branding")
            .eq("lead_id", leadId)
            .maybeSingle<{ id: string; extracted_assets: Record<string, unknown> | null; inspiration_branding: unknown }>(),
        ]);
        if (!lead || !scrape) throw new Error("lead or scrape missing at generate");

        if (!artifact) {
          const { data: shell } = await admin.from("template_shells").select("id").limit(1).single();
          if (!shell) throw new Error("no template shell in the database");
          await admin
            .from("artifacts")
            .insert({ lead_id: leadId, template_shell_id: shell.id, funnel_pages: [], qa_status: "pending" });
        }

        const overrides = ((artifact?.extracted_assets ?? {}).brief_overrides ?? {}) as Record<string, unknown>;
        const brief = buildSiteBrief(lead, scrape, overrides);

        // A brief this thin produces exactly the generic page the whole rebuild
        // exists to avoid, and an unsendable page still costs sixty cents.
        const { ready, warnings } = briefReadiness(brief);
        if (!ready) throw new Error(`brief too thin to build: ${warnings.join(" ")}`);

        const facts = (scrape.facts ?? {}) as Record<string, unknown>;
        const current: CurrentSite = {
          url: lead.source_url,
          pagespeedMobile:
            typeof scrape.pagespeed_mobile?.score === "number" ? (scrape.pagespeed_mobile.score as number) : null,
          headline: (facts.pages as { title?: string }[] | undefined)?.[0]?.title?.trim() || null,
        };

        const brandHex =
          (facts.brand_color_hex as string | undefined) ??
          ((artifact?.inspiration_branding as { colors?: { primary?: string } } | null)?.colors?.primary ?? "");

        const assets = (artifact?.extracted_assets ?? {}) as Record<string, unknown>;

        // Stock only when the client is genuinely short of photographs, and
        // only ever for atmosphere — see topUpWithStock.
        let photos = await usablePhotos(leadId);
        if (photos.length < 8) {
          await topUpWithStock(leadId, brief.industry, brief.city, photos.length);
          photos = await usablePhotos(leadId);
        }
        const result = await generateHomepage(
          brief,
          photos,
          brandHex,
          artifact?.inspiration_branding ?? null,
          current,
          { logoUrl: resolveLogoUrl(assets, facts), footerLogoUrl: resolveFooterLogoUrl(assets, facts) }
        );

        await updateArtifact(
          leadId,
          {
            bespoke_homepage_html: result.html,
            bespoke_rationale: result.plan,
            colour_source: brandHex ? "client" : "house",
            generation_phase: 1,
            last_edited_at: new Date().toISOString(),
          },
          "hourly-build"
        );
        await recordVersion(leadId, HOME_KEY, result.html, "generated", "Built by the hourly run");

        return {
          kb: Math.round(result.bytes / 1024),
          cssKb: Math.round(result.cssBytes / 1024),
          sections: result.sections,
          photos: result.photosUsed,
        };
      });

      // ---- 5. the email -----------------------------------------------------
      //
      // Its own step and deliberately non-fatal: a page with no draft is still
      // a page, and a draft can be rewritten from the lead screen. Losing the
      // build over it would waste the sixty cents already spent.
      await step.run("draft-email", async () => {
        const [{ data: lead }, { data: scrape }] = await Promise.all([
          admin.from("leads").select("*").eq("id", leadId).single<Lead>(),
          admin.from("scrape_results").select("*").eq("lead_id", leadId).maybeSingle<ScrapeResults>(),
        ]);
        if (!lead) return { skipped: "lead vanished" };

        const { draft, reason } = await generateOutreachDraft(lead, scrape ?? null);
        if (!draft) return { skipped: reason ?? "no draft" };

        await admin.from("leads").update({ outreach_draft: draft }).eq("id", leadId);
        return { subject: draft.subject };
      });

      await step.run("mark-ready", async () => {
        await admin.from("leads").update({ status: "qa_pending" }).eq("id", leadId);
      });

      return { leadId, status: "ready_for_review" };
    } catch (err) {
      // Put the lead back rather than leaving it stuck on 'scraping' forever,
      // and record why on the artifact so the operator can see it without
      // going to read Inngest's logs.
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[build-next-lead] ${leadId} failed: ${message}`);
      await admin.from("leads").update({ status: "new" }).eq("id", leadId);
      await admin
        .from("build_jobs")
        .insert({ lead_id: leadId, stage: "bespoke", status: "failed", error_message: message.slice(0, 500) });
      throw err;
    }
  }
);
