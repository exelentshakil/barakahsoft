import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { buildSiteBrief, briefReadiness, type BriefOverrides } from "@/lib/build-site-brief";
import { inngest } from "@/inngest/client";
import type { Lead, ScrapeResults } from "@/types/database";

// The Rebuild button: validate, then hand the work to the same job the hourly
// cron runs.
//
// This did the build inline for a while, which was fine when it was one model
// call and stopped being fine at two. A build is now three or four minutes of
// scraping, ingesting and generating, and holding that inside a request meant
// closing the tab, opening another lead or hitting refresh could abandon it
// halfway — after the model calls had been paid for and before anything was
// written. Work worth eighty-five cents does not belong somewhere a refresh can
// kill it.
//
// The build's shape is written onto the artifact instead of returned, and the
// GET below reads it back, so the operator still sees exactly what came out.
export const maxDuration = 60;

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

  // Everything past here belongs to the job.
  await inngest.send({ name: "lead/build.requested", data: { lead_id: leadId } });

  return NextResponse.json({
    ok: true,
    leadId,
    slug: lead.slug,
    started: true,
    warnings,
  });
}

/** Where a build has got to, and what the last one produced. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: lead }, { data: artifact }] = await Promise.all([
    admin.from("leads").select("status").eq("id", leadId).maybeSingle<{ status: string }>(),
    admin
      .from("artifacts")
      .select("extracted_assets, last_edited_at")
      .eq("lead_id", leadId)
      .maybeSingle<{ extracted_assets: Record<string, unknown> | null; last_edited_at: string | null }>(),
  ]);

  const stats = (artifact?.extracted_assets?.build_stats ?? null) as Record<string, unknown> | null;

  return NextResponse.json({
    status: lead?.status ?? null,
    building: ["scraping", "enriching", "rendering"].includes(lead?.status ?? ""),
    stats,
  });
}
