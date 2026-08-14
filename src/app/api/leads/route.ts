import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Bulk delete for the Leads list's "select + delete" flow — same gating and
// cascade-on-delete behavior as the single-lead DELETE in /api/leads/[id].
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown): id is string => typeof id === "string") : [];
  if (ids.length === 0) return NextResponse.json({ error: "ids is required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("leads").delete().in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: ids.length });
}
