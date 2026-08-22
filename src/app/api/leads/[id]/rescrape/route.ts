import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { inngest } from "@/inngest/client";
import type { Lead } from "@/types/database";

// Re-scraping, split by what it actually costs.
//
// This route previously ran the whole scrape inside the request and then
// fired "scrape/completed" — an event nothing has listened to since the
// legacy pipeline was removed. With crawling now in the pipeline the
// synchronous version would also time out.
//
// The split matters because the page budget is finite and the two jobs are
// not remotely equal: refreshing branding and reviews costs one page, while
// a full re-crawl costs the whole site again. An operator should not be able
// to spend the expensive one by accident.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const mode = body.mode === "full" ? "full" : "light";

  const admin = createAdminClient();
  const { data: lead } = await admin.from("leads").select("*").eq("id", leadId).single<Lead>();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  await inngest.send({
    name: "lead/rescrape.requested",
    data: { lead_id: leadId, mode },
  });

  return NextResponse.json({
    ok: true,
    mode,
    started: true,
    estimatedPages: mode === "full" ? "up to 30" : "1",
  });
}

/** What a re-scrape would cost, so the cost is visible before it is spent. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("scrape_results")
    .select("facts, scraped_at")
    .eq("lead_id", leadId)
    .maybeSingle<{ facts: Record<string, unknown>; scraped_at: string }>();

  const pageCount = Array.isArray(data?.facts?.pages) ? (data!.facts!.pages as unknown[]).length : 0;

  return NextResponse.json({
    lastScrapedAt: data?.scraped_at ?? null,
    pagesLastTime: pageCount,
    // The light refresh is one page regardless of site size; the full
    // re-crawl costs roughly what it cost last time.
    lightCost: 1,
    fullCost: pageCount || "up to 30",
  });
}
