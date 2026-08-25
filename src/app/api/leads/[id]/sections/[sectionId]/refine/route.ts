import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/is-admin-session";
import { createClient } from "@/lib/supabase/server";
import { promptSection, loadSections, saveSections, replaceSection } from "@/lib/section-surgery";

// Rebuilding one section from an instruction, optionally against a reference
// image.
//
// The image may be an uploaded screenshot (sent as a data URL) or the address
// of one. A Figma *file* link is neither — it serves HTML — so it is rejected
// with an explanation rather than silently ignored, which is what "paste a
// Figma URL" would otherwise appear to do.

// Vision requests carry a whole image and then generate markup, so the
// default execution window is not enough.
export const maxDuration = 300;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  const { id, sectionId } = await params;

  // This spends model budget and rewrites a client's live page, so it takes
  // the operator allowlist rather than "is signed in".
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { instruction, provider, model } = body;

    if (!instruction || typeof instruction !== "string" || !instruction.trim()) {
      return NextResponse.json({ error: "instruction is required" }, { status: 400 });
    }

    const image = typeof body.image === "string" && body.image.trim() ? body.image.trim() : undefined;
    if (image?.startsWith("data:")) {
      // Base64 inflates by about a third; compare against the decoded size.
      const approxBytes = (image.length - image.indexOf(",") - 1) * 0.75;
      if (approxBytes > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "That image is over 8MB. Export it smaller and try again." }, { status: 413 });
      }
      if (!/^data:image\//i.test(image)) {
        return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
      }
    }

    const newSection = await promptSection(
      id,
      sectionId,
      instruction.trim(),
      provider === "gemini" ? "gemini" : "openai",
      image,
      typeof model === "string" && model.trim() ? model.trim() : undefined
    );

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { sections, css } = await loadSections(id);
    await saveSections(id, replaceSection(sections, newSection), { css, editedBy: user?.id ?? null });

    return NextResponse.json({ ok: true, section: newSection });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refine failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
