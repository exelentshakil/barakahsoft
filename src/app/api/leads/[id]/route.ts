import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanupLeadStorage } from "@/lib/supabase/cleanup-storage";

// Admin edit/delete for a single lead — cleanup of test/junk rows and
// correcting bad scrape data, gated the same way as every other admin API.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const updates: Record<string, string | null> = {};
  if (typeof body?.business_name === "string") updates.business_name = body.business_name || null;
  if (typeof body?.contact_name === "string") updates.contact_name = body.contact_name || null;
  if (typeof body?.email === "string") updates.email = body.email.trim() || null;
  if (typeof body?.phone === "string") updates.phone = body.phone.trim() || null;
  if (typeof body?.status === "string") updates.status = body.status;
  if (typeof body?.source_url === "string" && body.source_url) updates.source_url = body.source_url;
  if (typeof body?.facebook_pixel_id === "string") updates.facebook_pixel_id = body.facebook_pixel_id.trim() || null;
  if (typeof body?.google_site_verification === "string") updates.google_site_verification = body.google_site_verification.trim() || null;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: lead, error } = await admin.from("leads").update(updates).eq("id", id).select().single();
  if (error || !lead) return NextResponse.json({ error: error?.message ?? "Could not update lead" }, { status: 500 });

  return NextResponse.json({ lead });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdminClient();

  // 1. Clean up all media assets, uploads, and visual QA screenshots from Supabase Storage
  await cleanupLeadStorage(admin, [id]);

  // 2. Delete database lead row
  const { error } = await admin.from("leads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
