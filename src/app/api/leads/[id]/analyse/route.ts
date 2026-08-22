import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { inngest } from "@/inngest/client";
import type { Lead } from "@/types/database";

// Step 1 of the operator flow: analyse this lead.
//
// This is the first point at which a lead costs anything. Intake is a public
// form and no longer triggers it, so a spam submission sits in the list
// costing nothing until a person decides it is real.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const depth = body.depth === "deep" ? "deep" : "light";
  const researchDesign = body.researchDesign === true;

  const admin = createAdminClient();
  const { data: lead } = await admin.from("leads").select("*").eq("id", leadId).single<Lead>();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  await inngest.send({
    name: "lead/analyse.requested",
    data: { lead_id: leadId, depth, researchDesign },
  });

  return NextResponse.json({
    ok: true,
    started: true,
    depth,
    cost: {
      firecrawl: depth === "deep" ? "up to 27 pages" : "2 pages",
      google: "4 calls (business lookup, details, 2 speed tests)",
      designResearch: researchDesign ? "1 search + up to 3 pages, once per industry" : "none",
    },
  });
}

/** What analysing this lead would cost, before anything is spent. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: scrape }, { data: lead }] = await Promise.all([
    admin
      .from("scrape_results")
      .select("scraped_at, facts")
      .eq("lead_id", leadId)
      .maybeSingle<{ scraped_at: string; facts: Record<string, unknown> }>(),
    admin.from("leads").select("industry, persona").eq("id", leadId).single<Lead>(),
  ]);

  const industry = lead?.industry ?? lead?.persona ?? null;
  const { data: reference } = industry
    ? await admin.from("design_references").select("id").ilike("industry", `%${industry}%`).limit(1).maybeSingle()
    : { data: null };

  return NextResponse.json({
    analysed: !!scrape,
    lastAnalysedAt: scrape?.scraped_at ?? null,
    depth: (scrape?.facts?.scrape_depth as string) ?? null,
    servicesFound: ((scrape?.facts?.derived_services as string[]) ?? []).length,
    // Research is only worth offering when this industry has no cached
    // reference; otherwise it is free and already done.
    designResearchNeeded: !!industry && !reference,
    industry,
  });
}
