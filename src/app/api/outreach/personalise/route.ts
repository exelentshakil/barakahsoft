import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { generateOutreachDraft } from "@/lib/outreach/personalise";
import type { Lead, ScrapeResults } from "@/types/database";

// Write a personal first email for each selected prospect.
//
// Generation is separated from sending on purpose. These messages go to real
// businesses that never asked to hear from us, and this is the one place in
// the product where a model's words reach a stranger with nobody in between.
// So they are written, stored, and read by an operator before anything is
// sent — the Send button then prefers the reviewed draft over the sequence's
// generic copy.

const MAX_BATCH = 25;
// Wide enough that twenty-five leads finish inside the request, narrow
// enough not to trip the provider's rate limit halfway through and leave
// half the batch written and half not.
const CONCURRENCY = 4;

export const maxDuration = 300;

async function inPool<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await task(items[index]);
      }
    })
  );
  return results;
}

export async function POST(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.leadIds) ? body.leadIds.filter((v: unknown) => typeof v === "string") : [];
  if (ids.length === 0) return NextResponse.json({ error: "Select at least one prospect." }, { status: 400 });
  if (ids.length > MAX_BATCH) {
    return NextResponse.json({ error: `Write at most ${MAX_BATCH} at a time.` }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: leads, error } = await admin.from("leads").select("*").in("id", ids).returns<Lead[]>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: scrapes } = await admin
    .from("scrape_results")
    .select("*")
    .in("lead_id", ids)
    .returns<ScrapeResults[]>();
  // Newest scrape per lead: a re-scraped business has more than one row and
  // the stale one describes a site that may already have changed.
  const scrapeFor = new Map<string, ScrapeResults>();
  for (const row of scrapes ?? []) {
    const held = scrapeFor.get(row.lead_id);
    if (!held || new Date(row.scraped_at) > new Date(held.scraped_at)) scrapeFor.set(row.lead_id, row);
  }

  const written: { id: string; business: string; subject: string; hook: string }[] = [];
  const skipped: { id: string; business: string; reason: string }[] = [];

  await inPool(leads ?? [], CONCURRENCY, async (lead) => {
    const business = lead.business_name ?? lead.source_url;
    try {
      const { draft, reason } = await generateOutreachDraft(lead, scrapeFor.get(lead.id) ?? null);
      if (!draft) {
        skipped.push({ id: lead.id, business, reason: reason ?? "no draft" });
        return;
      }
      const { error: saveError } = await admin.from("leads").update({ outreach_draft: draft }).eq("id", lead.id);
      if (saveError) {
        skipped.push({ id: lead.id, business, reason: saveError.message });
        return;
      }
      written.push({ id: lead.id, business, subject: draft.subject, hook: draft.hook });
    } catch (err) {
      skipped.push({ id: lead.id, business, reason: err instanceof Error ? err.message : "generation failed" });
    }
  });

  return NextResponse.json({ written: written.length, drafts: written, skipped });
}
