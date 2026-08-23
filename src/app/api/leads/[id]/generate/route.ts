import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { inngest } from "@/inngest/client";
import { buildSiteBrief, briefReadiness, type BriefOverrides } from "@/lib/build-site-brief";
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

  const body = (await req.json().catch(() => ({}))) as BriefOverrides & { phase?: 1 | 2; provider?: string };
  const phase = body.phase === 2 ? 2 : 1;
  const provider = body.provider === "gemini" ? "gemini" : "openai";
  const overrides = body;
  const admin = createAdminClient();

  const [{ data: lead }, { data: scrapeResults }] = await Promise.all([
    admin.from("leads").select("*").eq("id", leadId).single<Lead>(),
    admin.from("scrape_results").select("*").eq("lead_id", leadId).single<ScrapeResults>(),
  ]);

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!scrapeResults) {
    return NextResponse.json(
      { error: "This lead has not been scraped yet. Run a scrape before generating." },
      { status: 409 }
    );
  }

  if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini is not configured on this deployment — GEMINI_API_KEY is not set." }, { status: 422 });
  }

  const brief = buildSiteBrief(lead, scrapeResults, overrides);
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
  const { data: existing } = await admin.from("artifacts").select("id").eq("lead_id", leadId).maybeSingle();
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
    const { data: artifact } = await admin
      .from("artifacts")
      .select("copy_plan, generation_phase")
      .eq("lead_id", leadId)
      .maybeSingle<{ copy_plan: unknown; generation_phase: number }>();

    if (!artifact?.copy_plan || (artifact.generation_phase ?? 0) < 1) {
      return NextResponse.json(
        { error: "Build the core site first — the full site reuses the copy and photography the client approved." },
        { status: 409 }
      );
    }
  }

  await inngest.send({
    name: "bespoke/generate.requested",
    data: { lead_id: leadId, overrides, phase, provider },
  });

  return NextResponse.json({
    ok: true,
    leadId,
    slug: lead.slug,
    started: true,
    phase,
    provider,
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
  const { data: job } = await admin
    .from("build_jobs")
    .select("status, pages_done, pages_total, error_message, updated_at")
    .eq("lead_id", leadId)
    .eq("stage", "bespoke")
    .maybeSingle();

  return NextResponse.json({ job: job ?? null });
}
