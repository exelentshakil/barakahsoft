import { callGemini, bestGeminiChain, type GeminiImagePart } from "@/lib/gemini-client";
import { sanitizeBespokeHtml } from "@/lib/sanitize-generated-html";
import { sanitizeGeneratedCss } from "@/lib/sanitize-css";
import { MOCKUP_RULES } from "@/lib/generate/v2/vocabulary";
import type { RenderedSection } from "@/lib/generate/v2/render-sections";
import type { PageSystem } from "@/lib/generate/v2/design-system";

// Stage three: look at the page as pixels, then fix what is actually broken.
//
// The failures that make a build unusable for a social mockup — a headline
// clipped by its own container, a logo blown up to fill the hero, a founder
// badge sitting on a paragraph — are all invisible in the source and obvious
// in a screenshot. This renders the composed page, hands the images to the
// Pro model, and regenerates only the sections it names.
//
// Rendering runs through Playwright, which exists as a dev dependency and
// works locally, and does not exist in the serverless runtime. When no
// renderer is available the pass degrades to a source review against the
// same rules rather than silently doing nothing — the log says which ran.

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

export interface RepairResult {
  sections: RenderedSection[];
  footer: RenderedSection | null;
  notes: string[];
  mode: "rendered" | "source" | "skipped";
}

async function screenshot(fullHtml: string): Promise<GeminiImagePart[] | null> {
  let chromium: typeof import("playwright").chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.warn("[visual-repair] playwright is not available in this runtime; falling back to a source review");
    return null;
  }

  let browser: import("playwright").Browser | null = null;
  try {
    browser = await chromium.launch();
    const images: GeminiImagePart[] = [];
    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      await page.setContent(fullHtml, { waitUntil: "load", timeout: 60_000 }).catch(() => {});

      // Client photography and stock URLs are slow, and "networkidle" alone
      // would let a half-loaded page be captured — at which point the critic
      // reports broken images that are not broken and rebuilds good sections
      // to fix them. Wait for the images themselves, report the ones that
      // genuinely failed, and scroll the page so lazy-loaded ones start.
      await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight);
        window.scrollTo(0, 0);
        await Promise.all(
          Array.from(document.images)
            .filter((image) => !image.complete)
            .map(
              (image) =>
                new Promise((resolve) => {
                  image.addEventListener("load", resolve, { once: true });
                  image.addEventListener("error", resolve, { once: true });
                  window.setTimeout(resolve, 12_000);
                })
            )
        );
      }).catch(() => {});

      const broken = await page
        .evaluate(() => Array.from(document.images).filter((image) => image.naturalWidth === 0).map((image) => image.src))
        .catch(() => [] as string[]);
      if (broken.length) console.warn(`[visual-repair] ${broken.length} image(s) did not load: ${broken.slice(0, 3).join(", ")}`);

      // The first screen, which is what lands on the mockup.
      const first = await page.screenshot({ type: "png" });
      images.push({ mimeType: "image/png", data: first.toString("base64") });
      // The whole page, so a defect below the fold is still visible.
      const full = await page.screenshot({ type: "png", fullPage: true });
      images.push({ mimeType: "image/png", data: full.toString("base64") });
      await page.close();
    }
    return images;
  } catch (err) {
    console.error("[visual-repair] render failed:", err);
    return null;
  } finally {
    await browser?.close().catch(() => {});
  }
}

const CritiquePrompt = (system: PageSystem, ids: string[], rendered: boolean) => `You are the final release gate for a bespoke local-business homepage whose first screen and about
section are about to be screenshotted onto a laptop mockup and posted publicly.

${rendered
    ? "You are looking at real Chromium screenshots: desktop first screen, desktop full page, mobile first screen, mobile full page."
    : "No renderer was available, so you are reviewing the source markup and stylesheet instead. Judge only defects you can actually establish from the source."}

THE INTENDED DESIGN
${system.systemName} — ${system.rationale}

${MOCKUP_RULES}

Name only defects that are real and observable, and for each one name the section id it belongs
to. Valid section ids: ${ids.join(", ")}, footer.

Return STRICT JSON only:
{"score":0,"summary":"","repairs":[{"sectionId":"hero","defect":"what is wrong, observably","fix":"the concrete change to make"}],"warnings":[]}

score is 0-100. Put a defect in repairs only when it would embarrass the studio in a public post;
everything else goes in warnings. An excellent page returns an empty repairs array.`;

interface Critique {
  score: number;
  summary: string;
  repairs: { sectionId: string; defect: string; fix: string }[];
  warnings: string[];
}

