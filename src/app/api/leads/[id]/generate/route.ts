import { profileForLead } from "@/lib/verticals/resolve";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { inngest } from "@/inngest/client";
import { buildSiteBrief, briefReadiness, type BriefOverrides } from "@/lib/build-site-brief";
import { layoutDnaFor } from "@/lib/generate/v2/layout-dna";
import { visualQaEnabled } from "@/lib/visual-qa";
import type { Lead, ScrapeResults } from "@/types/database";

// The Studio's generate button.
//
// This route used to build the page itself out of hardcoded strings — an
// electrician's service list and a fixed phone number were baked in as
// fallbacks, which is why unrelated businesses received near-identical
// "bespoke" sites. It now does what a request should do: validate, hand off
// to the background generator, and return immediately. All real generation
// happens in src/inngest/functions/bespoke-generate.ts.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as BriefOverrides & { phase?: 1 | 2 };
  const phase = body.phase === 2 ? 2 : 1;
  const { phase: _phase, ...supplied } = body;
  const admin = createAdminClient();

  const [{ data: lead }, { data: scrapeResults }, { data: priorArtifact }] = await Promise.all([
    admin.from("leads").select("*").eq("id", leadId).single<Lead>(),
    admin.from("scrape_results").select("*").eq("lead_id", leadId).single<ScrapeResults>(),
    admin
      .from("artifacts")
      .select("id, extracted_assets")
      .eq("lead_id", leadId)
      .maybeSingle<{ id: string; extracted_assets: Record<string, unknown> | null }>(),
  ]);

  // Brief overrides are operator truth, and they have to outlive the request
  // that carried them.
  //
  // They were read straight off the body and thrown away afterwards. The
  // Studio re-mounted from server state with the fields blank, so the
  // Facebook rating and count — which no scraper can read, because Facebook
  // hides them, and which therefore exist nowhere else — had to be retyped
  // before every single rebuild. Worse, the phase 2 button posts `{phase:2}`
  // and nothing else, so the deep build re-derived its brief from the scrape
  // alone and silently discarded every correction: founder, city, services,
  // areas, logo, hero image, along with the Facebook proof.
  //
  // What the operator last set is stored on the artifact and merged under
  // whatever this request supplies. A key the request omits keeps its stored
  // value; a key it sends as null is an operator clearing the field, and
  // that is honoured.
  const storedAssets = (priorArtifact?.extracted_assets ?? {}) as Record<string, unknown>;
  const storedOverrides = (storedAssets.brief_overrides ?? {}) as Partial<BriefOverrides>;
  const legacyMockup = (storedAssets.mockup ?? {}) as Record<string, unknown>;

  const overrides: BriefOverrides = { ...storedOverrides };
  // Facebook proof previously lived under `mockup`, where the Studio still
  // reads it. Carry it forward once so nobody has to retype it again.
  if (overrides.facebookRating == null && typeof legacyMockup.facebookRating === "number") {
    overrides.facebookRating = legacyMockup.facebookRating;
  }
  if (overrides.facebookReviewCount == null && typeof legacyMockup.facebookReviewCount === "number") {
    overrides.facebookReviewCount = legacyMockup.facebookReviewCount;
  }
  Object.assign(overrides, supplied);

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!scrapeResults) {
    return NextResponse.json(
      { error: "This lead has not been scraped yet. Run a scrape before generating." },
      { status: 409 }
    );
  }

    // No two leads ship the same composition.
  //
  // The DNA already spread across ~29,000 skins, but every page was built on
  // one skeleton, so two roofers read as the same website however different
  // their heroes were. Recipes vary the skeleton; this makes the result
  // actually unique rather than merely unlikely to repeat.
  //
  // The salt is resolved once and then persisted with the rest of the
  // overrides, so a rebuild is a rebuild — the client does not open their
  // site to a different page than the one they approved.
  if (overrides.layoutSalt == null) {
    const identity = `${lead.slug}|${lead.business_name ?? ""}|${lead.industry ?? ""}|${(scrapeResults.facts as Record<string, unknown> | null)?.town ?? ""}`;

    const { data: siblings } = await admin
      .from("artifacts")
      .select("lead_id, extracted_assets, leads!inner(industry)")
      .neq("lead_id", leadId);

    const takenFingerprints = new Set<string>();
    const takenFoldsInTrade = new Set<string>();
    const takenRecipesInTrade = new Set<string>();
    // The embed comes back as an array even on a to-one relation.
    for (const row of (siblings ?? []) as unknown as { extracted_assets: Record<string, unknown> | null; leads: { industry: string | null }[] | null }[]) {
      const composition = (row.extracted_assets?.layout_composition ?? {}) as {
        fingerprint?: string;
        heroFingerprint?: string;
        recipe?: string;
      };
      if (composition.fingerprint) takenFingerprints.add(composition.fingerprint);
      // Within one trade the pages sit side by side in the same inbox, so
      // they get a different recipe, not merely a different footer.
      const siblingTrade = row.leads?.[0]?.industry ?? null;
      if (siblingTrade && lead.industry && siblingTrade === lead.industry) {
        if (composition.recipe) takenRecipesInTrade.add(composition.recipe);
        // The launch post shows the fold and nothing else, so two leads in one
        // trade must differ there and not merely somewhere below it.
        if (composition.heroFingerprint) takenFoldsInTrade.add(composition.heroFingerprint);
      }
    }

    let salt = 0;
    for (; salt < 64; salt += 1) {
      const candidate = layoutDnaFor(identity, salt);
      const fingerprintFree = !takenFingerprints.has(candidate.fingerprint);
      const foldFree = !takenFoldsInTrade.has(candidate.heroFingerprint);
      const recipeFree = !takenRecipesInTrade.has(candidate.recipe.id);
      // Past the catalogue every arrangement is spoken for in this trade, so a
      // unique fingerprint is the most that can be promised.
      const exhausted = takenRecipesInTrade.size >= 12;
      if (fingerprintFree && (exhausted || (foldFree && recipeFree))) break;
    }
    overrides.layoutSalt = salt;
  }

  const brief = buildSiteBrief(lead, scrapeResults, profileForLead(lead, null), overrides);
  const resolvedDna = layoutDnaFor(
    `${brief.leadSlug}|${brief.businessName}|${brief.industry}|${brief.city}`,
    brief.layoutSalt ?? 0
  );
  const { ready, warnings } = briefReadiness(brief);

  // Generating from a brief this thin produces exactly the generic page
  // this rebuild exists to eliminate, so it is refused rather than silently
  // padded with invented services.
  if (!ready) {
    return NextResponse.json(
      {
        error: "Not enough real information to build a high-value site. Add the real services in the brief, or re-scrape the client's site first.",
        warnings,
      },
      { status: 422 }
    );
  }

  // An artifact row must exist before the job starts, since every step
  // updates it in place.
  const existing = priorArtifact;
  if (!existing) {
    const { data: shell } = await admin.from("template_shells").select("id").limit(1).single();
    if (!shell) return NextResponse.json({ error: "No template shell found in database" }, { status: 500 });

    const { error: insertErr } = await admin.from("artifacts").insert({
      lead_id: leadId,
      template_shell_id: shell.id,
      funnel_pages: [],
      qa_status: "pending",
    });
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Phase 2 builds the deep site (location pages, areas, blog) and is only
  // meaningful once phase 1's copy plan exists and the client has approved
  // it. Refusing here gives a clear reason rather than a failed background
  // run the operator has to go and read logs to understand.
  if (phase === 2) {
    // The approved homepage is what phase 2 builds against — it is the voice
    // and design reference every inner page is matched to. This used to
    // require copy_plan, which nothing has written since the separate copy
    // pass was removed, so the check could never pass and the whole deep
    // build was unreachable. It now asks for the thing phase 2 actually
    // needs, which is also exactly what the job itself checks.
    const { data: artifact } = await admin
      .from("artifacts")
      .select("bespoke_homepage_html, generation_phase")
      .eq("lead_id", leadId)
      .maybeSingle<{ bespoke_homepage_html: string | null; generation_phase: number }>();

    if (!artifact?.bespoke_homepage_html || (artifact.generation_phase ?? 0) < 1) {
      return NextResponse.json(
        { error: "Build the homepage first — every inner page is written to match it." },
        { status: 409 }
      );
    }
  }

  // Persist before handing off, so a rebuild started from anywhere — the
  // phase 2 button, a retry, another session — inherits the same brief.
  const { data: artifactRow } = await admin
    .from("artifacts")
    .select("extracted_assets")
    .eq("lead_id", leadId)
    .maybeSingle<{ extracted_assets: Record<string, unknown> | null }>();
  await admin
    .from("artifacts")
    .update({
      extracted_assets: {
        ...(artifactRow?.extracted_assets ?? {}),
        brief_overrides: overrides,
        // Claims this composition so the next lead cannot land on it.
        layout_composition: {
          fingerprint: resolvedDna.fingerprint,
          heroFingerprint: resolvedDna.heroFingerprint,
          tone: resolvedDna.tone.id,
          treatment: resolvedDna.treatment,
          recipe: resolvedDna.recipe.id,
          recipeName: resolvedDna.recipe.name,
          salt: overrides.layoutSalt ?? 0,
        },
      },
    })
    .eq("lead_id", leadId);

  await inngest.send({
    name: "bespoke/generate.requested",
    data: { lead_id: leadId, overrides, phase },
  });

  return NextResponse.json({
    ok: true,
    leadId,
    slug: lead.slug,
    started: true,
    phase,
    warnings,
    plan: {
      services: brief.services,
      areas: brief.areas,
      photos: brief.photos.length,
      pages: Math.min(brief.services.length, 6) + 4,
    },
  });
}

/** Live progress for the Studio's generation panel. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: job }, visualQa] = await Promise.all([
    admin
      .from("build_jobs")
      .select("status, pages_done, pages_total, error_message, updated_at")
      .eq("lead_id", leadId)
      .eq("stage", "bespoke")
      .maybeSingle(),
    visualQaEnabled()
      ? admin
          .from("generation_candidates")
          .select("id, attempt, visual_status, visual_report, created_at")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({ job: job ?? null, visualQa: visualQa.data ?? null });
}
