import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isVisualQaWorker } from "@/lib/visual-qa-worker-auth";
import type { GenerationCandidate } from "@/lib/visual-qa";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isVisualQaWorker(request.headers)) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const workerId = request.headers.get("x-visual-qa-worker")?.trim() || "local-worker";
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_visual_qa_candidate", { p_worker_id: workerId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const candidate = (Array.isArray(data) ? data[0] : data) as GenerationCandidate | undefined;
  if (!candidate) return new NextResponse(null, { status: 204 });

  const configuredOrigin = process.env.VISUAL_QA_PREVIEW_ORIGIN?.trim();
  const origin = configuredOrigin ? new URL(configuredOrigin).origin : new URL(request.url).origin;

  return NextResponse.json({
    candidate: {
      id: candidate.id,
      leadId: candidate.lead_id,
      attempt: candidate.attempt,
      context: candidate.context,
      previewUrl: `${origin}/visual-qa/${candidate.id}`,
    },
  });
}
