import { getSiteData } from "@/lib/get-site-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeBespokeHtml } from "@/lib/sanitize-generated-html";
import { buildSiteBrief } from "@/lib/build-site-brief";
import { verifyHomepage } from "@/lib/audit/quality-gate";
import { criticiseDesign, type DesignVerdict } from "@/lib/audit/design-critic";
import { conversionIntentFor } from "@/lib/conversion-intent";
import { compileDesignTokens, type DesignTokens } from "@/lib/design-tokens";
import { DEFAULT_DESIGN_DNA } from "@/lib/design-dna";
import { callBestModel, callBestVisionModel, type GenerationProvider } from "@/lib/generate/model";
import { readFileSync } from "fs";
import { resolve } from "path";

export interface EditableSection {
  id: string;
  kind: string;
  label: string;
  html: string;
  locked: boolean;
}

export interface SectionCriticResult {
  passes: boolean;
  deterministic: ReturnType<typeof verifyHomepage>;
  design: DesignVerdict;
  blockers: string[];
  warnings: string[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function slugFromInput(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    const sIndex = parts.indexOf("s");
    return sIndex >= 0 ? parts[sIndex + 1] : parts.at(-1) ?? trimmed;
  } catch {
    return trimmed.replace(/^\/+|\/+$/g, "");
  }
}

/**
 * Accept either a lead slug/URL or a lead id.
 *
 * These helpers were written for the CLI, where an operator pastes a preview
 * URL or a slug. The admin API routes address leads by id instead, and a
 * UUID passed straight through to getSiteData — which matches on `slug` —
 * silently found nothing and surfaced as "No site data found for <uuid>".
 */
async function resolveSlug(input: string): Promise<string> {
  const trimmed = input.trim();
  if (!UUID.test(trimmed)) return slugFromInput(trimmed);

  const admin = createAdminClient();
  const { data } = await admin.from("leads").select("slug").eq("id", trimmed).maybeSingle<{ slug: string }>();
  if (!data?.slug) throw new Error(`No lead found with id ${trimmed}`);
  return data.slug;
}

function labelFromId(id: string): string {
  return id.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseSections(html: string): EditableSection[] {
  const sections: EditableSection[] = [];
  const matches = html.matchAll(/<section\b[\s\S]*?<\/section>/gi);
  for (const match of matches) {
    const sectionHtml = match[0];
    const id = sectionHtml.match(/\bid=["']([^"']+)["']/i)?.[1] ?? `section-${sections.length + 1}`;
    sections.push({ id, kind: id, label: labelFromId(id), html: sectionHtml, locked: false });
  }
  return sections;
}

export async function loadSections(input: string): Promise<{ leadSlug: string; sections: EditableSection[]; css: string | null }> {
  const leadSlug = await resolveSlug(input);
  const data = await getSiteData(leadSlug);
  if (!data) throw new Error(`No site data found for ${leadSlug}`);

  const stored = data.artifact.bespoke_sections ?? [];
  const sections = stored.length > 0
    ? stored.map((section) => ({ ...section, locked: Boolean(section.locked) }))
    : parseSections(data.artifact.bespoke_homepage_html ?? "");

  return { leadSlug, sections, css: data.artifact.bespoke_css ?? null };
}

export async function saveSections(
  input: string,
  sections: EditableSection[],
  options: { css?: string | null; editedBy?: string | null } = {}
): Promise<void> {
  const leadSlug = await resolveSlug(input);
  const data = await getSiteData(leadSlug);
  if (!data) throw new Error(`No site data found for ${leadSlug}`);

  const html = sanitizeBespokeHtml(sections.map((section) => section.html).join("\n"));
  const admin = createAdminClient();
  const update: Record<string, unknown> = {
    bespoke_homepage_html: html,
    bespoke_sections: sections.map((section) => ({
      id: section.id,
      kind: section.kind,
      label: section.label,
      html: sanitizeBespokeHtml(section.html),
      locked: Boolean(section.locked),
    })),
    last_edited_at: new Date().toISOString(),
    // A uuid column. It previously took the literal string
    // "local-section-surgery", which Postgres rejected outright — every save
    // through this path failed with "invalid input syntax for type uuid".
    // The CLI has no user to attribute, so it stores null rather than a
    // label the column cannot hold.
    last_edited_by: UUID.test((options.editedBy ?? "").trim()) ? options.editedBy : null,
  };
  if (options.css !== undefined) update.bespoke_css = options.css;

  const { error } = await admin.from("artifacts").update(update).eq("lead_id", data.lead.id);
  if (error) throw new Error(error.message);
}

export async function criticiseSite(input: string): Promise<SectionCriticResult> {
  const leadSlug = await resolveSlug(input);
  const data = await getSiteData(leadSlug);
  if (!data) throw new Error(`No site data found for ${leadSlug}`);

  const { sections } = await loadSections(leadSlug);
  const html = sanitizeBespokeHtml(sections.map((section) => section.html).join("\n"));
  const tokens = (data.payload.designTokens ?? compileDesignTokens(DEFAULT_DESIGN_DNA)) as DesignTokens;
  const brief = buildSiteBrief(data.lead, data.scrapeResults);
  const intent = conversionIntentFor(data.lead.industry, Boolean(data.payload.nap.phone));

  const deterministic = verifyHomepage(html, brief, tokens, data.artifact.bespoke_css ?? null);
  const design = await criticiseDesign(html, tokens, intent, Boolean(data.payload.nap.phone));
  const blockers = [
    ...deterministic.findings.filter((finding) => finding.severity === "blocker").map((finding) => `${finding.check}: ${finding.detail}`),
    ...design.issues.filter((issue) => issue.severity === "blocker").map((issue) => `${issue.area}: ${issue.detail}`),
  ];
  const warnings = [
    ...deterministic.findings.filter((finding) => finding.severity !== "blocker").map((finding) => `${finding.check}: ${finding.detail}`),
    ...design.issues.filter((issue) => issue.severity !== "blocker").map((issue) => `${issue.area}: ${issue.detail}`),
  ];

  return { passes: deterministic.passes && design.passes, deterministic, design, blockers, warnings };
}

/**
 * Turn whatever the caller has into a data URL the vision model accepts.
 *
 * The CLI passes a path on disk. The browser cannot, so it sends either an
 * uploaded file as a data URL or the address of an image it wants matched —
 * a reference screenshot, or a frame exported from Figma. Reading the remote
 * one server-side keeps the model call identical for all three.
 */
async function toImageDataUrl(image: string): Promise<string> {
  if (image.startsWith("data:")) return image;

  if (/^https?:\/\//i.test(image)) {
    const res = await fetch(image);
    if (!res.ok) throw new Error(`Could not fetch the reference image (${res.status}).`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) {
      // A Figma file URL lands here: it returns HTML, not an image.
      throw new Error(
        `That URL returned ${type || "no content type"}, not an image. A Figma file link cannot be read directly — export the frame as PNG and upload it, or paste a direct image URL.`
      );
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buffer.toString("base64")}`;
  }

  // A path on disk — the CLI's case, and never reachable from the browser.
  const absolutePath = resolve(process.cwd(), image);
  const buffer = readFileSync(absolutePath);
  const ext = image.split(".").pop()?.toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function promptSection(
  input: string,
  sectionId: string,
  instruction: string,
  provider: GenerationProvider = "openai",
  imagePath?: string,
  model?: string
): Promise<EditableSection> {
  const data = await getSiteData(await resolveSlug(input));
  if (!data) throw new Error(`No site data found for ${input}`);
  const { sections } = await loadSections(input);
  const section = sections.find((item) => item.id === sectionId);
  if (!section) throw new Error(`Section "${sectionId}" not found. Available: ${sections.map((s) => s.id).join(", ")}`);

  const brief = buildSiteBrief(data.lead, data.scrapeResults);
  const systemPrompt = "You are a premium agency frontend designer doing a precise section-level repair. Return valid semantic HTML only.";
  const promptText = `You are surgically improving one section of a live generated homepage. Keep the section grounded in facts and preserve existing CSS class hooks where possible so the current stylesheet continues to style it. Use only token-based class architecture and no literal colors.

Business: ${brief.businessName}
Industry: ${brief.industry}
City: ${brief.city}
Services: ${brief.services.join(" | ")}
Primary action: ${brief.intent.primaryLabel}

Operator instruction:
${instruction}
${imagePath ? "\n(A reference image has been provided. Match its layout and structural intent visually)." : ""}

Current section HTML:
${section.html}

Return ONLY one complete <section id="${section.id}">...</section>. No markdown fences, no explanation.`;

  let raw: string | null = null;

  if (imagePath) {
    const dataUrl = await toImageDataUrl(imagePath);
    raw = await callBestVisionModel(promptText, dataUrl, {
      maxTokens: 12000,
      temperature: 0.45,
      system: systemPrompt,
      model,
    });
  } else {
    raw = await callBestModel(
      promptText,
      {
        maxTokens: 12000,
        temperature: 0.45,
        system: systemPrompt,
        model,
      },
      provider
    );
  }

  if (!raw) throw new Error("Model returned no section HTML");
  const html = sanitizeBespokeHtml(raw.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim());
  const parsedId = html.match(/^<section\b[^>]*\bid=["']([^"']+)["']/i)?.[1];
  if (!parsedId || parsedId !== section.id) throw new Error(`Refined output must be a <section id="${section.id}"> root.`);

  return { ...section, html };
}

export function replaceSection(sections: EditableSection[], replacement: EditableSection): EditableSection[] {
  return sections.map((section) => (section.id === replacement.id ? replacement : section));
}
