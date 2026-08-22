import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
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

  try {
    await inngest.send({ name: "lead/intake.submitted", data: { lead_id: lead.id } });
  } catch (err) {
    console.error("[leads/add-url] Inngest trigger failed", err);
  }

  return NextResponse.json({ lead });
}
