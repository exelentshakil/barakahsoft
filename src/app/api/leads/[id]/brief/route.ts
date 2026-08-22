import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";

// Persists the operator's brief.
//
// Confirmed data loss: the Studio's fields were only ever sent along with a
// generate request, and nothing wrote them back. "Exact Industry" and "Core
// Services" therefore came back empty on every reload -- the operator typed
// them, generated, and lost them. The brief is the most valuable human input
// in the whole pipeline and it was the only thing not being saved.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid brief payload" }, { status: 400 });

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("artifacts")
    .select("extracted_assets")
    .eq("lead_id", leadId)
    .maybeSingle<{ extracted_assets: Record<string, unknown> }>();

  // Only overwrite what was actually sent. The Studio autosaves individual
  // fields as they change, so a partial payload must not blank the rest.
  const brief: Record<string, unknown> = { ...(existing?.extracted_assets ?? {}) };

  const assign = (key: string, value: unknown) => {
    if (value !== undefined && value !== null) brief[key] = value;
  };

  assign("business_name", typeof body.businessName === "string" ? body.businessName : undefined);
  assign("founder_name", typeof body.founder === "string" ? body.founder : undefined);
  assign("city", typeof body.city === "string" ? body.city : undefined);
  assign("industry", typeof body.industry === "string" ? body.industry : undefined);
  assign("hero_cutout", typeof body.heroImage === "string" ? body.heroImage : undefined);
  assign("services_list", Array.isArray(body.services) ? body.services.filter(Boolean) : undefined);
  assign("areas_list", Array.isArray(body.areas) ? body.areas.filter(Boolean) : undefined);

  brief.brief_updated_at = new Date().toISOString();

  const { error } = await admin
    .from("artifacts")
    .update({ extracted_assets: brief, last_edited_at: new Date().toISOString() })
    .eq("lead_id", leadId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Industry lives on the lead too — the leads table is what the pipeline
  // list and the persona classifier read.
  if (typeof body.industry === "string" && body.industry.trim()) {
    await admin.from("leads").update({ industry: body.industry.trim() }).eq("id", leadId);
  }

  return NextResponse.json({ ok: true, brief });
}
