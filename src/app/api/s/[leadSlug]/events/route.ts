import { getTenant } from "@/lib/tenant";
// Node rather than edge: the CAPI half of this hits meta-pixel-server, which
// hashes with node:crypto. This is a fire-and-forget beacon, so the few extra
// milliseconds cost nothing that matters.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fireMetaCapiEvent } from "@/lib/meta-pixel-server";

export async function POST(req: Request, { params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const body = await req.json().catch(() => null);
  const event = body?.event;
  if (!event || typeof event !== "string") {
    return NextResponse.json({ error: "Unsupported event" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: lead } = await admin.from("leads").select("id").eq("slug", leadSlug).single();
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (event === "proposal_view") {
    await admin
      .from("leads")
      .update({ last_viewed_at: new Date().toISOString() })
      .eq("id", lead.id);

    // Server half of the pair. Carries the same event id as the browser's
    // ViewContent so Meta counts one event, and lands even where an ad
    // blocker ate the client-side pixel — which on a cold prospect's laptop
    // is a large share of them.
    if (typeof body.event_id === "string") {
      await fireMetaCapiEvent({
        eventName: "ViewContent",
        eventId: body.event_id,
        // Falls back to the tenant's own portal, not the platform's: Meta
        // matches events on source URL, so attributing a partner's pageview to
        // a domain their pixel has never seen makes it unmatchable.
        sourceUrl:
          req.headers.get("referer") || `${(await getTenant()).portalBaseUrl}/s/${leadSlug}`,
      }).catch(() => {});
    }
  }

  const city = req.headers.get("x-vercel-ip-city") || req.headers.get("x-real-ip-city");
  const country = req.headers.get("x-vercel-ip-country") || req.headers.get("x-real-ip-country");
  const region = req.headers.get("x-vercel-ip-country-region") || req.headers.get("x-real-ip-region");

  const location = [city, region, country].filter(Boolean).join(", ");

  const { error } = await admin.from("lead_inquiries").insert({
    lead_id: lead.id,
    channel: event,
    source: "proposal_portal",
    metadata: {
      path: typeof body.path === "string" ? body.path.slice(0, 300) : null,
      location: location || undefined
    },
  });

  if (error) return NextResponse.json({ error: "Unable to record event" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
