import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isAdminSession } from "@/lib/is-admin-session";

// Admin-only. Pings every external service the pipeline depends on and
// reports what actually works.
//
// Presence of an environment variable proves nothing — the Brevo key was
// set the whole time and returned "Key not found" on every send, which only
// showed up as a line in a runtime log nobody was reading. Each check here
// makes a real call.
export const maxDuration = 60;

type Check = { ok: boolean; detail: string };

const missing = (name: string): Check => ({ ok: false, detail: `${name} is not set` });

async function checkStripe(): Promise<Check & { prices?: Record<string, boolean> }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return missing("STRIPE_SECRET_KEY");

  try {
    const stripe = new Stripe(key);
    // Balance is the cheapest call that proves the key is live and usable.
    const balance = await stripe.balance.retrieve();

    // A valid key with unusable price IDs still fails at checkout, so the
    // configured prices are verified individually.
    const priceIds = {
      STRIPE_BUILD_PRICE_ID: process.env.STRIPE_BUILD_PRICE_ID,
      STRIPE_HOSTING_PRICE_ID: process.env.STRIPE_HOSTING_PRICE_ID,
      STRIPE_HOSTING_SUPPORT_PRICE_ID: process.env.STRIPE_HOSTING_SUPPORT_PRICE_ID,
      STRIPE_LEAD_ENGINE_PRICE_ID: process.env.STRIPE_LEAD_ENGINE_PRICE_ID,
    };

    const prices: Record<string, boolean> = {};
    for (const [name, id] of Object.entries(priceIds)) {
      if (!id) {
        prices[name] = false;
        continue;
      }
      prices[name] = await stripe.prices
        .retrieve(id)
        .then((p) => p.active)
        .catch(() => false);
    }

    return {
      ok: true,
      detail: `Key valid, ${balance.livemode ? "LIVE" : "TEST"} mode`,
      prices,
    };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Stripe rejected the key" };
  }
}

async function checkBrevo(): Promise<Check> {
  const key = process.env.BREVO_API_KEY;
  if (!key) return missing("BREVO_API_KEY");

  try {
    const res = await fetch("https://api.brevo.com/v3/account", { headers: { "api-key": key } });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, detail: `Brevo rejected the key (${res.status}): ${body.slice(0, 160)}` };
    }
    const data = await res.json();
    const sender = process.env.BREVO_SENDER_EMAIL;
    return {
      ok: !!sender,
      detail: sender
        ? `Connected as ${data.email ?? "account"}, sending from ${sender}`
        : `Key valid (${data.email ?? "account"}) but BREVO_SENDER_EMAIL is not set, so sends will fail`,
    };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Could not reach Brevo" };
  }
}

async function checkFirecrawl(): Promise<Check> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return missing("FIRECRAWL_API_KEY");

  try {
    // Mapping a tiny site is the cheapest call that proves the key works.
    const res = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ url: "https://example.com", limit: 1 }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, detail: `Firecrawl rejected the key (${res.status}): ${body.slice(0, 160)}` };
    }
    return { ok: true, detail: "Key valid, map endpoint responding" };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Could not reach Firecrawl" };
  }
}

async function checkPlaces(): Promise<Check> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return missing("GOOGLE_PLACES_API_KEY");

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=starbucks&inputtype=textquery&fields=place_id&key=${key}`
    );
    const data = await res.json();
    // Places answers 200 even on failure, with the real reason in `status`.
    if (data.status === "OK" || data.status === "ZERO_RESULTS") {
      return { ok: true, detail: "Key valid" };
    }
    return { ok: false, detail: `${data.status}: ${data.error_message ?? "no detail"}` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Could not reach Places" };
  }
}

async function checkGemini(): Promise<Check> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return missing("GEMINI_API_KEY");

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, detail: `Gemini rejected the key (${res.status}): ${body.slice(0, 160)}` };
    }
    return { ok: true, detail: "Key valid" };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Could not reach Gemini" };
  }
}

export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const [stripe, brevo, firecrawl, places, gemini] = await Promise.all([
    checkStripe(),
    checkBrevo(),
    checkFirecrawl(),
    checkPlaces(),
    checkGemini(),
  ]);

  const checks = { stripe, brevo, firecrawl, places, gemini };

  return NextResponse.json({
    allOk: Object.values(checks).every((c) => c.ok),
    checks,
    // Inngest cannot be pinged from here: it calls US. A missing event key
    // means events are dropped silently, which is the failure mode most
    // likely to look like "the button did nothing".
    inngest: {
      eventKeySet: !!process.env.INNGEST_EVENT_KEY,
      signingKeySet: !!process.env.INNGEST_SIGNING_KEY,
      note: "Without both, background jobs never run and every action appears to do nothing.",
    },
    stripeWebhookSecretSet: !!process.env.STRIPE_WEBHOOK_SECRET,
  });
}
