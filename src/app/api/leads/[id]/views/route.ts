import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin.from("lead_inquiries").delete().eq("lead_id", id).eq("channel", "proposal_view");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // also reset last_viewed_at
  await admin.from("leads").update({ last_viewed_at: null }).eq("id", id);
  
  return NextResponse.json({ ok: true });
}
