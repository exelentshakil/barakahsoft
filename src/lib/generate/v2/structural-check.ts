import * as cheerio from "cheerio";
import type { RenderedSection } from "@/lib/generate/v2/render-sections";

// The release gate when no browser is available.
//
// On the deployed runtime there is no Chromium, so the "visual" critique was a
// model reading markup it could not see rendered — six and a half minutes of
// two Pro calls to produce observations about a page nobody had looked at.
// Every defect it reliably caught in that mode is one that can be checked
// exactly, in code, in milliseconds.
//
// This is not a replacement for the rendered pass. It is what runs when the
// rendered pass is impossible, instead of an expensive impression of it.

export interface StructuralFinding {
  sectionId: string;
  defect: string;
  fix: string;
}

export function checkStructure(sections: RenderedSection[], footer: RenderedSection | null, chrome: RenderedSection | null): StructuralFinding[] {
  const findings: StructuralFinding[] = [];
  const all = [...(chrome ? [chrome] : []), ...sections, ...(footer ? [footer] : [])];

  const pageHtml = all.map((section) => section.html).join("\n");
  const $page = cheerio.load(pageHtml, null, false);

  if ($page("[data-lead-form]").length === 0) {
    findings.push({
      sectionId: sections[0]?.id ?? "hero",
      defect: "The page has no lead-capture form at all.",
      fix: "Add the hero lead form: <form data-lead-form class=\"bs-form\"> with its .bs-form__head bar and fields named name, phone, email, service.",
    });
  }
  if ($page("h1").length !== 1) {
    findings.push({
      sectionId: sections[0]?.id ?? "hero",
      defect: `The page has ${$page("h1").length} <h1> elements; it must have exactly one, in the hero.`,
      fix: "Make the hero headline the only <h1>; every other section heading is an <h2>.",
    });
  }

  for (const section of all) {
    const $ = cheerio.load(section.html, null, false);

    $("[class*='bs-media']").each((_, element) => {
      const node = $(element);
      if (node.find("img,svg").length === 0 && node.text().trim().length === 0) {
        findings.push({
          sectionId: section.id,
          defect: "A .bs-media frame contains no image, so it renders as a large empty box.",
          fix: "Either put the assigned photograph in it, or remove the frame and compose the section without an image.",
        });
      }
    });

    $("img").each((_, element) => {
      const src = $(element).attr("src") ?? "";
      if (!/^https?:\/\//i.test(src)) {
        findings.push({
          sectionId: section.id,
          defect: `An <img> points at "${src.slice(0, 60)}", which is not a real image URL.`,
          fix: "Use one of the photograph URLs supplied in the brief, or remove the image.",
        });
      }
      if (!$(element).attr("alt")) {
        findings.push({ sectionId: section.id, defect: "An <img> has no alt text.", fix: "Add descriptive alt text naming the business and the work shown." });
      }
    });

    if ($("[class*='bs-btn'],[class*='bs-link-call']").length === 0 && !["trust", "chrome"].includes(section.id)) {
      findings.push({
        sectionId: section.id,
        defect: "The section ends with nowhere for the visitor to go.",
        fix: "Add a .bs-btn primary action, a .bs-link-call, or both.",
      });
    }
  }

  // One finding per section is enough to trigger a rebuild of it; ten copies
  // of "empty frame" would only make the repair prompt harder to follow.
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.sectionId}|${finding.defect.slice(0, 40)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
