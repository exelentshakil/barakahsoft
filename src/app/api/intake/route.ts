import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInstantLeadAlert, sendInstantLeadConfirmationEmail } from "@/lib/notifications";
import { fireMetaCapiEvent } from "@/lib/meta-pixel-server";
import { isPersonaSlug } from "@/lib/personas";
import { isLeadProblem } from "@/lib/lead-problems";
import { inngest } from "@/inngest/client";
import { generateUniqueDomainSlug } from "@/lib/domain-slug";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.source_url || !body?.name || !body?.email || !body?.tcpa_consent) {
    return NextResponse.json({ error: "source_url, name, email, and consent are required" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const slug = await generateUniqueDomainSlug(admin, body.source_url);

    const { data: lead, error } = await admin
      .from("leads")
      .insert({
        source_url: body.source_url,
        business_name: null,
        contact_name: String(body.name).trim().slice(0, 200),
        slug,
        email: body.email,
        phone: typeof body.phone === "string" && body.phone.trim() ? body.phone.trim().slice(0, 100) : null,
        source: body.source === "redesign" ? "redesign" : "home",
        help_needed: Array.isArray(body.help_needed) ? body.help_needed.filter(isLeadProblem) : [],
        anything_else: typeof body.anything_else === "string" ? body.anything_else.trim().slice(0, 2000) || null : null,
        pain_points: Array.isArray(body.help_needed) ? body.help_needed.filter(isLeadProblem) : [],
        tcpa_consent: !!body.tcpa_consent,
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
      // Deliberately NOT starting the scrape. Intake is public, so anything
      // it triggers is something a spam submission can spend: Firecrawl
      // credits, Places calls, PageSpeed runs. Analysis begins when an
      // operator looks at the lead and chooses to start it.
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

    return NextResponse.json({ lead_id: lead.id, slug: lead.slug });
  } catch (err) {
    console.error("[intake] unhandled error", err);
    return NextResponse.json({ error: "Something went wrong — please try again" }, { status: 500 });
  }
}
