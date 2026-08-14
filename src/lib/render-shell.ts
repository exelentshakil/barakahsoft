import type { Artifact, Lead, ScrapeResults, MediaAsset } from "@/types/database";
import type { SitePayload } from "@/components/site-shell/types";

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

  const services = artifact.funnel_pages.filter((s) => s.kind === "service");
  const areas = artifact.funnel_pages.filter((s) => s.kind === "area");
  const faq = artifact.funnel_pages.filter((s) => s.kind === "faq");
  const differentiatorSection = artifact.funnel_pages.find((s) => s.kind === "differentiator");
  const heroSection = artifact.funnel_pages.find((s) => s.kind === "hero");

  const heroMedia = heroSection ? firstImageFor(heroSection) : mediaAssets.find((m) => m.slot_hint === "hero")?.public_url ?? null;
  const proofMedia = mediaAssets.find((m) => m.slot_hint === "proof")?.public_url ?? null;

  return {
    businessName: lead.business_name || (facts.business_name as string) || new URL(lead.source_url).hostname,
    headline: heroSection?.h2 || (facts.business_name as string) || "Welcome",
    subhead: heroSection?.body_content || "",
    heroImageUrl: heroMedia,
    proof: {
      rating: (facts.rating as number) ?? null,
      reviewCount: (facts.review_count as number) ?? null,
      imageUrl: proofMedia,
    },
    differentiator: differentiatorSection?.body_content || "",
    guarantee: (artifact.extracted_assets?.guarantee as string) || "",
    services: services.map((s) => ({ ...s, media_asset_ids: s.media_asset_ids })),
    areas,
    faq,
    reviews: ((facts.reviews as { author_name: string; rating: number; text: string }[]) ?? []).slice(0, 6),
    nap: {
      phone: (facts.nap as { phones?: string[] })?.phones?.[0] ?? null,
      email: (facts.nap as { emails?: string[] })?.emails?.[0] ?? null,
      address: (facts.nap as { address?: string })?.address ?? null,
    },
    socialUrls: (facts.social_urls as string[]) ?? [],
    brandColorHsl: (facts.brand_color_hsl as string) ?? null,
    logoUrl: (facts.logo_url as string) ?? null,
    innerPagesBuilt: artifact.inner_pages_built,
    leadSlug: lead.slug,
  };
}
