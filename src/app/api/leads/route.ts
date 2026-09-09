import { requireOperator } from "@/lib/tenant-scope";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanupLeadStorage } from "@/lib/supabase/cleanup-storage";

// Bulk delete for the Leads list's "select + delete" flow — same gating and
// cascade-on-delete behavior as the single-lead DELETE in /api/leads/[id].
export async function DELETE(req: Request) {
  // Being signed in is not being an operator: any Supabase user can
  // complete a magic link. This route then uses the service-role client.
  if (!(await requireOperator())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown): id is string => typeof id === "string") : [];
  if (ids.length === 0) return NextResponse.json({ error: "ids is required" }, { status: 400 });

  const admin = createAdminClient();

  // Clean up all storage files in lead-media and visual-qa for these leads
  await cleanupLeadStorage(admin, ids);

  const { error } = await admin.from("leads").delete().in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: ids.length });
}
