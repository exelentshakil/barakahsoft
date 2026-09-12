import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { buildSiteBrief, briefReadiness, type BriefOverrides } from "@/lib/build-site-brief";
import { generateHomepage, usablePhotos, type CurrentSite, type BrandMarks } from "@/lib/generate-homepage";
import { resolveLogoUrl, resolveFooterLogoUrl } from "@/lib/brand-assets";
import { topUpWithStock } from "@/lib/media/ingest";
import { updateArtifact } from "@/lib/artifact-write";
import { recordVersion, HOME_KEY } from "@/lib/page-versions";
import type { Lead, ScrapeResults } from "@/types/database";

// The Studio's generate button, and the entire build.
//
// This used to validate and hand off to a fourteen-step Inngest job. The job is
// gone: one model call does not need a queue, a progress table, a polling loop
// or a local dev worker, and every one of those was a place a build could
// silently stall with nothing to read but logs.
//
// 300 seconds is the platform default and comfortably covers a call that takes
// 60-180. If a page ever genuinely needs longer than that, the honest fix is to
// make the page smaller, not to hide the wait behind a queue.
export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const supplied = (await req.json().catch(() => ({}))) as BriefOverrides;
  const admin = createAdminClient();

  const [{ data: lead }, { data: scrapeResults }, { data: priorArtifact }] = await Promise.all([
    admin.from("leads").select("*").eq("id", leadId).single<Lead>(),
    admin.from("scrape_results").select("*").eq("lead_id", leadId).single<ScrapeResults>(),
    admin
      .from("artifacts")
      .select("id, extracted_assets, inspiration_branding")
      .eq("lead_id", leadId)
      .maybeSingle<{
        id: string;
        extracted_assets: Record<string, unknown> | null;
        inspiration_branding: Record<string, unknown> | null;
      }>(),
  ]);

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!scrapeResults) {
    return NextResponse.json(
      { error: "This lead has not been scraped yet. Run a scrape before generating." },
      { status: 409 }
    );
  }

  // Brief overrides are operator truth, and they have to outlive the request
  // that carried them.
  //
  // Facebook's rating and count sit behind a login wall, so no scraper can read
  // them — the operator types them in, and without this they had to be retyped
  // before every rebuild. A key this request omits keeps its stored value; a key
  // it sends as null is the operator clearing the field, and that is honoured.
  const storedAssets = (priorArtifact?.extracted_assets ?? {}) as Record<string, unknown>;
  const overrides: BriefOverrides = {
    ...((storedAssets.brief_overrides ?? {}) as Partial<BriefOverrides>),
    ...supplied,
  };

  const brief = buildSiteBrief(lead, scrapeResults, overrides);

  // Generating from a brief this thin produces exactly the generic page the
  // rebuild exists to eliminate, so it is refused rather than silently padded
  // with invented services.
  const { ready, warnings } = briefReadiness(brief);
  if (!ready) {
    return NextResponse.json(
      {
        error:
          "Not enough real information to build a page worth sending. Add the real services in the brief, or re-scrape the client's site first.",
        warnings,
      },
      { status: 422 }
    );
  }

  // An artifact row must exist before the write lands — updateArtifact throws
  // on a filter that matches nothing, which is the whole point of it.
  if (!priorArtifact) {
    const { data: shell } = await admin.from("template_shells").select("id").limit(1).single();
    if (!shell) return NextResponse.json({ error: "No template shell found in database" }, { status: 500 });
    const { error: insertErr } = await admin
      .from("artifacts")
      .insert({ lead_id: leadId, template_shell_id: shell.id, funnel_pages: [], qa_status: "pending" });
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  await admin
    .from("artifacts")
    .update({ extracted_assets: { ...storedAssets, brief_overrides: overrides } })
    .eq("lead_id", leadId);

  // Curated at scrape time, not here — if the operator deleted a photo it is
  // already gone. The one exception is a business with almost no photography:
  // a twelve-section page built from three images leaves dead space, so stock
  // tops it up for atmosphere only, clearly flagged, and never as proof.
  let photos = await usablePhotos(leadId);
  if (photos.length < 8) {
    await topUpWithStock(leadId, brief.industry, brief.city, photos.length);
    photos = await usablePhotos(leadId);
  }

  const brandHex =
    overrides.brandHex?.trim() ||
    (scrapeResults.facts as Record<string, unknown> | null)?.brand_color_hex as string | undefined ||
    ((priorArtifact?.inspiration_branding as { colors?: { primary?: string } } | null)?.colors?.primary ?? null);

  // The site this page has to beat. A redesign generated without ever seeing
  // what it replaces is aiming at nothing.
  const facts = (scrapeResults.facts ?? {}) as Record<string, unknown>;
  const current: CurrentSite = {
    url: lead.source_url,
    pagespeedMobile:
      typeof scrapeResults.pagespeed_mobile?.score === "number"
        ? (scrapeResults.pagespeed_mobile.score as number)
        : null,
    // The <title> of their real homepage — usually the tagline they chose for
    // themselves, which is the clearest statement of what they think they sell.
    headline:
      (facts.pages as { title?: string }[] | undefined)?.[0]?.title?.trim() || null,
  };

  // Their own mark, which the generator was never given — so every page it
  // wrote set the business name in type and called that a logotype.
  const marks: BrandMarks = {
    logoUrl: resolveLogoUrl(storedAssets, facts),
    footerLogoUrl: resolveFooterLogoUrl(storedAssets, facts),
  };

  try {
    const result = await generateHomepage(
      brief,
      photos,
      brandHex ?? "",
      priorArtifact?.inspiration_branding ?? null,
      current,
      marks
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
      "homepage"
    );

    // History, so an image swap or a rebuild stays undoable.
    await recordVersion(leadId, HOME_KEY, result.html, "generated", "Homepage generated");

    await admin.from("leads").update({ status: "qa_pending" }).eq("id", leadId);

    return NextResponse.json({
      ok: true,
      leadId,
      slug: lead.slug,
      warnings,
      photosSupplied: photos.length,
      photosUsed: result.photosUsed,
      continued: result.continued,
      bytes: result.bytes,
      cssBytes: result.cssBytes,
      sections: result.sections,
      plan: result.plan,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[generate] ${leadId}: ${message}`);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
