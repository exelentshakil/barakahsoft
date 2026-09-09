import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertLeadInTenant } from "@/lib/tenant-scope";

// Marks the manual call step done from HowToCloseTab — the only
// close_plan_steps write that isn't automated by deliver-send.ts's
// step.sleep sequence.
export async function PATCH(req: Request, { params }: { params: Promise<{ stepId: string }> }) {
  const { stepId } = await params;

  const body = await req.json().catch(() => null);
  if (body?.status !== "done" && body?.status !== "skipped") {
    return NextResponse.json({ error: "status must be 'done' or 'skipped'" }, { status: 400 });
  }

  // This route is addressed by STEP id, not lead id, so ownership has to be
  // resolved through to the lead before the write. A handler that takes any
  // other table's primary key is the shape that slips past tenant scoping:
  // there is no lead in the path to check, so it has to be looked up.
  const admin = createAdminClient();
  const { data: step } = await admin
    .from("close_plan_steps")
    .select("lead_id")
    .eq("id", stepId)
    .maybeSingle<{ lead_id: string }>();
  if (!step || !(await assertLeadInTenant(step.lead_id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await admin.from("close_plan_steps").update({ status: body.status, sent_at: new Date().toISOString() }).eq("id", stepId);

  return NextResponse.json({ status: body.status });
}
