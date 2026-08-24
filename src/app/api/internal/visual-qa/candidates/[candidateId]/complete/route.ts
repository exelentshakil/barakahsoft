import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VisualQaReportSchema, visualReportPasses, type GenerationCandidate } from "@/lib/visual-qa";
import { isVisualQaWorker } from "@/lib/visual-qa-worker-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ candidateId: string }> }) {
  if (!isVisualQaWorker(request.headers)) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const { candidateId } = await params;
  const reportJson = await request.json().catch(() => null);
  const report = VisualQaReportSchema.safeParse(reportJson);
  if (!report.success) {
    return NextResponse.json({ error: "Invalid visual QA report", issues: report.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: candidate } = await admin
    .from("generation_candidates")
    .select("*")
    .eq("id", candidateId)
    .maybeSingle<GenerationCandidate>();
  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  const workerId = request.headers.get("x-visual-qa-worker")?.trim() || "local-worker";
  if (candidate.worker_id !== workerId || report.data.workerId !== workerId) {
    return NextResponse.json({ error: "This worker does not hold the candidate lease" }, { status: 409 });
  }

  if (["passed", "failed", "error"].includes(candidate.visual_status)) {
    return NextResponse.json({ ok: true, status: candidate.visual_status, replayed: true });
  }
  if (candidate.visual_status !== "running") {
    return NextResponse.json({ error: `Candidate is ${candidate.visual_status}, not running` }, { status: 409 });
  }

  const status = report.data.error ? "error" : visualReportPasses(report.data) ? "passed" : "failed";
  const { data: updated, error: updateError } = await admin
    .from("generation_candidates")
    .update({
      visual_status: status,
      visual_report: report.data,
      completed_at: new Date().toISOString(),
    })
    .eq("id", candidate.id)
    .eq("visual_status", "running")
    .eq("worker_id", workerId)
    .select("id")
    .maybeSingle();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "Candidate lease changed before completion" }, { status: 409 });

  return NextResponse.json({ ok: true, status });
}
