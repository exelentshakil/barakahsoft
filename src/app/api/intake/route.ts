import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInstantLeadAlert, sendInstantLeadConfirmationEmail } from "@/lib/notifications";
import { fireMetaCapiEvent } from "@/lib/meta-pixel-server";
import { isPersonaSlug } from "@/lib/personas";
import { isLeadProblem } from "@/lib/lead-problems";
import { inngest } from "@/inngest/client";

function slugify(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const base = host.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    return `${base}-${Math.random().toString(36).slice(2, 6)}`;
  } catch {
    return `lead-${Math.random().toString(36).slice(2, 8)}`;
  }
}

// The landing page's 2-step intake lands here. Two things fire before this
// returns: the lead row, and sendInstantLeadAlert — synchronously, not via
// Inngest, so the operator's call happens within minutes, decoupled from
// the redesign build. Phase 1 deliberately stops after persistence and
// alerting; the research event is also best-effort so a provider outage never
// loses a submitted lead.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.source_url || !body?.name || !body?.email || !body?.tcpa_consent) {
    return NextResponse.json({ error: "source_url, name, email, and consent are required" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: lead, error } = await admin
      .from("leads")
      .insert({
        source_url: body.source_url,
        business_name: null,
        contact_name: String(body.name).trim().slice(0, 200),
        slug: slugify(body.source_url),
        email: body.email,
        phone: typeof body.phone === "string" && body.phone.trim() ? body.phone.trim().slice(0, 100) : null,
        source: body.source === "redesign" ? "redesign" : "home",
        help_needed: Array.isArray(body.help_needed) ? body.help_needed.filter(isLeadProblem) : [],
        anything_else: typeof body.anything_else === "string" ? body.anything_else.trim().slice(0, 2000) || null : null,
        pain_points: Array.isArray(body.help_needed) ? body.help_needed.filter(isLeadProblem) : [],
        tcpa_consent: !!body.tcpa_consent,
        // v4 Phase R2 — self-identified persona, silently dropped (not
        // rejected) if it's not a real recognized slug, since it's an
        // optional segmentation field, not a required one.
        persona: typeof body.persona === "string" && isPersonaSlug(body.persona) ? body.persona : null,
        status: "new",
      })
      .select()
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: error?.message ?? "Could not create lead" }, { status: 500 });
    }

    // Best-effort side effects — a flaky notification provider
    // should never mask that the lead itself was saved successfully.
    const results = await Promise.allSettled([
      sendInstantLeadAlert(lead),
      sendInstantLeadConfirmationEmail(lead),
      inngest.send({ name: "lead/intake.submitted", data: { lead_id: lead.id } }),
      fireMetaCapiEvent({
        eventName: "Lead",
        eventId: body.event_id ?? crypto.randomUUID(),
        email: body.email,
        phone: typeof body.phone === "string" ? body.phone : undefined,
        sourceUrl: body.source_url,
      }),
    ]);
    results.forEach((r) => {
      if (r.status === "rejected") console.error("[intake] side effect failed", r.reason);
    });

    return NextResponse.json({ lead_id: lead.id });
  } catch (err) {
    console.error("[intake] unhandled error", err);
    return NextResponse.json({ error: "Something went wrong — please try again" }, { status: 500 });
  }
}
