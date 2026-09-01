import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { operatorAccountId } from "@/lib/is-admin-session";
import { getSiteData } from "@/lib/get-site-data";
import { loadSections, saveSections } from "@/lib/section-surgery";
import { sanitizeBespokeHtml } from "@/lib/sanitize-generated-html";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const { sections, css } = await loadSections(id);
    return NextResponse.json({ sections, css });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const body = await req.json();
    const { sectionId, html, css } = body;
    
    if (!sectionId || !html) {
      return NextResponse.json({ error: "sectionId and html are required" }, { status: 400 });
    }

    const { sections } = await loadSections(id);
    const existingIndex = sections.findIndex(s => s.id === sectionId);
    if (existingIndex === -1) {
       return NextResponse.json({ error: `Section ${sectionId} not found` }, { status: 404 });
    }

    sections[existingIndex].html = sanitizeBespokeHtml(html);
    await saveSections(id, sections, { css, editedBy: await operatorAccountId() });

    return NextResponse.json({ ok: true, section: sections[existingIndex] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const body = await req.json();
    const { sections, css } = body;
    if (!Array.isArray(sections)) {
      return NextResponse.json({ error: "sections array is required" }, { status: 400 });
    }

    await saveSections(id, sections, { css, editedBy: await operatorAccountId() });

    // Hand back what was actually stored. The editor applies edits to the
    // live page instead of reloading it, so it needs the canonical copy to
    // sync to — otherwise the page keeps showing the draft and quietly
    // disagrees with the database the moment anything is normalised on the
    // way in.
    const stored = await loadSections(id);
    return NextResponse.json({ ok: true, sections: stored.sections, css: stored.css });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
