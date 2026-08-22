import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeBusiness } from "@/lib/scrape";
import { inngest } from "@/inngest/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdminClient();
  const { data: lead } = await admin.from("leads").select("*").eq("id", leadId).single();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  try {
    const scrapeData = await scrapeBusiness(lead.id, lead.source_url, lead.business_name ?? undefined);
    
    // Trigger enrichment
    await inngest.send({ name: "scrape/completed", data: { lead_id: lead.id } });

    return NextResponse.json({ ok: true, facts: scrapeData.facts });
  } catch (err) {
    console.error("[rescrape] failed", err);
    return NextResponse.json({ error: "Scrape failed" }, { status: 500 });
  }
}
