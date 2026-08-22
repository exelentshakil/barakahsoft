import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Allows the operator (or local AI tool like Claude Code / Open Code) to directly update or override
// the lead's bespoke HTML/JSX, colors, and layout in Supabase, keeping the live URL 100% in sync.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const admin = createAdminClient();

  const updates: Record<string, unknown> = {
    last_edited_at: new Date().toISOString(),
  };

  if (typeof body.bespoke_html === "string") {
    updates.bespoke_homepage_html = body.bespoke_html;
  }

  if (Array.isArray(body.funnel_pages)) {
    updates.funnel_pages = body.funnel_pages;
  }

  if (body.extracted_assets && typeof body.extracted_assets === "object") {
    const { data: existing } = await admin
      .from("artifacts")
      .select("extracted_assets")
      .eq("lead_id", leadId)
      .single();

    updates.extracted_assets = {
      ...(existing?.extracted_assets || {}),
      ...body.extracted_assets,
    };
  }

  const { error } = await admin.from("artifacts").update(updates).eq("lead_id", leadId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, lead_id: leadId, updated_at: new Date().toISOString() });
}
