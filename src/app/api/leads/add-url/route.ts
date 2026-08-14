import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

// Admin's manual "Add URL" path — pipeline validation runs (case 0) and any
// lead sourced outside the ad funnel go through here instead of the public
// /api/intake, since there's no contact-details/TCPA step for an operator
// seeding a lead directly.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.source_url) return NextResponse.json({ error: "source_url is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: lead, error } = await admin
    .from("leads")
    .insert({ source_url: body.source_url, business_name: body.business_name ?? null, slug: slugify(body.source_url), status: "new" })
    .select()
    .single();

  if (error || !lead) return NextResponse.json({ error: error?.message ?? "Could not create lead" }, { status: 500 });

  // Best-effort — a flaky Inngest connection should never mask that the lead
  // itself was saved successfully (mirrors /api/intake).
  try {
    await inngest.send({ name: "lead/intake.submitted", data: { lead_id: lead.id } });
  } catch (err) {
    console.error("[add-url] inngest.send failed", err);
  }

  return NextResponse.json({ lead_id: lead.id });
}
