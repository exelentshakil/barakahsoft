import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAccount } from "@/lib/get-or-create-account";
import { inngest } from "@/inngest/client";

// The permanent human QA gate (PRD §7 stage 5) — one-tap approve/reject
// from QAReviewPanel. Approve flips the lead to qa_approved and fires
// "lead/qa.approved", which deliver-send.ts picks up to send the preview
// link and schedule the closing sequence.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (body?.decision !== "approved" && body?.decision !== "rejected") {
    return NextResponse.json({ error: "decision must be 'approved' or 'rejected'" }, { status: 400 });
  }

  const accountId = await getOrCreateAccount(user.id, user.email ?? "");

  const admin = createAdminClient();
  const { data: artifact } = await admin.from("artifacts").select("qa_notes").eq("lead_id", leadId).single();
  const rejectionNote = body.decision === "rejected" && body.reason ? `[Reviewer rejection] ${body.reason}` : null;
  const combinedNotes = [artifact?.qa_notes, rejectionNote].filter(Boolean).join("\n") || null;

  await admin
    .from("artifacts")
    .update({ qa_status: body.decision, qa_notes: combinedNotes, last_edited_at: new Date().toISOString(), last_edited_by: accountId })
    .eq("lead_id", leadId);

  if (body.decision === "approved") {
    await admin.from("leads").update({ status: "qa_approved" }).eq("id", leadId);
    await inngest.send({ name: "lead/qa.approved", data: { lead_id: leadId } });
  }

  return NextResponse.json({ decision: body.decision });
}
