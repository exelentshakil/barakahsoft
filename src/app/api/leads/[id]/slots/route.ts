import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { listSlots, uploadToSlot, applyMedia } from "@/lib/media/slots";

// The operator's image-swap surface.
//
// Generating a replacement image is gone: photographs are curated before a
// build now, and an AI-generated hero was never something we would send to a
// client anyway. What remains is the honest pair — point a slot at another
// photo this lead already has, or upload a real one.
export const maxDuration = 60;

async function serviceNames(leadId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("artifacts")
    .select("extracted_assets")
    .eq("lead_id", leadId)
    .maybeSingle<{ extracted_assets: Record<string, unknown> | null }>();
  const overrides = (data?.extracted_assets?.brief_overrides ?? {}) as { services?: string[] };
  return overrides.services ?? [];
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const slots = await listSlots(leadId, await serviceNames(leadId));

  // Everything else this lead has that is not currently on the page — the
  // swap-to list.
  const admin = createAdminClient();
  const { data: assets } = await admin
    .from("media_assets")
    .select("public_url, caption, subject, usable")
    .eq("lead_id", leadId)
    .returns<{ public_url: string; caption: string | null; subject: string | null; usable: boolean }[]>();

  const onPage = new Set(slots.map((s) => s.url));
  const spare = (assets ?? [])
    .filter((a) => a.usable !== false && !onPage.has(a.public_url) && a.subject !== "logo")
    .map((a) => ({ url: a.public_url, caption: a.caption ?? "", subject: a.subject ?? "" }));

  return NextResponse.json({ slots, spare });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";

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
    if (!result) return NextResponse.json({ error: "The image could not be read" }, { status: 400 });
    if (!result.applied) {
      return NextResponse.json(
        { error: `Uploaded, but no image on the page carries data-slot="${slotKey}".`, url: result.url },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: true, ...result });
  }

  const body = (await req.json().catch(() => ({}))) as { slot?: string; url?: string };
  const slotKey = typeof body.slot === "string" ? body.slot : "";
  const url = typeof body.url === "string" ? body.url : "";

  if (!slotKey || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "Provide a slot key and an image URL" }, { status: 400 });
  }

  const applied = await applyMedia(leadId, slotKey, url, `Swapped ${slotKey}`);
  if (!applied) {
    return NextResponse.json({ error: `No image on the page carries data-slot="${slotKey}".` }, { status: 404 });
  }
  return NextResponse.json({ ok: true, slot: slotKey, url });
}
