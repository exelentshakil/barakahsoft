import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
