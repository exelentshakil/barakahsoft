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
import { callDesignModel } from "@/lib/generate/model";
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

/** A class or id safe to put back into a stylesheet. */
const SAFE_IDENT = /^[A-Za-z][\w-]*$/;

/**
 * The last resort: repaint exactly what measured unreadable.
 *
 * This is NOT the colour normaliser that was deleted, and the difference is
 * the whole point. That one rewrote every colour the model wrote, blindly,
 * and every page converged on one palette. This one runs only after the
 * repair rounds are spent, touches only the selectors a browser actually
 * measured below the floor, and takes the replacement from the compiled
 * system rather than inventing it.
 *
 * The alternative was what shipped before: throw the whole build away. Three
 * runs died that way — 2.27:1, then 4.81:1, then 1.02:1 — each about nine
 * minutes and forty thousand tokens of PRD, design system, chrome and body,
 * discarded over a caption. A page that measured badly and was then repaired
 * to readable is worth more than no page at all, and the operator still has
 * to approve it before a client ever sees it.
 */
function forceReadable(
  failures: Array<{ selector: string; groundLum: number }>
): { css: string; selectors: string[] } {
  const seen = new Set<string>();
  const rules: string[] = [];

  for (const failure of failures) {
    if (seen.has(failure.selector)) continue;

    // label() builds "tag", "tag#id" or "tag.class" — anything else came from
    // a class with characters a stylesheet cannot carry, and is skipped
    // rather than guessed at.
    const parts = failure.selector.split(/([#.])/);
    const tag = parts[0];
    if (!SAFE_IDENT.test(tag)) continue;
    if (parts.length > 1 && !SAFE_IDENT.test(parts[2] ?? "")) continue;

    seen.add(failure.selector);
    // Chosen from the ground that was actually measured, not from what the
    // markup claims. Both tokens are solved by the colour engine to clear the
    // body floor against their own ground.
    const token = failure.groundLum < 0.35 ? "var(--on-dark)" : "var(--ink)";
    // !important because the failing colour is often an inline style, and a
    // readability floor that loses to specificity is not a floor.
    rules.push(`.bespoke-page ${failure.selector}{color:${token} !important}`);
  }

  return { css: rules.join("\n"), selectors: [...seen] };
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
    `YOUR OWN ADDED CSS — these rules stay; what you return is appended after them`,
    "```css",
    // 8000 chars was less than half of a real page's stylesheet, so the model
    // was asked to repair rules it could not see and re-stated ones it could.
    css.slice(0, 20000),
    "```",
    ``,
    `Return ONLY the sections you changed, plus any NEW css rules needed. Your CSS is appended to the stylesheet above, so return only what changes — re-stating a rule that is already right is wasted, and omitting one does not delete it.`,
    `A "timid" finding is not a styling bug — it means the composition is safe and flat. Fixing it means changing the composition: bigger type, a taller hero, a real full bleed, a deliberate overlap, more air. Not a tweak.`,
    ``,
    `Return JSON: {"sections":[{"id","html"}],"cssAdditions":"…"}`,
  ].join("\n");

  const raw = await callDesignModel(
    prompt,
    {
      system: "You repair production HTML and CSS against measured findings. You change only what was reported. You never type a literal value. You return valid JSON only.",
      maxTokens: 24000,
      temperature: 0.7,
      timeoutMs: 280_000,
      label: "repair",
    }
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
  let lastFailures: Array<{ selector: string; groundLum: number }> = [];
  /** Overrides the last-resort pass added, kept so the saved page carries them. */
  let forcedCss = "";

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

    // The rendered pass needs a browser, and a browser is the one thing in this
    // pipeline that can be absent rather than wrong — no Chromium in the
    // function, a launch that times out under load. Letting that throw threw
    // away an entire build: a finished PRD, a compiled system, a stylesheet and
    // a body, all of it already paid for in model calls.
    //
    // So an unavailable browser degrades the audit instead of ending the run.
    // The static half still measured the CSS, the page is still the page; what
    // is lost is the rendered findings, the repair rounds they would have
    // driven, and the queue screenshot. That loss is recorded as a finding so
    // it shows up in the notes rather than passing for a clean audit.
    let rendered: Awaited<ReturnType<typeof auditRendered>> | null = null;
    try {
      rendered = await auditRendered({
        html: document(css, chromeHtml, bodyHtml, footerHtml, input.system.fontHref),
      });
    } catch (error) {
      findings = [
        ...staticFindings,
        {
          check: "rendered-audit-unavailable",
          severity: "note" as const,
          detail:
            "The page was not measured in a browser, so contrast, measure, tap targets and the ambition pass went unchecked: " +
            (error instanceof Error ? error.message.split("\n")[0] : String(error)),
        },
      ];
      break;
    }

    screenshot = rendered.screenshot;
    findings = [...staticFindings, ...rendered.findings];
    lastFailures = rendered.metrics.contrastFailures;

    const worthFixing = findings.filter((finding) => finding.severity !== "note");
    if (!worthFixing.length || round === maxRepairs) break;

    const patch = await repair(worthFixing, sections, extraCss, input.prd);
    if (!patch || (!patch.sections.length && !patch.cssAdditions)) break;

    repairs += 1;
    const byId = new Map(patch.sections.map((section) => [section.id, section.html]));
    sections = sections.map((section) => (byId.has(section.id) ? { ...section, html: byId.get(section.id)! } : section));
    // APPEND. A repair round adds rules; it does not hand back the stylesheet.
    //
    // This used to be `chrome.css + patch.cssAdditions`, which dropped
    // input.body.cssAdditions — the entire stylesheet the model wrote for the
    // page — every time a repair returned any CSS at all. Two rounds later the
    // page still had its ten sections of markup and had lost most of what
    // styled them, which is why builds came out flat and empty with a primary
    // CTA rendering as bare text: `.btn-solid` kept its colour override and
    // lost its background, its padding and its radius.
    //
    // Appending is also what the cascade wants: a later rule beats an earlier
    // one at equal specificity, so a repair overrides what it means to fix and
    // leaves the rest standing. The field is called cssAdditions.
    if (patch.cssAdditions) extraCss = `${extraCss}\n${patch.cssAdditions}`;
  }

  const bodyHtml = sections.map((section) => sanitizeBespokeHtml(section.html)).join("\n");

  // Everything the model could fix, it has now had two rounds to fix. Whatever
  // still measures unreadable gets repainted from the compiled system, and the
  // page is measured once more so the findings describe what is actually being
  // saved rather than what it looked like before the repaint.
  // Two passes, because one is measured against a stylesheet that the pass
  // itself then changes.
  //
  // The first attempt at this repainted from `lastFailures` and stopped. Every
  // override it wrote picked var(--on-dark) for elements that shipped on a
  // LIGHT ground — light text on near-white, 1.02:1, worse than what it
  // replaced — because the ground had been dark when it was measured and was
  // not dark any more by the time the page was assembled. Re-measuring and
  // repainting again converges on the document that actually ships.
  const repainted: string[] = [];
  for (let pass = 0; pass < 2 && lastFailures.length; pass += 1) {
    const forced = forceReadable(lastFailures);
    if (!forced.css) break;

    // Layered, not replaced: a second pass corrects a first-pass choice that
    // the re-measure proved wrong, and later rules win at equal specificity.
    forcedCss = forcedCss ? `${forcedCss}\n${forced.css}` : forced.css;
    for (const selector of forced.selectors) if (!repainted.includes(selector)) repainted.push(selector);

    const remeasured = await auditRendered({
      html: document(
        `${input.system.css}\n${remediateCss(sanitizeGeneratedCss(extraCss, allowed)).css}\n${forcedCss}`,
        chromeHtml,
        bodyHtml,
        footerHtml,
        input.system.fontHref
      ),
    }).catch(() => null);

    if (!remeasured) break;

    screenshot = remeasured.screenshot;
    findings = [
      ...findings.filter((finding) => finding.check !== "contrast"),
      ...remeasured.findings.filter((finding) => finding.check === "contrast"),
    ];
    lastFailures = remeasured.metrics.contrastFailures;
    if (!lastFailures.length) break;
  }

  if (repainted.length) {
    findings = [
      ...findings,
      {
        check: "forced-readable",
        severity: "note" as const,
        detail:
          `${repainted.length} selector(s) repainted from the compiled system after the repair rounds were ` +
          `spent: ${repainted.slice(0, 6).join(", ")}. Worth a look — the model chose a colour the page ` +
          `could not carry, and the fix here is mechanical rather than designed.`,
      },
    ];
  }

  const css = `${input.system.css}\n${remediateCss(sanitizeGeneratedCss(extraCss, allowed)).css}${
    forcedCss ? `\n${forcedCss}` : ""
  }`;
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
