import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateUniqueDomainSlug } from "@/lib/domain-slug";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.source_url) return NextResponse.json({ error: "source_url is required" }, { status: 400 });

  const admin = createAdminClient();
  const slug = await generateUniqueDomainSlug(admin, body.source_url);

  const { data: lead, error } = await admin
    .from("leads")
    .insert({
      source_url: body.source_url,
      business_name: body.business_name ?? null,
      slug,
      status: "new",
    })
    .select()
    .single();

  if (error || !lead) return NextResponse.json({ error: error?.message ?? "Could not create lead" }, { status: 500 });

  // A manually added URL behaves exactly like an inbound lead: it is created
  // and nothing else happens. It previously fired "lead/intake.submitted",
  // which no function has listened to since analysis became operator-
  // triggered, so it was a silent no-op — and had it worked, it would have
  // reintroduced the automatic spend that intake was changed to avoid.
  return NextResponse.json({ lead });
}
