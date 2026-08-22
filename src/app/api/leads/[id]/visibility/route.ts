import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { inngest } from "@/inngest/client";
import type { Lead, ScrapeResults } from "@/types/database";

// Measuring local search visibility for a lead.
//
// Explicitly triggered, never automatic: every cell is a real search and
// therefore real spend, and this is the report section worth paying for only
// on a lead an operator has decided to pitch.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const cellCount = Math.min(Math.max(Number(body.cells) || 25, 9), 49);

  const admin = createAdminClient();
  const [{ data: lead }, { data: scrape }] = await Promise.all([
    admin.from("leads").select("*").eq("id", leadId).single<Lead>(),
    admin.from("scrape_results").select("facts").eq("lead_id", leadId).maybeSingle<ScrapeResults>(),
  ]);

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!scrape) {
    return NextResponse.json({ error: "Analyse this lead first — the measurement needs its city and trade." }, { status: 409 });
  }

  await inngest.send({
    name: "lead/visibility.requested",
    data: { lead_id: leadId, cellCount },
  });

  return NextResponse.json({ ok: true, started: true, cells: cellCount });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("scrape_results")
    .select("search_visibility, search_visibility_at")
    .eq("lead_id", leadId)
    .maybeSingle<{ search_visibility: unknown; search_visibility_at: string | null }>();

  return NextResponse.json({
    visibility: data?.search_visibility ?? null,
    measuredAt: data?.search_visibility_at ?? null,
  });
}
