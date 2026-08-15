import { callGemini, type Facts } from "@/lib/ai";
import type { Playbook } from "@/lib/playbooks";
import type { CompetitorResearch } from "@/lib/research-competitors";
import type { PageInventory } from "@/lib/scrape/extract-text";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SectionVariantCatalogRow {
  section_kind: string;
  variant_slug: string;
  industry_tags: string[];
  description: string;
  is_default: boolean;
}

export interface SectionComposition {
  selections: Record<string, string>;
  rationale: string;
}

export async function loadSectionVariantCatalog(industry: string): Promise<SectionVariantCatalogRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("section_variant_catalog")
    .select("section_kind, variant_slug, industry_tags, description, is_default")
    .contains("industry_tags", [industry]);
  return data ?? [];
}

// SelectSectionVariants — the live, per-lead research-driven composition
// step. The model only ever picks an enum value from a fixed, pre-vetted
// menu (never a component path, never markup); any invalid/missing pick is
// dropped here and falls back to that kind's default at render time
// (src/components/site-shell/sections/registry.ts), so a bad or failed
// call can only ever produce today's already-shipped, known-good look.
export async function selectSectionVariants(
  facts: Facts,
  playbook: Playbook,
  competitorResearch: CompetitorResearch,
  catalog: SectionVariantCatalogRow[]
): Promise<SectionComposition> {
  const byKind = new Map<string, SectionVariantCatalogRow[]>();
  for (const row of catalog) {
    const list = byKind.get(row.section_kind) ?? [];
    list.push(row);
    byKind.set(row.section_kind, list);
  }

  if (byKind.size === 0) return { selections: {}, rationale: "No catalog rows available for this industry — using defaults." };

  const menu = Array.from(byKind.entries()).map(([kind, rows]) => ({
    kind,
    options: rows.map((r) => ({ slug: r.variant_slug, description: r.description })),
  }));

  const { structuralSummary, designBrief } = competitorResearch;
  const town = facts.town as string | undefined;

  const prompt = `You are picking a homepage layout variant for each section of a real local business, based on real research — never invent anything, only choose between the real options given.

Business: ${playbook.industry_label}${town ? ` in ${town}` : ""}
This business's real available content: ${describeFactsRichness(facts)}

Real competitor research (${structuralSummary.sampleSize} real ${playbook.industry_label} sites in this niche/location, scraped live just now):
- ${structuralSummary.heroImagePct}% lead with a large hero image
- ${structuralSummary.statsAboveFoldPct}% show stats/numbers above the fold
- ${structuralSummary.testimonialPct}% feature testimonials prominently
- ${structuralSummary.galleryPct}% show a photo gallery
- average ${structuralSummary.avgNavLinks} nav links
${designBrief ? `Design brief: ${designBrief}` : ""}

For EACH section kind below, pick exactly one option slug that best fits this specific business's real content and what real competitors in this niche actually do. Reply with strict JSON only, no markdown fences, no commentary — one key per section kind plus a "rationale" key (one short sentence explaining your overall picks):
{"hero": "chosen-slug", "rationale": "..."}

Section kinds and their real options:
${JSON.stringify(menu, null, 2)}`;

  const raw = await callGemini(prompt);
  if (!raw) return { selections: {}, rationale: "Composition call failed — using defaults." };

  const parsed = parseJsonResponse(raw);
  if (!parsed) return { selections: {}, rationale: "Composition response wasn't valid JSON — using defaults." };

  const selections: Record<string, string> = {};
  for (const [kind, rows] of byKind) {
    const picked = parsed[kind];
    if (typeof picked === "string" && rows.some((r) => r.variant_slug === picked)) {
      selections[kind] = picked;
    }
  }

  const rationale = typeof parsed.rationale === "string" ? parsed.rationale : "";
  return { selections, rationale };
}

function describeFactsRichness(facts: Facts): string {
  const pages = (facts.pages as PageInventory[] | undefined) ?? [];
  const serviceHints = Array.from(new Set(pages.flatMap((p) => p.navLinks.map((l) => l.text)))).slice(0, 15);
  const reviewCount = facts.review_count as number | undefined;
  const rating = facts.rating as number | undefined;
  const sitePhotos = (facts.site_photos as unknown[] | undefined)?.length ?? 0;
  const gbpPhotos = (facts.gbp_photo_urls as unknown[] | undefined)?.length ?? 0;

  const parts: string[] = [];
  if (serviceHints.length > 0) parts.push(`real nav/service labels: ${serviceHints.join(", ")}`);
  if (reviewCount && rating) parts.push(`${reviewCount} real reviews at ${rating} rating`);
  if (sitePhotos + gbpPhotos > 0) parts.push(`${sitePhotos + gbpPhotos} real photos available`);
  return parts.length > 0 ? parts.join("; ") : "minimal real content available";
}

function parseJsonResponse(raw: string): Record<string, unknown> | null {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
