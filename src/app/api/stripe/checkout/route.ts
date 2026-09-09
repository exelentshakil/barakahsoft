import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, LEAD_ENGINE_PRICE_ID } from "@/lib/stripe";
import { createPortalToken } from "@/lib/portal-token";
import { buildOfferOptions, type OfferOption } from "@/lib/audit/lead-value";
import { tenantBySlug } from "@/tenants";

// Checkout, priced from the offer the operator actually set for this lead.
//
// This used to bill two fixed Stripe prices from the environment — a $999
// build and $49/month hosting — regardless of what the pricing panel said.
// So an operator could set "$0 setup, $79/month", the portal would show
// that, the client would click through, and Stripe would ask them for $999
// plus $49/month. The number on the proposal and the number on the card
// were different, which is the worst possible place for a mismatch.
//
// Prices are now built inline from artifacts.extracted_assets.pricing, the
// same record the portal reads, so there is exactly one source for what
// this client is being asked to pay.

interface LeadPricing {
  model?: string;
  setupPrice?: number;
  monthlyPrice?: number;
  standardValue?: number;
}

// The defaults the pricing route and the portal both fall back to. Repeated
// here deliberately rather than imported from a component: this is the
// number that gets charged, and it should not change because a UI file was
// refactored.
const DEFAULT_SETUP = 779;
const DEFAULT_MONTHLY = 99;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const lead_id = body.lead_id ?? body.leadId;
  if (!lead_id) return NextResponse.json({ error: "lead_id is required" }, { status: 400 });

  const admin = createAdminClient();
  const [{ data: lead }, { data: artifact }, { data: scrape }] = await Promise.all([
    admin.from("leads").select("id, slug, business_name, email, tenant_slug").eq("id", lead_id).single(),
    admin.from("artifacts").select("extracted_assets, funnel_pages").eq("lead_id", lead_id).maybeSingle(),
    admin.from("scrape_results").select("facts").eq("lead_id", lead_id).maybeSingle(),
  ]);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Only the tenant that OWNS the platform Stripe account may charge through
  // it: the card statement carries its descriptor, the funds land in its
  // balance, and its entity is the one named at the point of payment. A
  // partner's proposal collects an enquiry instead — see
  // /api/s/[leadSlug]/purchase-enquiry and src/tenants/types.ts.
  const tenant = tenantBySlug(lead.tenant_slug);
  if (tenant.commerce.mode !== "stripe") {
    return NextResponse.json(
      { error: "This proposal does not take payment here.", mode: tenant.commerce.mode },
      { status: 409 }
    );
  }

  const stripe = getStripe();
  const portalBaseUrl = tenant.portalBaseUrl;
  const businessName = lead.business_name || lead.slug;

  // The lead-engine tier is our own product on a fixed published price, not
  // a per-client offer, so it keeps its configured price ID.
  if (body.tier === "lead_engine") {
    if (!LEAD_ENGINE_PRICE_ID) {
      return NextResponse.json({ error: "Lead engine price ID is not configured" }, { status: 500 });
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: lead.email ?? undefined,
      line_items: [{ price: LEAD_ENGINE_PRICE_ID, quantity: 1 }],
      metadata: { lead_id: lead.id, tier: "lead_engine" },
      subscription_data: { metadata: { lead_id: lead.id, tier: "lead_engine" } },
      success_url: `${portalBaseUrl}/admin/leads/${lead.id}?paid=1`,
      cancel_url: `${portalBaseUrl}/admin/leads/${lead.id}?paid=0`,
    });
    return NextResponse.json({ url: session.url });
  }

  const pricing = ((artifact?.extracted_assets as Record<string, unknown> | null)?.pricing ?? {}) as LeadPricing;
  const extracted = (artifact?.extracted_assets ?? {}) as Record<string, unknown>;
  const savedOffers = Array.isArray(extracted.pricing && (extracted.pricing as Record<string, unknown>).offerOptions)
    ? (extracted.pricing as Record<string, unknown>).offerOptions as OfferOption[]
    : null;
  const facts = (scrape?.facts ?? {}) as Record<string, unknown>;
  const serviceCount = Array.isArray(artifact?.funnel_pages)
    ? artifact.funnel_pages.filter((page: { kind?: string }) => page.kind === "service").length
    : Array.isArray(facts.derived_services) ? facts.derived_services.length : 0;
  const generatedOffers = savedOffers ?? buildOfferOptions(serviceCount + 1, lead.business_name || "your business");
  const requestedOffer = typeof body.offer_id === "string"
    ? generatedOffers.find((offer) => offer.id === body.offer_id)
    : null;
  const setup = requestedOffer?.setupPrice ?? (typeof pricing.setupPrice === "number" ? pricing.setupPrice : DEFAULT_SETUP);
  const monthly = requestedOffer?.monthlyPrice ?? (typeof pricing.monthlyPrice === "number" ? pricing.monthlyPrice : DEFAULT_MONTHLY);

  if (setup <= 0 && monthly <= 0) {
    return NextResponse.json(
      { error: "This lead has no price set. Set a setup fee or a monthly price before asking for payment." },
      { status: 409 }
    );
  }

  // Stripe takes the smallest currency unit, and a fractional price here
  // would silently round — so it is rounded explicitly.
  const cents = (amount: number) => Math.round(amount * 100);

  const buildLine = {
    price_data: {
      currency: "usd",
      product_data: {
        name: `Website build — ${businessName}`,
        description: "One-time build of your new website, live on your own domain.",
      },
      unit_amount: cents(setup),
    },
    quantity: 1,
  };

  const monthlyLine = {
    price_data: {
      currency: "usd",
      product_data: {
        name: `Hosting & support — ${businessName}`,
        description: "Hosting, updates and support for your website.",
      },
      unit_amount: cents(monthly),
      recurring: { interval: "month" as const },
    },
    quantity: 1,
  };

  const metadata = {
    lead_id: lead.id,
    tier: monthly > 0 ? "hosting" : "website",
    offer_id: requestedOffer?.id ?? "custom",
    setup_price: String(setup),
    monthly_price: String(monthly),
  };

  // A monthly figure makes this a subscription; a one-off setup fee rides
  // alongside it as a non-recurring line on the same first invoice.
  if (monthly > 0) {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: lead.email ?? undefined,
      line_items: setup > 0 ? [monthlyLine, buildLine] : [monthlyLine],
      metadata,
      subscription_data: { metadata },
      success_url: `${portalBaseUrl}/s/${lead.slug}?auth=${createPortalToken(lead.id)}&paid=1`,
      cancel_url: `${portalBaseUrl}/s/${lead.slug}?auth=${createPortalToken(lead.id)}&paid=0`,
    });
    return NextResponse.json({ url: session.url });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: lead.email ?? undefined,
    line_items: [buildLine],
    metadata,
    success_url: `${portalBaseUrl}/s/${lead.slug}?auth=${createPortalToken(lead.id)}&paid=1`,
    cancel_url: `${portalBaseUrl}/s/${lead.slug}?auth=${createPortalToken(lead.id)}&paid=0`,
  });

  return NextResponse.json({ url: session.url });
}
