import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeBespokeHtml } from "@/lib/sanitize-generated-html";
import { writeLivePage, HOME_KEY, type VersionSource } from "@/lib/page-versions";

// Pages as addressable sections.
//
// A page stored as one HTML blob has exactly one repair available:
// regenerate everything. That throws away every section that was already
// good in order to fix the one that was not, which is why a slightly weak
// hero meant starting the whole page over — and why nobody wanted to touch
// a page once any part of it was right.
//
// Sections make the unit of work match the unit of judgement. `locked` is
// the guarantee that matters: an approved section is never touched by any
// regeneration, whatever it targets.

export interface PageSection {
  id: string;
  /** What this section is, for labelling and for regeneration context. */
  kind: string;
  label: string;
  html: string;
  /** Approved. Never modified by regeneration. */
  locked: boolean;
}

const KIND_LABELS: Record<string, string> = {
  hero: "Hero",
  trust: "Trust strip",
  services: "Services",
  about: "Why this business",
  proof: "Reviews & proof",
  areas: "Service areas",
  faq: "FAQ",
  contact: "Closing call to action",
  process: "How it works",
  gallery: "Gallery",
};

/** Best-effort read of what a section is, from the anchors and content it carries. */
function inferKind(html: string, index: number, total: number): string {
  const idMatch = html.match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
  if (idMatch && KIND_LABELS[idMatch]) return idMatch;

  const text = html.replace(/<[^>]+>/g, " ").toLowerCase();
  if (index === 0) return "hero";
  if (/\bfaq\b|frequently asked|question/.test(text)) return "faq";
  if (/review|testimonial|rating|stars/.test(text)) return "proof";
  if (/service area|areas we|neighbourhood|neighborhood|serving/.test(text)) return "areas";
  if (/\bservices?\b/.test(text) && index < total / 2) return "services";
  if (index === total - 1) return "contact";
  return "about";
}

export function labelFor(kind: string): string {
  return KIND_LABELS[kind] ?? kind.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Split generated markup into sections.
 *
 * The class vocabulary requires every band to be a top-level element, so
 * splitting on top-level tags is reliable without asking the model to emit a
 * bespoke envelope format it would sometimes get wrong.
 */
export function splitIntoSections(html: string): PageSection[] {
  const parts: string[] = [];

  let depth = 0;
  let start = -1;
  let cursor = 0;

  // Walk top-level element boundaries rather than regex-matching whole
  // blocks: sections legitimately nest, and a non-greedy match would cut
  // them at the first inner closing tag.
  const tokens = [...html.matchAll(/<(\/?)(section|div|article|aside|main)\b[^>]*?(\/?)>/gi)];
  for (const token of tokens) {
    const isClosing = token[1] === "/";
    const isSelfClosing = token[3] === "/";
    if (isSelfClosing) continue;

    if (!isClosing) {
      if (depth === 0) start = token.index!;
      depth += 1;
    } else {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        parts.push(html.slice(start, token.index! + token[0].length));
        cursor = token.index! + token[0].length;
        start = -1;
      }
      if (depth < 0) depth = 0;
    }
  }

  // Anything after the last balanced block (rare, but real when a model
  // leaves a trailing fragment) is kept rather than silently dropped.
  const tail = html.slice(cursor).trim();
  if (tail && tail.replace(/<[^>]+>/g, "").trim().length > 0) parts.push(tail);

  const blocks = parts.filter((p) => p.replace(/<[^>]+>/g, "").trim().length > 0);
  if (blocks.length === 0) {
    return [{ id: "section-1", kind: "hero", label: "Full page", html, locked: false }];
  }

  return blocks.map((block, index) => {
    const kind = inferKind(block, index, blocks.length);
    return {
      id: `section-${index + 1}`,
      kind,
      label: labelFor(kind),
      html: block.trim(),
      locked: false,
    };
  });
}

/** The rendered page is the concatenation of its sections, in order. */
export function joinSections(sections: PageSection[]): string {
  return sections.map((s) => s.html).join("\n\n");
}

export async function loadSections(leadId: string): Promise<PageSection[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("artifacts")
    .select("bespoke_sections, bespoke_homepage_html")
    .eq("lead_id", leadId)
    .single<{ bespoke_sections: PageSection[]; bespoke_homepage_html: string | null }>();

  if (data?.bespoke_sections?.length) return data.bespoke_sections;

  // Pages generated before sections existed are split on first access, so the
  // refinement tools work on them without anyone regenerating.
  if (data?.bespoke_homepage_html) {
    const split = splitIntoSections(data.bespoke_homepage_html);
    await admin.from("artifacts").update({ bespoke_sections: split }).eq("lead_id", leadId);
    return split;
  }

  return [];
}

/**
 * Persist sections and the page derived from them.
 *
 * Both always move together — a stored page that disagrees with its sections
 * would mean the preview and the editor were showing different things.
 */
export async function saveSections(
  leadId: string,
  sections: PageSection[],
  source: VersionSource,
  note: string
): Promise<void> {
  const admin = createAdminClient();
  const clean = sections.map((s) => ({ ...s, html: sanitizeBespokeHtml(s.html) }));

  await admin.from("artifacts").update({ bespoke_sections: clean }).eq("lead_id", leadId);
  await writeLivePage(leadId, HOME_KEY, joinSections(clean), source, note);
}
