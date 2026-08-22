import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { loadSections, saveSections, labelFor, type PageSection } from "@/lib/page-sections";
import { regenerateSection, createSection } from "@/lib/regenerate-section";
import { buildSiteBrief } from "@/lib/build-site-brief";
import { CopyPlanSchema } from "@/lib/generate-copy-plan";
import { DesignDnaSchema, DEFAULT_DESIGN_DNA } from "@/lib/design-dna";
import type { MediaPlan } from "@/lib/media/plan-media";
import type { Artifact, Lead, ScrapeResults } from "@/types/database";

// Section-level editing. This is the whole refinement surface the operator's
// team works through, so it deliberately needs no HTML knowledge: pick a
// section, say what is wrong in plain English.
export const maxDuration = 300;

async function context(leadId: string) {
  const admin = createAdminClient();
  const [{ data: lead }, { data: scrape }, { data: artifact }] = await Promise.all([
    admin.from("leads").select("*").eq("id", leadId).single<Lead>(),
    admin.from("scrape_results").select("*").eq("lead_id", leadId).single<ScrapeResults>(),
    admin.from("artifacts").select("*").eq("lead_id", leadId).single<Artifact>(),
  ]);
  if (!lead || !scrape || !artifact) return null;

  const copy = CopyPlanSchema.safeParse(artifact.copy_plan);
  if (!copy.success) return null;

  const dna = DesignDnaSchema.safeParse(artifact.inspiration_branding);

  return {
    brief: buildSiteBrief(lead, scrape, (artifact.extracted_assets ?? {}) as never),
    copy: copy.data,
    dna: dna.success ? dna.data : DEFAULT_DESIGN_DNA,
    media: (artifact.media_plan as MediaPlan | null) ?? [],
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const sections = await loadSections(leadId);
  // Markup is large and the editor never renders it; sending it would make
  // every poll of this endpoint expensive for no benefit.
  return NextResponse.json({
    sections: sections.map(({ id, kind, label, locked, html }) => ({
      id,
      kind,
      label,
      locked,
      words: html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length,
      images: (html.match(/<img\b/gi) ?? []).length,
    })),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const sections = await loadSections(leadId);

  if (sections.length === 0) {
    return NextResponse.json({ error: "Generate the homepage first" }, { status: 409 });
  }

  const index = sections.findIndex((s) => s.id === body.sectionId);

  // Structural edits need no model call and are instant.
  if (action === "lock" || action === "unlock") {
    if (index < 0) return NextResponse.json({ error: "Section not found" }, { status: 404 });
    const next = [...sections];
    next[index] = { ...next[index], locked: action === "lock" };
    await saveSections(leadId, next, "edited", `${action === "lock" ? "Approved" : "Reopened"} ${next[index].label}`);
    return NextResponse.json({ ok: true });
  }

  if (action === "remove") {
    if (index < 0) return NextResponse.json({ error: "Section not found" }, { status: 404 });
    if (sections[index].locked) {
      return NextResponse.json({ error: "That section is approved. Reopen it before removing it." }, { status: 409 });
    }
    const removed = sections[index];
    await saveSections(leadId, sections.filter((_, i) => i !== index), "edited", `Removed ${removed.label}`);
    return NextResponse.json({ ok: true });
  }

  if (action === "move") {
    if (index < 0) return NextResponse.json({ error: "Section not found" }, { status: 404 });
    const direction = body.direction === "up" ? -1 : 1;
    const target = index + direction;
    if (target < 0 || target >= sections.length) return NextResponse.json({ ok: true });
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    await saveSections(leadId, next, "edited", `Moved ${next[target].label}`);
    return NextResponse.json({ ok: true });
  }

  const ctx = await context(leadId);
  if (!ctx) {
    return NextResponse.json(
      { error: "This lead has no saved copy plan yet — regenerate the homepage once before editing sections." },
      { status: 409 }
    );
  }

  if (action === "regenerate") {
    if (index < 0) return NextResponse.json({ error: "Section not found" }, { status: 404 });
    if (sections[index].locked) {
      return NextResponse.json(
        { error: "That section is approved and will not be changed. Reopen it first." },
        { status: 409 }
      );
    }

    const html = await regenerateSection(
      { ...ctx, sections },
      sections[index],
      typeof body.instruction === "string" ? body.instruction.trim() : undefined
    );
    if (!html) return NextResponse.json({ error: "The rewrite came back empty — try again, or be more specific." }, { status: 502 });

    const next = [...sections];
    next[index] = { ...next[index], html };
    await saveSections(leadId, next, "regenerated", `Rewrote ${next[index].label}`);
    return NextResponse.json({ ok: true });
  }

  if (action === "add") {
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!description) return NextResponse.json({ error: "Describe the section you want" }, { status: 400 });

    const afterIndex = index >= 0 ? index : sections.length - 1;
    const html = await createSection({ ...ctx, sections }, description, sections[afterIndex]?.label ?? null);
    if (!html) return NextResponse.json({ error: "The new section came back empty — try describing it differently." }, { status: 502 });

    const kind = typeof body.kind === "string" && body.kind ? body.kind : "about";
    const section: PageSection = {
      id: `section-${Date.now()}`,
      kind,
      label: labelFor(kind),
      html,
      locked: false,
    };

    const next = [...sections];
    next.splice(afterIndex + 1, 0, section);
    await saveSections(leadId, next, "regenerated", `Added ${section.label}`);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 });
}
