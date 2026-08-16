import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAccount } from "@/lib/get-or-create-account";
import { editSectionWithPrompt } from "@/lib/edit-section";
import type { Facts } from "@/lib/ai";
import type { FunnelPageSection } from "@/types/database";

// Operator-only content editing (confirmed scope: no client-facing
// tooling) — the business owner emails/calls with a change request, the
// operator applies it here. PATCHes one funnel_pages entry by slug,
// finally putting the already-present-but-unused last_edited_at/
// last_edited_by columns to use.
//
// Three ways to edit a section, all through this one route:
// - Literal h2/body_content -- direct text overwrite, unchanged from before.
// - `prompt` -- AI-prompt-driven edit/rebuild (small tweak or full rewrite,
//   same mechanism either way), routed through the same grounding-gated
//   pipeline every other generator uses. Applied immediately; any grounding
//   warning comes back in the response for the operator to see right away,
//   not a separate delayed review queue -- they're already looking at the
//   live preview.
// - `media_asset_id` -- swaps this section's image (from a prior
//   /api/upload call) instead of/alongside a text edit.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (typeof body?.slug !== "string") return NextResponse.json({ error: "slug is required" }, { status: 400 });

  const admin = createAdminClient();
  const [{ data: artifact }, { data: scrapeResults }] = await Promise.all([
    admin.from("artifacts").select("funnel_pages").eq("lead_id", leadId).single(),
    admin.from("scrape_results").select("facts").eq("lead_id", leadId).single(),
  ]);
  if (!artifact) return NextResponse.json({ error: "No artifact for this lead" }, { status: 404 });

  const sections = artifact.funnel_pages as FunnelPageSection[];
  const index = sections.findIndex((s) => s.slug === body.slug);
  if (index === -1) return NextResponse.json({ error: `No section with slug "${body.slug}"` }, { status: 404 });

  const updated = { ...sections[index] };
  let groundingWarnings: string[] = [];

  if (typeof body.prompt === "string" && body.prompt.trim()) {
    if (!scrapeResults) return NextResponse.json({ error: "No scraped facts for this lead — can't ground an AI edit" }, { status: 404 });
    const result = await editSectionWithPrompt(scrapeResults.facts as Facts, updated, body.prompt.trim());
    updated.h2 = result.h2;
    updated.body_content = result.body_content;
    groundingWarnings = result.groundingWarnings;
  } else {
    if (typeof body.h2 === "string") updated.h2 = body.h2;
    if (typeof body.body_content === "string") updated.body_content = body.body_content;
  }

  if (typeof body.media_asset_id === "string" && body.media_asset_id) {
    updated.media_asset_ids = [body.media_asset_id];
  }

  const nextSections = [...sections];
  nextSections[index] = updated;

  const accountId = await getOrCreateAccount(user.id, user.email ?? "");

  const { error } = await admin
    .from("artifacts")
    .update({ funnel_pages: nextSections, last_edited_at: new Date().toISOString(), last_edited_by: accountId })
    .eq("lead_id", leadId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ section: updated, groundingWarnings });
}
