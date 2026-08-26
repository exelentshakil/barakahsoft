import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { sendEmail } from "@/lib/notifications";
import { stageFor, isDue, type OutreachContext, type SequenceTrack } from "@/lib/outreach/sequence";
import type { Lead } from "@/types/database";

// Send one touch of the cold sequence to a selected set of prospects.
//
// This contacts real businesses that never asked to hear from us, so it is
// deliberately narrow: an operator selects the recipients, names the stage,
// and each lead is re-checked server-side before anything is sent. A request
// naming a stage a lead is not actually owed is skipped rather than sent —
// the client's idea of the list can be stale, and a duplicate cold email is
// worse than a missing one.

// A generous cap rather than none. Anything larger than this is a list
// import, which belongs in a job rather than a request that can time out
// halfway through and leave no record of who was reached.
const MAX_BATCH = 50;

export const maxDuration = 300;

/**
 * The sequence is written as plain text on purpose — a cold first contact
 * that arrives as a designed template reads as bulk mail. This keeps it
 * looking typed while still being valid HTML, which is what the transport
 * expects.
 */
function asHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#0c68c8">$1</a>'
  );
  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">${linked.replace(/\n/g, "<br />")}</div>`;
}

function portalOrigin(): string {
  return (process.env.NEXT_PUBLIC_PORTAL_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

function sanitizeEmail(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const match = String(candidate).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|co|io|us|uk|ca|au|biz|info|tv|app|dev|me|site|tech|agency|studio|services|construction|plumbing|roofing)/i);
  return match ? match[0].toLowerCase() : null;
}

export async function POST(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  // Inbound leads asked for the rebuild and cold prospects did not, so they
  // get different wording and a different reason-for-contact line. Sending
  // one track's copy on the other is worse than sending nothing.
  const track: SequenceTrack = body?.track === "inbound" ? "inbound" : "outreach";
  const stageNumber = Number(body?.stage);
  const stage = stageFor(stageNumber, track);
  if (!stage) {
    return NextResponse.json({ error: "stage must be 1, 2 or 3" }, { status: 400 });
  }

  const ids: string[] = Array.isArray(body?.leadIds) ? body.leadIds.filter((v: unknown) => typeof v === "string") : [];
  if (ids.length === 0) return NextResponse.json({ error: "Select at least one prospect." }, { status: 400 });
  if (ids.length > MAX_BATCH) {
    return NextResponse.json({ error: `Select at most ${MAX_BATCH} prospects at a time.` }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: leads, error } = await admin.from("leads").select("*").in("id", ids).returns<Lead[]>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sent: string[] = [];
  const skipped: { id: string; business: string; reason: string }[] = [];

  for (const lead of leads ?? []) {
    const name = lead.business_name ?? lead.source_url;

    if (lead.outreach_stopped_at) {
      skipped.push({ id: lead.id, business: name, reason: "sequence stopped for this prospect" });
      continue;
    }
    if (!lead.email) {
      skipped.push({ id: lead.id, business: name, reason: "no email address on file" });
      continue;
    }
    // The stage the client asked for must be the one this lead is actually
    // owed; otherwise a stale list re-sends a touch they already had.
    if ((lead.outreach_stage ?? 0) + 1 !== stage.stage) {
      skipped.push({ id: lead.id, business: name, reason: `already at stage ${lead.outreach_stage ?? 0}` });
      continue;
    }
    if (!isDue(lead, track)) {
      skipped.push({ id: lead.id, business: name, reason: `not due yet (${stage.dueAfterHours}h gap)` });
      continue;
    }

    const ctx: OutreachContext = {
      businessName: lead.business_name ?? "your business",
      previewUrl: `${portalOrigin()}/s/${lead.slug}?view=preview`,
      city: null,
      headlineFinding: null,
    };

    // sendEmail reports failure by returning false rather than throwing, so
    // both paths have to be handled or a bounced send would still advance
    // the stage and the prospect would never receive that touch.
    let delivered = false;
    try {
      delivered = await sendEmail({
        to: sanitizeEmail(lead.email) || lead.email,
        subject: stage.subject(ctx),
        html: asHtml(stage.body(ctx)),
      });
    } catch (err) {
      skipped.push({ id: lead.id, business: name, reason: err instanceof Error ? err.message : "send failed" });
      continue;
    }
    if (!delivered) {
      skipped.push({ id: lead.id, business: name, reason: "the email provider rejected the send" });
      continue;
    }

    // Recorded only after the send actually succeeded, so a failure leaves
    // the prospect owed the same touch rather than silently skipped forever.
    await admin
      .from("leads")
      .update({ outreach_stage: stage.stage, outreach_last_sent_at: new Date().toISOString() })
      .eq("id", lead.id);

    sent.push(lead.id);
  }

  return NextResponse.json({ track, stage: stage.stage, label: stage.label, sent: sent.length, skipped });
}
