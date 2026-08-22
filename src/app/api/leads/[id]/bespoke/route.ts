import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { sanitizeBespokeHtml } from "@/lib/sanitize-generated-html";
import { writeLivePage, HOME_KEY } from "@/lib/page-versions";

// The refinement endpoint: how a human — directly, or through Claude Code —
// rewrites a page after the generator has produced its first draft.
//
// Two things it now does that it did not before.
//
// It writes through the version recorder, so an edit never destroys the
// version it replaced. Iterating on a page is only safe if going back is
// cheap, and the whole workflow depends on iterating.
//
// It sanitizes. This route accepted arbitrary HTML straight into a public
// client site, which meant an edit made here bypassed every guarantee the
// generated path enforces — brand palette, class vocabulary, no scripts, no
// credential-bearing URLs.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const admin = createAdminClient();

  // Page content goes through the version recorder.
  const pageKey = typeof body.page_key === "string" && body.page_key ? body.page_key : HOME_KEY;
  const rawHtml = typeof body.html === "string" ? body.html : typeof body.bespoke_html === "string" ? body.bespoke_html : null;

  let version: number | null = null;
  if (rawHtml !== null) {
    const clean = sanitizeBespokeHtml(rawHtml);
    if (clean.replace(/<[^>]+>/g, "").trim().length < 50) {
      return NextResponse.json(
        { error: "That markup is empty once sanitized — check it uses bs-* classes and real content." },
        { status: 422 }
      );
    }
    version = await writeLivePage(
      leadId,
      pageKey,
      clean,
      "claude-code",
      typeof body.note === "string" ? body.note.slice(0, 200) : undefined
    );
  }

  // Structural fields are not page content and carry no version history.
  const updates: Record<string, unknown> = {};
  if (Array.isArray(body.funnel_pages)) updates.funnel_pages = body.funnel_pages;

  if (body.extracted_assets && typeof body.extracted_assets === "object") {
    const { data: existing } = await admin
      .from("artifacts")
      .select("extracted_assets")
      .eq("lead_id", leadId)
      .single<{ extracted_assets: Record<string, unknown> }>();

    updates.extracted_assets = { ...(existing?.extracted_assets ?? {}), ...body.extracted_assets };
  }

  if (Object.keys(updates).length > 0) {
    updates.last_edited_at = new Date().toISOString();
    const { error } = await admin.from("artifacts").update(updates).eq("lead_id", leadId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, lead_id: leadId, page_key: pageKey, version });
}
