import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkDomainAvailability, getDomainPrice } from "@/lib/vercel";
import { inngest } from "@/inngest/client";

// GET ?domain=example.com -- read-only availability+price check, no
// purchase, safe to call freely while an operator is exploring options
// with a client on a sales call.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await params; // route shape only -- this check isn't lead-specific yet
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const domain = new URL(req.url).searchParams.get("domain")?.trim().toLowerCase();
  if (!domain) return NextResponse.json({ error: "domain query param is required" }, { status: 400 });

  const [available, price] = await Promise.all([checkDomainAvailability(domain), getDomainPrice(domain)]);
  if (available === null) return NextResponse.json({ error: "Domain automation isn't configured (VERCEL_API_TOKEN)" }, { status: 500 });

  return NextResponse.json({ domain, available, price });
}

// PATCH { domain } -- "bring your own domain": the client already owns
// one, the operator just enters it. If the lead already paid (go-live.ts
// already ran and skipped because custom_domain was empty at the time),
// re-fire the same event so it actually attaches the domain now instead
// of leaving the lead stuck live-forever-pending.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const domain = typeof body?.domain === "string" ? body.domain.trim().toLowerCase() : null;
  if (!domain) return NextResponse.json({ error: "domain is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: lead, error } = await admin
    .from("leads")
    .update({ custom_domain: domain, domain_source: "byod" })
    .eq("id", id)
    .select("id, paid_at")
    .single();
  if (error || !lead) return NextResponse.json({ error: error?.message ?? "Could not save domain" }, { status: 500 });

  if (lead.paid_at) {
    await inngest.send({ name: "stripe/invoice.paid", data: { lead_id: id } }).catch((err) => console.error("[domain] re-trigger go-live failed", err));
  }

  return NextResponse.json({ ok: true });
}
