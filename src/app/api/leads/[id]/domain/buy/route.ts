import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buyDomain, getDomainPrice, type DomainRegistrantContact } from "@/lib/vercel";
import { inngest } from "@/inngest/client";

// POST { domain, years, contact } -- real money: charges the payment
// method on file for VERCEL_TEAM_ID. Deliberately re-checks the live price
// server-side rather than trusting whatever price the client last saw --
// the operator's UI must show that exact number and get an explicit
// confirm click before this route is ever called.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const domain = typeof body?.domain === "string" ? body.domain.trim().toLowerCase() : null;
  const years = typeof body?.years === "number" && body.years > 0 ? body.years : 1;
  const contact = body?.contact as DomainRegistrantContact | undefined;

  if (!domain) return NextResponse.json({ error: "domain is required" }, { status: 400 });
  const requiredContactFields: (keyof DomainRegistrantContact)[] = [
    "firstName", "lastName", "email", "phone", "address1", "city", "state", "zip", "country",
  ];
  if (!contact || requiredContactFields.some((f) => !contact[f])) {
    return NextResponse.json({ error: "Full registrant contact info is required" }, { status: 400 });
  }

  const price = await getDomainPrice(domain, years);
  if (!price) return NextResponse.json({ error: "Could not confirm current price — try again" }, { status: 500 });

  const purchase = await buyDomain(domain, { years, expectedPrice: price.purchasePrice, contact });
  if (!purchase.ok) return NextResponse.json({ error: purchase.error ?? "Purchase failed" }, { status: 500 });

  const admin = createAdminClient();
  const { data: lead, error } = await admin
    .from("leads")
    .update({ custom_domain: domain, domain_source: "purchased" })
    .eq("id", id)
    .select("id, paid_at")
    .single();
  if (error || !lead) {
    // The domain purchase itself already succeeded (real money spent) --
    // failing to save it against the lead is a data-consistency problem
    // to report loudly, not something to pretend didn't happen.
    console.error(`[domain/buy] purchased ${domain} but failed to save against lead ${id}`, error);
    return NextResponse.json({ error: `Domain purchased but failed to save — attach ${domain} to lead ${id} manually` }, { status: 500 });
  }

  if (lead.paid_at) {
    await inngest.send({ name: "stripe/invoice.paid", data: { lead_id: id } }).catch((err) => console.error("[domain/buy] re-trigger go-live failed", err));
  }

  return NextResponse.json({ ok: true, price: price.purchasePrice });
}
