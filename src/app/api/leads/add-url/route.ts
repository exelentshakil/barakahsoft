import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateUniqueDomainSlug } from "@/lib/domain-slug";
import { validateOutreachEmail } from "@/lib/outreach/validate-email";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.source_url) return NextResponse.json({ error: "source_url is required" }, { status: 400 });

  // An outreach prospect with no address can never be sent to, so the
  // address is checked here rather than discovered at send time when a
  // bounce has already cost sender reputation.
  const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
  let emailNotes: string[] = [];
  if (rawEmail) {
    const verdict = await validateOutreachEmail(rawEmail, body.source_url);
    if (!verdict.ok) return NextResponse.json({ error: verdict.problem }, { status: 400 });
    emailNotes = verdict.notes;
  }

  const admin = createAdminClient();
  const slug = await generateUniqueDomainSlug(admin, body.source_url);

  const { data: lead, error } = await admin
    .from("leads")
    .insert({
      source_url: body.source_url,
      business_name: body.business_name ?? null,
      email: rawEmail ? rawEmail.toLowerCase() : null,
      slug,
      status: "new",
      source: "outreach",
    })
    .select()
    .single();

  if (error || !lead) return NextResponse.json({ error: error?.message ?? "Could not create lead" }, { status: 500 });

  // A manually added URL behaves exactly like an inbound lead: it is created
  // and nothing else happens. It previously fired "lead/intake.submitted",
  // which no function has listened to since analysis became operator-
  // triggered, so it was a silent no-op — and had it worked, it would have
  // reintroduced the automatic spend that intake was changed to avoid.
  return NextResponse.json({ lead, lead_id: lead.id, emailNotes });
}
