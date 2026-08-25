import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";

// Costs that are not model calls — ad spend, tooling, anything else set
// against revenue for a period.
//
// The table was readable and had no write path, so "we spent $1k on ads"
// could not reach the one screen that compares spend to what came in.

export async function GET(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }
  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit") ?? 20), 100);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("operating_costs")
    .select("*")
    .order("incurred_on", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const amount = Number(body?.amountUsd);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter an amount greater than zero." }, { status: 400 });
  }
  const kind = ["ads", "tooling", "other"].includes(body?.kind) ? body.kind : "other";

  // Dated rather than stamped with "now": ad spend is usually entered days
  // after it happened, and putting it in the wrong week makes both weeks
  // wrong.
  const incurredOn = typeof body?.incurredOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.incurredOn)
    ? body.incurredOn
    : new Date().toISOString().slice(0, 10);

  const admin = createAdminClient();
  const { error } = await admin.from("operating_costs").insert({
    kind,
    label: typeof body?.label === "string" && body.label.trim() ? body.label.trim().slice(0, 120) : null,
    amount_usd: amount,
    incurred_on: incurredOn,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("operating_costs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
