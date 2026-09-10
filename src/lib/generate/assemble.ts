// Assembly: sanitize what the model wrote, measure it, repair it, hand back a
// page.
//
// The repair loop is what converts one-shot output into worked output. A model
// asked once produces something plausible; a model shown exactly which pair
// measured 3.1:1 and which section padded 40px fixes those and leaves the rest
// alone. That difference is most of the gap between a generated page and one
// somebody would pay for.
//
// The audit runs BEFORE anything is persisted. Auditing afterwards would mean
// publishing a failure and repairing it in public.

import { sanitizeBespokeHtml } from "@/lib/sanitize-generated-html";
import { sanitizeGeneratedCss } from "@/lib/sanitize-css";
import { sanitizeGeneratedJs } from "@/lib/sanitize-js";
import { auditStatic, scoreOf, type AuditFinding } from "@/lib/design/audit";
import { remediateCss } from "@/lib/design/remediate";
import { auditRendered } from "@/lib/design/audit-rendered";
import { callSmartModel } from "@/lib/generate/model";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { TOKEN_CONTRACT } from "@/lib/design/law";
import type { DesignSystem } from "@/lib/design";
import type { Body, Chrome, MediaAsset } from "@/lib/generate/author";
import type { Prd } from "@/lib/generate/prd";

export interface AssembledPage {
  chromeHtml: string;
  footerHtml: string;
  bodyHtml: string;
  css: string;
  js: string;
  sections: Array<{ id: string; kind: string; label: string; html: string; locked: boolean }>;
  findings: AuditFinding[];
  score: number;
  screenshot: Buffer | null;
  repairs: number;
}

/** One self-contained document, for auditing and for the queue screenshot. */
function document(css: string, chrome: string, body: string, footer: string, fontHref: string): string {
  return [
    "<!doctype html><html><head><meta charset='utf-8'>",
    "<meta name='viewport' content='width=device-width,initial-scale=1'>",
    fontHref ? `<link rel="stylesheet" href="${fontHref}">` : "",
    `<style>html,body{margin:0;padding:0}${css}</style></head><body>`,
    `<div class="bespoke-page">${chrome}${body}${footer}</div>`,
    "</body></html>",
  ].join("");
}

function assetUrls(media: MediaAsset[]): string[] {
  return media.map((asset) => asset.url);
}

async function repair(
  findings: AuditFinding[],
  sections: Body["sections"],
  css: string,
  prd: Prd
): Promise<{ sections: Array<{ id: string; html: string }>; cssAdditions: string } | null> {
  const actionable = findings.filter((finding) => finding.severity !== "note");
  if (!actionable.length) return null;

  const prompt = [
    `A page you wrote has been measured. Fix exactly what is listed and change nothing else.`,
    ``,
    `THE ORGANISING IDEA — every fix has to still serve it`,
    prd.idea,
    ``,
    `WHAT THE MEASUREMENTS FOUND`,
    actionable.map((finding) => `- [${finding.check}] ${finding.detail}`).join("\n"),
    ``,
    TOKEN_CONTRACT,
    ``,
    `THE SECTIONS AS THEY STAND`,
    sections.map((section) => `--- id="${section.id}" ---\n${section.html}`).join("\n\n"),
    ``,
    `YOUR OWN ADDED CSS`,
    "```css",
    css.slice(0, 8000),
    "```",
    ``,
    `Return ONLY the sections you changed, plus replacement CSS additions.`,
    `A "timid" finding is not a styling bug — it means the composition is safe and flat. Fixing it means changing the composition: bigger type, a taller hero, a real full bleed, a deliberate overlap, more air. Not a tweak.`,
    ``,
    `Return JSON: {"sections":[{"id","html"}],"cssAdditions":"…"}`,
  ].join("\n");

  const raw = await callSmartModel(
    prompt,
    {
      system: "You repair production HTML and CSS against measured findings. You change only what was reported. You never type a literal value. You return valid JSON only.",
      maxTokens: 24000,
      temperature: 0.7,
      timeoutMs: 280_000,
    },
    "gemini"
  );

  const parsed = raw ? parseJsonResponse(raw) : null;
  if (!parsed || typeof parsed !== "object") return null;
  const shaped = parsed as { sections?: Array<{ id?: string; html?: string }>; cssAdditions?: string };
  const patched = (shaped.sections ?? []).filter(
    (section): section is { id: string; html: string } => typeof section?.id === "string" && typeof section?.html === "string"
  );
  return { sections: patched, cssAdditions: typeof shaped.cssAdditions === "string" ? shaped.cssAdditions : "" };
}

