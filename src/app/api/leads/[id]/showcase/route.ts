import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { captureShowcasePair } from "@/lib/showcase/capture";

// Approving one lead's redesign for the public landing page.
//
// Gated on isAdminSession rather than the bare `auth.getUser()` most routes
// here use. That check only proves someone completed a magic-link sign-in;
// it does not prove they are an operator. This endpoint publishes a real
// client's business name and their old website onto the marketing homepage,
// so it uses the same accounts-table allowlist middleware applies to /admin.

function portalOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_PORTAL_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;

  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action;

  const admin = createAdminClient();

  if (action === "revoke") {
    const { error } = await admin
      .from("leads")
      .update({ showcase_approved: false, showcase_approved_at: null })
      .eq("id", leadId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // Without this the removed showcase keeps serving from the cached
    // landing page — the operator would think the takedown silently failed.
    revalidatePath("/");
    // The images are deliberately kept. Re-approving a lead is a common
    // operator action, and re-capturing costs another browser run.
    return NextResponse.json({ approved: false });
  }

  if (action !== "approve") {
    return NextResponse.json({ error: "action must be 'approve' or 'revoke'" }, { status: 400 });
  }

  const { data: lead, error: readError } = await admin
    .from("leads")
    .select("id, slug, source_url, business_name, industry, showcase_before_url, showcase_after_url")
    .eq("id", leadId)
    .maybeSingle();

  if (readError || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // An operator can override either side by pasting a URL — used when the
  // client's old site is already offline, or when a hand-taken screenshot
  // simply looks better than what a headless browser produced.
  const manualBefore = typeof body?.beforeUrl === "string" && body.beforeUrl.trim() ? body.beforeUrl.trim() : null;
  const manualAfter = typeof body?.afterUrl === "string" && body.afterUrl.trim() ? body.afterUrl.trim() : null;
  const recapture = body?.recapture === true;

  let beforeUrl = manualBefore ?? lead.showcase_before_url ?? null;
  let afterUrl = manualAfter ?? lead.showcase_after_url ?? null;
  const problems: string[] = [];

  // Only spend browser runs on sides we actually still need.
  const needsCapture = recapture || !beforeUrl || !afterUrl;
  if (needsCapture) {
    const captured = await captureShowcasePair(
      lead.id,
      lead.source_url,
      `${portalOrigin()}/s/${lead.slug}?view=preview`
    );
    if (recapture || !beforeUrl) beforeUrl = manualBefore ?? captured.beforeUrl ?? beforeUrl;
    if (recapture || !afterUrl) afterUrl = manualAfter ?? captured.afterUrl ?? afterUrl;
    problems.push(...captured.problems);
  }

  if (!beforeUrl || !afterUrl) {
    // Refuse rather than approve a half-populated card the landing page
    // would silently filter out, leaving the operator thinking it published.
    return NextResponse.json(
      {
        error: "Both a before and an after image are required before this can go on the landing page.",
        problems,
        beforeUrl,
        afterUrl,
      },
      { status: 422 }
    );
  }

  const label =
    (typeof body?.label === "string" && body.label.trim() ? body.label.trim() : null) ??
    lead.industry ??
    null;

  const { error: updateError } = await admin
    .from("leads")
    .update({
      showcase_approved: true,
      showcase_approved_at: new Date().toISOString(),
      showcase_before_url: beforeUrl,
      showcase_after_url: afterUrl,
      showcase_label: label ? label.slice(0, 80) : null,
    })
    .eq("id", leadId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // The landing page is cached; without this the operator approves it and
  // then cannot find it on the site.
  revalidatePath("/");

  return NextResponse.json({ approved: true, beforeUrl, afterUrl, label, problems });
}
