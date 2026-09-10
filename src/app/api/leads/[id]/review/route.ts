import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { inngest } from "@/inngest/client";

// Approving, rejecting or rebuilding one generated homepage.
//
// Builds run unattended and land in the queue rather than going anywhere near
// a prospect. Approving only marks an artifact fit to send — sending happens
// in whichever outreach tool the operator uses, deliberately outside this app.
//
// Gated on isAdminSession rather than a bare auth check, for the same reason
// the showcase route is: completing a magic-link sign-in does not make someone
// an operator, and this decides what a real business receives.

type Action = "approve" | "reject" | "rebuild";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const { id: leadId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: Action;
    reason?: string;
    referenceUrl?: string;
  };
  const action = body.action;
  if (!action || !["approve", "reject", "rebuild"].includes(action)) {
    return NextResponse.json({ error: "action must be approve, reject or rebuild" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: artifact } = await admin
    .from("artifacts")
    .select("lead_id, extracted_assets, bespoke_homepage_html")
    .eq("lead_id", leadId)
    .maybeSingle<{ lead_id: string; extracted_assets: Record<string, unknown> | null; bespoke_homepage_html: string | null }>();

  if (!artifact) return NextResponse.json({ error: "No such lead" }, { status: 404 });

  if (action === "approve") {
    if (!artifact.bespoke_homepage_html) {
      return NextResponse.json({ error: "Nothing built yet to approve" }, { status: 409 });
    }
    await admin
      .from("artifacts")
      .update({ review_state: "approved", approved_at: new Date().toISOString() })
      .eq("lead_id", leadId);
    return NextResponse.json({ ok: true, state: "approved" });
  }

  if (action === "reject") {
    const assets = (artifact.extracted_assets ?? {}) as Record<string, unknown>;
    const reasons = Array.isArray(assets.reject_reasons) ? (assets.reject_reasons as string[]) : [];
    await admin
      .from("artifacts")
      .update({
        review_state: "rejected",
        approved_at: null,
        // Kept as a list rather than a single field. One rejection is an
        // opinion; the same reason appearing twenty times is the next prompt
        // change, and that only shows up if they accumulate.
        extracted_assets: {
          ...assets,
          reject_reasons: [...reasons, `${new Date().toISOString()} ${body.reason ?? "no reason given"}`].slice(-40),
        },
      })
      .eq("lead_id", leadId);
    return NextResponse.json({ ok: true, state: "rejected" });
  }

  // Rebuild with a different look.
  //
  // The salt advances so the run is genuinely a different build rather than a
  // deterministic repeat, and clearing the stored design direction sends the
  // next run back through reference selection instead of reusing the one that
  // produced a page the operator just turned down.
  const assets = (artifact.extracted_assets ?? {}) as Record<string, unknown>;
  const salt = ((assets.layout_salt as number | undefined) ?? 0) + 1;

  const patch: Record<string, unknown> = {
    review_state: "building",
    approved_at: null,
    extracted_assets: { ...assets, layout_salt: salt },
  };

  if (body.referenceUrl) {
    // An operator-chosen reference wins over anything automatic.
    patch.inspiration_url = body.referenceUrl;
    patch.inspiration_branding = null;
  } else {
    // No specific reference asked for, so discard the current direction and
    // let selection run again. Keeping it would reproduce the look that was
    // just rejected with only the salt changed.
    patch.inspiration_branding = null;
  }

  await admin.from("artifacts").update(patch).eq("lead_id", leadId);

  if (body.referenceUrl) {
    await inngest.send({ name: "lead/analyse.requested", data: { lead_id: leadId, reason: "rebuild-reference" } });
  }
  await inngest.send({
    name: "bespoke/generate.requested",
    data: { lead_id: leadId, overrides: { layoutSalt: salt }, phase: 1 },
  });

  return NextResponse.json({ ok: true, state: "building", salt });
}
