import type { Artifact, Lead, ScrapeResults, MediaAsset } from "@/types/database";
import type { SitePayload, ResolvedSection } from "@/components/site-shell/types";
import { extractServiceAreas } from "@/lib/scrape/extract-service-areas";
import { slugifyText } from "@/lib/slug";
import { DEFAULT_CHROME, type ChromeSpec } from "@/lib/chrome-spec";
import type { PageInventory } from "@/lib/scrape/extract-text";

// render_shell atom — resolves an artifact + its lead/scrape context into
// the flat SitePayload every shell component renders from. This is the
// only place that reaches into artifacts.funnel_pages / scrape_results.facts
// shape directly; shell components stay dumb.
export function renderShell(
  lead: Lead,
  artifact: Artifact,
  scrapeResults: ScrapeResults,
  mediaAssets: MediaAsset[]
): SitePayload {
  const facts = scrapeResults.facts as Record<string, unknown>;
  const mediaById = new Map(mediaAssets.map((m) => [m.id, m]));

  function firstImageFor(section: { media_asset_ids: string[] }): string | null {
    const id = section.media_asset_ids[0];
    return id ? mediaById.get(id)?.public_url ?? null : null;
  }

  // Resolve real photo URLs for EVERY section once, generically — not
  // special-cased to hero/proof. Services/areas previously got a real photo
  // assigned by the waterfall but never had it resolved to a URL here, so
  // the card components had nothing to render even when a photo existed.
  const resolvedSections = artifact.funnel_pages.map((s) => ({
    ...s,
    imageUrl: firstImageFor(s),
    imageUrls: s.media_asset_ids.map((id) => mediaById.get(id)?.public_url).filter((u): u is string => !!u),
  }));

  const services = resolvedSections.filter((s) => s.kind === "service");
  // Confirmed real gap: nothing has created a funnel_pages row with
  // kind==="area" since Phase L's location-service combo pages replaced
  // the old standalone-area generator -- `areas` was silently always
  // empty (correctly showing nothing, per the never-invent discipline),
  // even though extractServiceAreas() already finds real area names for
  // most leads (confirmed: Daniel's Roofing has 12 real location-service
  // combos, meaning real areas were extracted all along, just never
  // surfaced on the homepage/footer). extractServiceAreas is a cheap,
  // deterministic regex pass (no AI call), safe to run here directly
  // rather than requiring a stored, AI-generated section per area.
  const realAreaNames = extractServiceAreas((facts.pages as PageInventory[]) ?? []);
  const areas: ResolvedSection[] = realAreaNames.map((name) => ({
    slug: slugifyText(name),
    kind: "area",
    h2: name,
    body_content: "",
    media_asset_ids: [],
    cta: null,
    imageUrl: null,
    imageUrls: [],
  }));
  const locationServices = resolvedSections.filter((s) => s.kind === "location-service");
  const faq = resolvedSections.filter((s) => s.kind === "faq");
  const differentiatorSection = resolvedSections.find((s) => s.kind === "differentiator");
  const heroSection = resolvedSections.find((s) => s.kind === "hero");
  const trustStrip = resolvedSections.find((s) => s.kind === "trust-strip") ?? null;
  const expertise = resolvedSections.find((s) => s.kind === "expertise") ?? null;
  const ctaBanner = resolvedSections.find((s) => s.kind === "cta-banner") ?? null;
  const process = resolvedSections.find((s) => s.kind === "process") ?? null;
  const audienceSegments = resolvedSections.find((s) => s.kind === "audience-segments") ?? null;
  const certifications = resolvedSections.find((s) => s.kind === "certifications") ?? null;

  const heroMedia = heroSection?.imageUrl ?? mediaAssets.find((m) => m.slot_hint === "hero")?.public_url ?? null;
  const proofMedia = mediaAssets.find((m) => m.slot_hint === "proof")?.public_url ?? null;
  const heroVideoMedia = mediaAssets.find((m) => m.slot_hint === "hero-video")?.public_url ?? null;

  const META_COPY = /no research|research was provided|unable to confirm|cannot confirm|not available/i;
  const businessName = (facts.business_name as string) || new URL(lead.source_url).hostname;
  const headline = heroSection?.h2 && !META_COPY.test(heroSection.h2)
    ? heroSection.h2
    : `${businessName} provides trusted local service`;
  const subhead = heroSection?.body_content && !META_COPY.test(heroSection.body_content)
    ? heroSection.body_content
    : differentiatorSection?.body_content && !META_COPY.test(differentiatorSection.body_content)
      ? differentiatorSection.body_content
      : "Clear communication, real local service, and a straightforward next step.";

  const rawSectionVariants = artifact.section_variant_selections ?? {};
  const bespokeDesignPlan = rawSectionVariants.__designPlan && typeof rawSectionVariants.__designPlan === "object"
    ? rawSectionVariants.__designPlan as Record<string, unknown>
    : null;
  const sectionVariants = Object.fromEntries(
    Object.entries(rawSectionVariants).filter(([key, value]) => key !== "__designPlan" && typeof value === "string")
  ) as Record<string, string>;

  return {
    businessName,
    headline,
    subhead,
    heroImageUrl: heroMedia,
    heroVideoUrl: heroVideoMedia,
    proof: {
      rating: (facts.rating as number) ?? null,
      reviewCount: (facts.review_count as number) ?? null,
      imageUrl: proofMedia,
    },
    differentiator: differentiatorSection?.body_content || "",
    guarantee: (artifact.extracted_assets?.guarantee as string) || "",
    services,
    areas,
    locationServices,
    faq,
    trustStrip,
    expertise,
    ctaBanner,
    process,
    audienceSegments,
    certifications,
    // Star-only Google reviews (real, common -- a reviewer left a rating with
    // no written comment) render as a blank card with just a name floating
    // at the bottom in every reviews variant, since the text paragraph has
    // nothing to fill it. Filtered here once, upstream of every variant,
    // rather than each component re-deriving the same guard.
    reviews: ((facts.reviews as { author_name: string; rating: number; text: string }[]) ?? [])
      .filter((r) => r.text && r.text.trim().length > 0)
      .slice(0, 6),
    nap: {
      phone: ((facts.nap as { phones?: string[] })?.phones ?? []).find((phone) => /\d{7,}/.test(phone.replace(/\D/g, ""))) ?? null,
      email: (facts.nap as { emails?: string[] })?.emails?.[0] ?? null,
      address: (facts.nap as { address?: string })?.address ?? null,
    },
    socialUrls: (facts.social_urls as string[]) ?? [],
    brandColorHsl: (facts.brand_color_hsl as string) ?? null,
    logoUrl: (facts.logo_url as string) ?? null,
    // Keep the delivered system visually consistent. Client fonts are useful
    // as research signals, but arbitrary scraped font imports made pages feel
    // inconsistent and occasionally broke the intended hierarchy.
    fontFamily: null,
    fontStylesheetUrl: null,
    innerPagesBuilt: artifact.inner_pages_built,
    fullSiteBuilt: artifact.full_site_status === "complete",
    leadSlug: lead.slug,
    sectionVariants,
    bespokeDesignPlan,
    bespokeHomepageHtml: artifact.bespoke_homepage_html,
    designTokens: artifact.design_tokens ?? null,
    bespokePages: artifact.bespoke_pages ?? {},
    // Leads generated before chrome was part of the design system fall back
    // to the house archetype rather than rendering no header at all.
    chromeSpec: (artifact.chrome_spec as ChromeSpec | null) ?? DEFAULT_CHROME,
    bespokeRationale: artifact.bespoke_rationale,
  };
}
