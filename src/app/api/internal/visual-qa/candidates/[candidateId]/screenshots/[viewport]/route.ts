import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isVisualQaWorker } from "@/lib/visual-qa-worker-auth";
import type { GenerationCandidate } from "@/lib/visual-qa";

export const runtime = "nodejs";
export const maxDuration = 30;

const VIEWPORTS = ["desktop", "tablet", "mobile"] as const;
const MAX_SCREENSHOT_BYTES = 3 * 1024 * 1024;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ candidateId: string; viewport: string }> }
) {
  if (!isVisualQaWorker(request.headers)) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const { candidateId, viewport: rawViewport } = await params;
  if (!VIEWPORTS.includes(rawViewport as (typeof VIEWPORTS)[number])) {
    return NextResponse.json({ error: "Unknown viewport" }, { status: 400 });
  }
  const viewport = rawViewport as (typeof VIEWPORTS)[number];
  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (!contentType.startsWith("image/") || contentLength > MAX_SCREENSHOT_BYTES) {
    return NextResponse.json({ error: "Invalid screenshot" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: candidate } = await admin
    .from("generation_candidates")
    .select("*")
    .eq("id", candidateId)
    .maybeSingle<GenerationCandidate>();
  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  const workerId = request.headers.get("x-visual-qa-worker")?.trim() || "local-worker";
  if (candidate.visual_status !== "running" || candidate.worker_id !== workerId) {
    return NextResponse.json({ error: "This worker does not hold the candidate lease" }, { status: 409 });
  }

  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_SCREENSHOT_BYTES) {
    return NextResponse.json({ error: "Invalid screenshot size" }, { status: 400 });
  }

  const extension = contentType === "image/png" ? "png" : "jpg";
  const path = `${candidate.lead_id}/${candidate.id}/${viewport}.${extension}`;
  const { error: uploadError } = await admin.storage.from("visual-qa").upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const column = `${viewport}_screenshot_path`;
  const { data: updated, error: updateError } = await admin
    .from("generation_candidates")
    .update({ [column]: path })
    .eq("id", candidate.id)
    .eq("visual_status", "running")
    .eq("worker_id", workerId)
    .select("id")
    .maybeSingle();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "Candidate lease changed during upload" }, { status: 409 });

  return NextResponse.json({ ok: true, path });
}
