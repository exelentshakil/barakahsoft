import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

// $999 one-time build.
export const BUILD_PRICE_ID = process.env.STRIPE_BUILD_PRICE_ID || "";
// $49/mo hosting-only.
export const HOSTING_PRICE_ID = process.env.STRIPE_HOSTING_PRICE_ID || "";
// $99/mo hosting + support (recommended bundle).
export const HOSTING_SUPPORT_PRICE_ID = process.env.STRIPE_HOSTING_SUPPORT_PRICE_ID || "";
// $500/week managed lead-engine service.
export const LEAD_ENGINE_PRICE_ID = process.env.STRIPE_LEAD_ENGINE_PRICE_ID || "";
