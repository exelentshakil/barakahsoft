import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { sendEmail } from "@/lib/notifications";
import { stageFor, isDue, signOff, type OutreachContext, type SequenceTrack } from "@/lib/outreach/sequence";
import { tenantBySlug } from "@/tenants";
import { signalsFor, type OutreachDraft } from "@/lib/outreach/personalise";
import { unsubscribeUrl } from "@/lib/outreach/unsubscribe-token";
import type { Lead, ScrapeResults } from "@/types/database";

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
 * How many cold emails may leave this domain today.
 *
 * A domain that has never sent volume gets filtered if it suddenly does, so the
 * ceiling climbs rather than starting at its target. Enforced here rather than
 * in the review screen, because a cap the operator has to remember is not a cap
 * — and the whole reason this exists is that a burnt sending domain takes
 * months to recover and costs the business its real inbox.
 *
 * Week 1 · 8/day → week 2 · 18/day → week 3 onwards · 30/day.
 */
const RAMP_START = process.env.OUTREACH_RAMP_START ?? "";

function dailyCap(now = new Date()): number {
  const started = RAMP_START ? Date.parse(RAMP_START) : NaN;
  if (!Number.isFinite(started)) return 8; // No start date set: assume day one.
  const days = Math.floor((now.getTime() - started) / 86_400_000);
  if (days < 7) return 8;
  if (days < 14) return 18;
  return 30;
}

/** Cold sends already made today, counted from the leads themselves. */
async function sentToday(admin: ReturnType<typeof createAdminClient>, tenantSlug: string): Promise<number> {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const { count } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("tenant_slug", tenantSlug)
    .gte("outreach_last_sent_at", midnight.toISOString());
  return count ?? 0;
}

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

/**
 * The one measured sentence the generic sequence has a slot for.
 *
 * Used when no personal draft was written — a lead sent straight from the
 * list still says something true about that business rather than falling
 * back to the paragraph about a portal breakdown.
 */
function headlineFindingFor(lead: Lead, scrape: ScrapeResults | null): string | null {
  const top = signalsFor(lead, scrape)[0];
  return top ? top.detail : null;
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

  // The town and the headline finding were passed as null on every send, so
  // the two slots the sequence has for saying something specific were always
  // empty. They are filled from the same scrape the report is built from.
  const { data: scrapes } = await admin
    .from("scrape_results")
    .select("*")
    .in("lead_id", ids)
    .returns<ScrapeResults[]>();
  const scrapeFor = new Map<string, ScrapeResults>();
  for (const row of scrapes ?? []) {
    const held = scrapeFor.get(row.lead_id);
    if (!held || new Date(row.scraped_at) > new Date(held.scraped_at)) scrapeFor.set(row.lead_id, row);
  }

  const sent: string[] = [];
  const skipped: { id: string; business: string; reason: string }[] = [];

  // The day's budget, counted before the loop and spent inside it. The review
  // screen chunks a large selection into several requests, so the ceiling has
  // to be re-read per request rather than assumed to be the whole allowance.
  const cap = dailyCap();
  const already = await sentToday(admin, (leads ?? [])[0]?.tenant_slug ?? "__none__");
  let budget = Math.max(0, cap - already);

  for (const lead of leads ?? []) {
    const name = lead.business_name ?? lead.source_url;

    if (budget <= 0) {
      skipped.push({
        id: lead.id,
        business: name,
        reason: `today's limit of ${cap} is used up — the rest keep their place in the queue`,
      });
      continue;
    }

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

    const scrape = scrapeFor.get(lead.id) ?? null;
    const facts = (scrape?.facts ?? {}) as Record<string, unknown>;
    // Cold outreach is signed by whoever is actually sending it — the preview
    // link, the sign-off and the sending address all belong to the tenant that
    // owns the lead, not to whichever brand happens to be the default.
    const tenant = tenantBySlug(lead.tenant_slug);
    const previewUrl = `${tenant.portalBaseUrl}/s/${lead.slug}?view=preview`;
    const ctx: OutreachContext = {
      businessName: lead.business_name ?? "your business",
      previewUrl,
      city: (facts.town as string) ?? null,
      headlineFinding: headlineFindingFor(lead, scrape),
      senderName: tenant.brand.senderName,
      senderCompany: tenant.brand.name,
    };

    // A reviewed personal draft beats the sequence copy, but only for the
    // first touch: it was written as an opener and reads as a non-sequitur
    // sent as a follow-up. Stages 2 and 3 stay on the sequence, which is
    // what they are for.
    const draft = stage.stage === 1 ? ((lead.outreach_draft ?? null) as OutreachDraft | null) : null;
    const subject = draft?.subject ?? stage.subject(ctx);
    const text = draft
      ? [draft.body, "", previewUrl].join("\n") + signOff(ctx, track)
      : stage.body(ctx);

    // sendEmail reports failure by returning false rather than throwing, so
    // both paths have to be handled or a bounced send would still advance
    // the stage and the prospect would never receive that touch.
    // One click, and it is over. The header pair is what makes Gmail and Yahoo
    // render their own unsubscribe control instead of leaving the spam button
    // as the only obvious exit.
    const optOut = unsubscribeUrl(tenant.portalBaseUrl, lead.id);

    let delivered = false;
    try {
      delivered = await sendEmail({
        to: sanitizeEmail(lead.email) || lead.email,
        from: tenant.brand.fromEmail,
        fromName: tenant.brand.senderName,
        subject,
        html: asHtml(text),
        text,
        headers: {
          "List-Unsubscribe": `<${optOut}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
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
      .update({
        outreach_stage: stage.stage,
        outreach_last_sent_at: new Date().toISOString(),
        // Cleared once used, so a draft written for this send is never
        // silently re-sent to someone who already received it.
        ...(draft ? { outreach_draft: null } : {}),
      })
      .eq("id", lead.id);

    sent.push(lead.id);
    budget -= 1;
  }

  return NextResponse.json({
    track,
    stage: stage.stage,
    label: stage.label,
    sent: sent.length,
    skipped,
    cap,
    remainingToday: Math.max(0, budget),
  });
}
