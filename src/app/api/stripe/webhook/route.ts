import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";

export const runtime = "nodejs";

// The one lock the entire commercial model depends on (plan §6/§7): a
// successful checkout marks the lead paid and hands off to Inngest —
// rebuild-inner-pages.ts and go-live.ts both subscribe to "stripe/invoice.paid"
// and run the actual unlock work async, so this handler stays fast.
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await req.text();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const leadId = session.metadata?.lead_id;
      const tier = session.metadata?.tier as "hosting" | "hosting_support" | undefined;
      if (leadId && tier) {
        await admin.from("leads").update({ paid_at: new Date().toISOString() }).eq("id", leadId);
        await admin.from("hosting_subscriptions").upsert(
          {
            lead_id: leadId,
            stripe_subscription_id: session.subscription as string,
            tier,
            status: "active",
          },
          { onConflict: "lead_id" }
        );
        await inngest.send({ name: "stripe/invoice.paid", data: { lead_id: leadId } });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const leadId = subscription.metadata?.lead_id;
      if (leadId) {
        await admin
          .from("hosting_subscriptions")
          .update({
            status: subscription.status,
            current_period_end: new Date(subscription.items.data[0]?.current_period_end * 1000).toISOString(),
          })
          .eq("lead_id", leadId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const leadId = subscription.metadata?.lead_id;
      if (leadId) {
        await admin.from("hosting_subscriptions").update({ status: "canceled" }).eq("lead_id", leadId);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
