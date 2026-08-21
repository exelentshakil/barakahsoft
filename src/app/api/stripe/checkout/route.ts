import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, BUILD_PRICE_ID, HOSTING_PRICE_ID, HOSTING_SUPPORT_PRICE_ID, LEAD_ENGINE_PRICE_ID } from "@/lib/stripe";
import { createPortalToken } from "@/lib/portal-token";

// One Checkout Session covers both the $999 one-time build and the $49/$99
// monthly hosting tier — mode "subscription" with a one-time price line item
// added alongside the recurring price, so it's a single invoice.paid event
// (see src/app/api/stripe/webhook/route.ts) rather than two separate flows.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const lead_id = body.lead_id ?? body.leadId;
  const tier = body.tier === "complete_website" ? "website" : body.tier;
  if (!lead_id) return NextResponse.json({ error: "lead_id is required" }, { status: 400 });
  if (tier !== "website" && tier !== "hosting" && tier !== "hosting_support" && tier !== "lead_engine") {
    return NextResponse.json({ error: "tier must be 'website', 'hosting', 'hosting_support', or 'lead_engine'" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: lead } = await admin.from("leads").select("id, slug, business_name, email").eq("id", lead_id).single();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const priceId = tier === "lead_engine" ? LEAD_ENGINE_PRICE_ID : tier === "hosting_support" ? HOSTING_SUPPORT_PRICE_ID : HOSTING_PRICE_ID;
  if (!priceId || (tier !== "lead_engine" && tier !== "website" && !BUILD_PRICE_ID) || (tier === "website" && !BUILD_PRICE_ID)) {
    return NextResponse.json({ error: "Stripe price IDs are not configured" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const stripe = getStripe();
  if (tier === "website") {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: lead.email ?? undefined,
      line_items: [{ price: BUILD_PRICE_ID, quantity: 1 }],
      metadata: { lead_id: lead.id, tier },
      success_url: `${siteUrl}/s/${lead.slug}?auth=${createPortalToken(lead.id)}&paid=1`,
      cancel_url: `${siteUrl}/s/${lead.slug}?auth=${createPortalToken(lead.id)}&paid=0`,
    });
    return NextResponse.json({ url: session.url });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: lead.email ?? undefined,
    line_items: tier === "lead_engine"
      ? [{ price: priceId, quantity: 1 }]
      : [{ price: priceId, quantity: 1 }, { price: BUILD_PRICE_ID, quantity: 1 }],
    metadata: { lead_id: lead.id, tier },
    subscription_data: { metadata: { lead_id: lead.id, tier } },
    success_url: `${siteUrl}/admin/leads/${lead.id}?paid=1`,
    cancel_url: `${siteUrl}/admin/leads/${lead.id}?paid=0`,
  });

  return NextResponse.json({ url: session.url });
}
