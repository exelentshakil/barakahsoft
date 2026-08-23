import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { listSlots, uploadToSlot, regenerateSlot } from "@/lib/media/slots";
import { retouchSlotPhoto } from "@/lib/media/retouch-photo";
import { DesignDnaSchema } from "@/lib/design-dna";
import type { CopyPlan } from "@/lib/generate-copy-plan";

export const maxDuration = 120;

async function serviceNames(leadId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("artifacts")
    .select("copy_plan")
    .eq("lead_id", leadId)
    .single<{ copy_plan: CopyPlan | null }>();
  return (data?.copy_plan?.services ?? []).map((s) => s.name);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const slots = await listSlots(leadId, await serviceNames(leadId));
  return NextResponse.json({
    slots,
    // The count the operator actually cares about before sending: how many
    // positions are still holding a placeholder rather than a real photo.
    placeholders: slots.filter((s) => s.origin === "generated").length,
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";

  // A real photograph the operator supplies always wins over anything
  // generated, so this path takes precedence and does no AI work at all.
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const slotKey = String(form.get("slot") ?? "");
    const caption = String(form.get("caption") ?? "");
    const file = form.get("file");

    if (!slotKey || !(file instanceof File)) {
      return NextResponse.json({ error: "Provide a slot and an image file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToSlot(leadId, slotKey, buffer, caption);
    if (!result) return NextResponse.json({ error: "That slot does not exist, or the image could not be read" }, { status: 400 });

    return NextResponse.json({ ok: true, ...result });
  }

  const body = await req.json().catch(() => ({}));
  const slotKey = typeof body.slot === "string" ? body.slot : "";

  if (!slotKey) {
    return NextResponse.json({ error: "Provide a slot key" }, { status: 400 });
  }

  // 1. Direct retouch of the real existing photo in the slot (preserves original composition & crew)
  if (body.retouch === true) {
    const result = await retouchSlotPhoto(leadId, slotKey);
    if (!result) return NextResponse.json({ error: "Photo retouching failed" }, { status: 500 });
    return NextResponse.json({ ok: true, ...result });
  }

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  if (!subject) {
    return NextResponse.json({ error: "Describe the image you want for this slot" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: artifact } = await admin
    .from("artifacts")
    .select("inspiration_branding")
    .eq("lead_id", leadId)
    .single<{ inspiration_branding: unknown }>();

  const parsed = artifact?.inspiration_branding ? DesignDnaSchema.safeParse(artifact.inspiration_branding) : null;
  const mood = parsed?.success ? parsed.data.mood : "bold-utility";

  const result = await regenerateSlot(leadId, slotKey, subject, mood);
  if (!result) return NextResponse.json({ error: "Image generation failed" }, { status: 500 });

  return NextResponse.json({ ok: true, ...result });
}
