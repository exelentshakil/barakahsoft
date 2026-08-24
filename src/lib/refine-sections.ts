import type { Artifact } from "@/types/database";
import { sanitizeBespokeHtml } from "@/lib/sanitize-generated-html";
import { sanitizeGeneratedCss } from "@/lib/sanitize-css";
import { HOME_KEY, writeLivePage } from "@/lib/page-versions";

export type EditableSection = Artifact["bespoke_sections"][number];

/** Load a copy so a local refinement script cannot mutate shared context accidentally. */
export function loadSections(artifact: Pick<Artifact, "bespoke_sections">): EditableSection[] {
  if (!Array.isArray(artifact.bespoke_sections) || artifact.bespoke_sections.length === 0) {
    throw new Error("This lead has no addressable bespoke sections. Generate the homepage before refining it.");
  }
  return artifact.bespoke_sections.map((section) => ({ ...section }));
}

/**
 * Persist section surgery and its matching stylesheet as one versioned page.
 * Callers still run the critic and quality gate before considering it done.
 */
export async function saveSections(input: {
  leadId: string;
  sections: EditableSection[];
  css: string;
  note: string;
}): Promise<number> {
  if (input.sections.length === 0) throw new Error("Refusing to save an empty section list.");
  const ids = new Set<string>();
  const sections = input.sections.map((section) => {
    if (!section.id || ids.has(section.id)) throw new Error(`Section IDs must be present and unique: ${section.id || "missing"}`);
    ids.add(section.id);
    const html = sanitizeBespokeHtml(section.html);
    const escapedId = section.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!html || !new RegExp(`<section\\b[^>]*\\bid=["']${escapedId}["']`, "i").test(html)) {
      throw new Error(`Section ${section.id} is empty or its root ID changed during sanitization.`);
    }
    return { ...section, html };
  });
  const css = sanitizeGeneratedCss(input.css);
  if (!css) throw new Error("The refined stylesheet was empty after sanitization.");
  const html = sections.map((section) => section.html).join("\n");

  return writeLivePage(input.leadId, HOME_KEY, html, "claude-code", input.note.slice(0, 200), { css, sections });
}
