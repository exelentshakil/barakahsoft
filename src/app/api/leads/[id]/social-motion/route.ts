import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/is-admin-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import { SocialContentSchema } from "@/lib/social-content";

async function loadMockup(leadId: string) {
  const admin = createAdminClient();
  const { data: artifact } = await admin
    .from("artifacts")
    .select("extracted_assets")
    .eq("lead_id", leadId)
    .single();
  const extracted = (artifact?.extracted_assets ?? {}) as Record<string, unknown>;
  return (extracted.mockup ?? {}) as Record<string, unknown>;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const mockup = await loadMockup(id);
  return NextResponse.json({ motion: mockup.socialMotion ?? null });
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Gemini/Veo is not configured" }, { status: 422 });
  const mockup = await loadMockup(id);
  if (!SocialContentSchema.safeParse(mockup.socialContent).success) {
    return NextResponse.json({ error: "Generate the social content kit first" }, { status: 409 });
  }
  const current = (mockup.socialMotion ?? {}) as Record<string, unknown>;
  if (["starting", "generating"].includes(String(current.status))) {
    return NextResponse.json({ ok: true, started: false, motion: current });
  }
  await inngest.send({ name: "social-motion/generate.requested", data: { lead_id: id } });
  return NextResponse.json({ ok: true, started: true });
}
