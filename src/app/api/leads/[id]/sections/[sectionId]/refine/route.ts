import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { promptSection, loadSections, saveSections, replaceSection } from "@/lib/section-surgery";

export async function POST(req: Request, { params }: { params: Promise<{ id: string, sectionId: string }> }) {
  const { id, sectionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const body = await req.json();
    const { instruction, provider } = body;
    
    if (!instruction) {
      return NextResponse.json({ error: "instruction is required" }, { status: 400 });
    }

    const newSection = await promptSection(id, sectionId, instruction, provider || "openai");
    
    // Save immediately if we want
    const { sections, css } = await loadSections(id);
    const updatedSections = replaceSection(sections, newSection);
    await saveSections(id, updatedSections, { css });

    return NextResponse.json({ ok: true, section: newSection });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
