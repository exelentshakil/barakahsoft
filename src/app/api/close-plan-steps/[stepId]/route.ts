import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Marks the manual call step done from HowToCloseTab — the only
// close_plan_steps write that isn't automated by deliver-send.ts's
// step.sleep sequence.
export async function PATCH(req: Request, { params }: { params: Promise<{ stepId: string }> }) {
  const { stepId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (body?.status !== "done" && body?.status !== "skipped") {
    return NextResponse.json({ error: "status must be 'done' or 'skipped'" }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin.from("close_plan_steps").update({ status: body.status, sent_at: new Date().toISOString() }).eq("id", stepId);

  return NextResponse.json({ status: body.status });
}