export interface AssembleInput {
  prd: Prd;
  system: DesignSystem;
  chrome: Chrome;
  body: Body;
  media: MediaAsset[];
  /** How many repair rounds to allow. Two is the plan's budget. */
  maxRepairs?: number;
}

export async function assemble(input: AssembleInput): Promise<AssembledPage> {
  const allowed = assetUrls(input.media);
  const maxRepairs = input.maxRepairs ?? 2;

  let sections = input.body.sections;
  let extraCss = `${input.chrome.css}\n${input.body.cssAdditions}`;
  let findings: AuditFinding[] = [];
  let screenshot: Buffer | null = null;
  let repairs = 0;

  const chromeHtml = sanitizeBespokeHtml(input.chrome.nav);
  const footerHtml = sanitizeBespokeHtml(input.chrome.footer);

  const remediations: string[] = [];

  for (let round = 0; round <= maxRepairs; round += 1) {
    const bodyHtml = sections.map((section) => sanitizeBespokeHtml(section.html)).join("\n");
    // Mechanical misuse first, deterministically and for free, so the model's
    // repair round arrives at the design findings rather than at a caption
    // painted in a border token.
    const cleaned = remediateCss(sanitizeGeneratedCss(extraCss, allowed));
    if (round === 0 && cleaned.changes.length) remediations.push(...cleaned.changes);
    const authoredCss = cleaned.css;
    const css = `${input.system.css}\n${authoredCss}`;

    const staticFindings = auditStatic({
      css: authoredCss,
      sectionIds: sections.map((section) => section.id),
      spacingScale: input.system.meta.space.steps,
    });

    const rendered = await auditRendered({
      html: document(css, chromeHtml, bodyHtml, footerHtml, input.system.fontHref),
    });
    screenshot = rendered.screenshot;
    findings = [...staticFindings, ...rendered.findings];

    const worthFixing = findings.filter((finding) => finding.severity !== "note");
    if (!worthFixing.length || round === maxRepairs) break;

    const patch = await repair(worthFixing, sections, extraCss, input.prd);
    if (!patch || (!patch.sections.length && !patch.cssAdditions)) break;

    repairs += 1;
    const byId = new Map(patch.sections.map((section) => [section.id, section.html]));
    sections = sections.map((section) => (byId.has(section.id) ? { ...section, html: byId.get(section.id)! } : section));
    if (patch.cssAdditions) extraCss = `${input.chrome.css}\n${patch.cssAdditions}`;
  }

  const bodyHtml = sections.map((section) => sanitizeBespokeHtml(section.html)).join("\n");
  const css = `${input.system.css}\n${remediateCss(sanitizeGeneratedCss(extraCss, allowed)).css}`;
  const js = sanitizeGeneratedJs(`${input.chrome.js}\n${input.body.js}`);

  const kindById = new Map(input.prd.sections.map((section) => [section.id, section.kind]));

  return {
    chromeHtml,
    footerHtml,
    bodyHtml,
    css,
    js,
    sections: sections.map((section) => ({
      id: section.id,
      kind: kindById.get(section.id) ?? section.id,
      label: section.label || kindById.get(section.id) || section.id,
      html: sanitizeBespokeHtml(section.html),
      locked: false,
    })),
    findings: remediations.length
      ? [
          ...findings,
          {
            check: "auto-remediated",
            severity: "note" as const,
            detail: `${remediations.length} mechanical token misuse(s) corrected before repair: ${remediations.slice(0, 4).join("; ")}`,
          },
        ]
      : findings,
    score: scoreOf(findings),
    screenshot,
    repairs,
  };
}
