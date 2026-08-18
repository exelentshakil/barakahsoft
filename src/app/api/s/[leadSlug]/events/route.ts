import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request, { params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const body = await req.json().catch(() => null);
  if (body?.event !== "phone_click") return NextResponse.json({ error: "Unsupported event" }, { status: 400 });
  const admin = createAdminClient();
  const { data: lead } = await admin.from("leads").select("id").eq("slug", leadSlug).single();
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { error } = await admin.from("lead_inquiries").insert({ lead_id: lead.id, channel: "phone_click", source: "website", metadata: { path: typeof body.path === "string" ? body.path.slice(0, 300) : null } });
  if (error) return NextResponse.json({ error: "Unable to record event" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