function parseCritique(raw: string | null): Critique | null {
  if (!raw) return null;
  try {
    const json = raw.replace(/```[a-z]*\s*/gi, "").replace(/```/g, "").trim();
    const start = json.indexOf("{");
    const parsed = JSON.parse(json.slice(start, json.lastIndexOf("}") + 1));
    return {
      score: Number(parsed.score) || 0,
      summary: String(parsed.summary ?? ""),
      repairs: Array.isArray(parsed.repairs)
        ? parsed.repairs
            .filter((item: unknown): item is Record<string, string> => !!item && typeof item === "object")
            .map((item: Record<string, string>) => ({
              sectionId: String(item.sectionId ?? ""),
              defect: String(item.defect ?? ""),
              fix: String(item.fix ?? ""),
            }))
            .filter((item: { sectionId: string }) => item.sectionId)
        : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : [],
    };
  } catch (err) {
    console.error("[visual-repair] could not parse the critique:", err);
    return null;
  }
}

async function repairSection(
  section: RenderedSection,
  instructions: { defect: string; fix: string }[],
  css: string
): Promise<RenderedSection | null> {
  const prompt = `Repair one section of an already-designed page. Change ONLY what the defects require.

DEFECTS OBSERVED IN THE RENDERED PAGE
${instructions.map((item) => `- ${item.defect}\n  FIX: ${item.fix}`).join("\n")}

${MOCKUP_RULES}

THE SECTION'S CURRENT MARKUP
${section.html}

THE STYLESHEET IT IS RENDERED WITH (read-only; you may not change it — express any fix as markup,
existing classes, or the id-scoped CSS block described below)
${css.slice(0, 24000)}

Return the corrected <${section.kind === "footer" ? "footer" : "section"}> element and nothing else — no fence, no commentary.
Keep the same id, keep every fact and every image URL exactly as they are, keep the same classes
except where a defect requires otherwise. If the fix genuinely needs new CSS, append "/*CSS*/"
then rules whose every selector begins with #${section.id}.`;

  const chain = bestGeminiChain();
  const raw = await callGemini(prompt, chain[0], undefined, {
    modelChain: chain,
    maxTokens: 20000,
    temperature: 0.3,
    timeoutMs: 300_000,
    system: "You are a senior front-end engineer performing a surgical fix. You output HTML only.",
  });
  if (!raw) return null;

  const cleaned = raw.replace(/```[a-z]*\s*/gi, "").replace(/```/g, "").trim();
  const [markup, extra] = cleaned.split("/*CSS*/");
  const html = sanitizeBespokeHtml(markup.trim());
  if (!html || html.length < 120) return null;
  return {
    ...section,
    html,
    css: [section.css, extra ? sanitizeGeneratedCss(extra.trim()) : ""].filter(Boolean).join("\n"),
  };
}

export async function repairPage(args: {
  system: PageSystem;
  sections: RenderedSection[];
  footer: RenderedSection | null;
  css: string;
  fullHtmlForRender: string;
}): Promise<RepairResult> {
  const { system, sections, footer, css, fullHtmlForRender } = args;
  const ids = sections.map((section) => section.id);

  const images = await screenshot(fullHtmlForRender);
  const mode: RepairResult["mode"] = images ? "rendered" : "source";

  const sourcePayload = images
    ? undefined
    : `\n\nMARKUP\n${sections.map((s) => s.html).join("\n").slice(0, 90000)}\n\nSTYLESHEET\n${css.slice(0, 40000)}`;

  const raw = await callGemini(
    CritiquePrompt(system, ids, Boolean(images)) + (sourcePayload ?? ""),
    bestGeminiChain()[0],
    images ?? undefined,
    {
      modelChain: bestGeminiChain(),
      maxTokens: 12000,
      temperature: 0.15,
      timeoutMs: 420_000,
      system: "You are a strict, practical creative director. Evidence decides the release.",
    }
  );

  const critique = parseCritique(raw);
  if (!critique) return { sections, footer, notes: ["[visual-repair] the review was unavailable"], mode: "skipped" };

  const notes = [
    `[score] visual gate (${mode}): ${critique.score}/100 — ${critique.summary}`,
    ...critique.warnings.map((warning) => `[warning] visual gate: ${warning}`),
    ...critique.repairs.map((repair) => `[repaired] ${repair.sectionId}: ${repair.defect}`),
  ];

  // Only the sections the critic actually named are rebuilt, and they are
  // rebuilt in parallel. Regenerating a section nobody complained about is
  // how a good build gets replaced by a worse one.
  const grouped = new Map<string, { defect: string; fix: string }[]>();
  for (const repair of critique.repairs) {
    const list = grouped.get(repair.sectionId) ?? [];
    list.push({ defect: repair.defect, fix: repair.fix });
    grouped.set(repair.sectionId, list);
  }

  const targets = [...sections, ...(footer ? [footer] : [])].filter((section) => grouped.has(section.id));
  const repaired = await Promise.all(
    targets.map((section) =>
      repairSection(section, grouped.get(section.id)!, css).catch(() => null)
    )
  );

  const byId = new Map(repaired.filter((s): s is RenderedSection => s !== null).map((s) => [s.id, s]));
  return {
    sections: sections.map((section) => byId.get(section.id) ?? section),
    footer: footer ? byId.get(footer.id) ?? footer : null,
    notes,
    mode,
  };
}
