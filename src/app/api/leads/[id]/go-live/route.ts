import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDomainToProject } from "@/lib/vercel";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: lead }, { data: artifact }] = await Promise.all([
    admin.from("leads").select("id, custom_domain, paid_at, status").eq("id", id).single(),
    admin.from("artifacts").select("qa_status").eq("lead_id", id).maybeSingle(),
  ]);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.paid_at) return NextResponse.json({ error: "Payment is required before launch" }, { status: 409 });
  if (!lead.custom_domain) return NextResponse.json({ error: "Add a custom domain before launch" }, { status: 409 });
  if (artifact?.qa_status !== "approved") return NextResponse.json({ error: "Final QA approval is required before launch" }, { status: 409 });

  const attached = await addDomainToProject(lead.custom_domain);
  if (!attached.ok) return NextResponse.json({ error: attached.error ?? "Could not attach domain" }, { status: 502 });

  const now = new Date().toISOString();
  const { error } = await admin.from("leads").update({ live_at: now, status: "live" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, live_at: now });
}
