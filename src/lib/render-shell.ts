import type { Artifact, Lead, ScrapeResults, MediaAsset } from "@/types/database";
import type { SitePayload, ResolvedSection } from "@/components/site-shell/types";
import { extractServiceAreas } from "@/lib/scrape/extract-service-areas";
import { slugifyText } from "@/lib/slug";
import { DEFAULT_CHROME, type ChromeSpec } from "@/lib/chrome-spec";
import type { PageInventory } from "@/lib/scrape/extract-text";
import { conversionIntentFor } from "@/lib/conversion-intent";
import { displayPhone } from "@/lib/phone";
import { resolveBusinessContact } from "@/lib/business-contact";
import { findLicenseInsuranceMention } from "@/lib/trust-signals";
import { resolveLogoUrl, resolveFooterLogoUrl } from "@/lib/brand-assets";

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
  const realAreaNames = Array.from(new Set([
    ...((facts.derived_areas as string[] | undefined) ?? []),
    ...extractServiceAreas((facts.pages as PageInventory[]) ?? []),
  ])).slice(0, 12);
  const availableImagesForAreas = mediaAssets.filter(m => m.slot_hint !== 'hero' && m.slot_hint !== 'logo').map(m => m.public_url);
  let areaImageIndex = 0;

  const areas: ResolvedSection[] = realAreaNames.map((name) => {
    const assignedImageUrl = availableImagesForAreas.length > 0 ? availableImagesForAreas[areaImageIndex % availableImagesForAreas.length] : null;
    if (availableImagesForAreas.length > 0) areaImageIndex++;

    return {
      slug: slugifyText(name),
      kind: "area",
      h2: name,
      body_content: "",
      media_asset_ids: [],
      cta: null,
      imageUrl: assignedImageUrl,
      imageUrls: assignedImageUrl ? [assignedImageUrl] : [],
    };
  });

  const generatedAreaSlugs = Object.keys(artifact.bespoke_pages ?? {})
    .filter((key) => key.startsWith("areas/") && artifact.bespoke_pages[key]?.trim())
    .map((key) => key.slice("areas/".length));
  for (const slug of generatedAreaSlugs) {
    if (areas.some((area) => area.slug === slug)) continue;

    const assignedImageUrl = availableImagesForAreas.length > 0 ? availableImagesForAreas[areaImageIndex % availableImagesForAreas.length] : null;
    if (availableImagesForAreas.length > 0) areaImageIndex++;

    areas.push({
      slug,
      kind: "area",
      h2: slug.replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()),
      body_content: "",
      media_asset_ids: [],
      cta: null,
      imageUrl: assignedImageUrl,
      imageUrls: assignedImageUrl ? [assignedImageUrl] : [],
    });
  }
  const hasGeneratedPage = (key: string) => artifact.inner_pages_built && Boolean(artifact.bespoke_pages?.[key]?.trim());
  const navigation = {
    services: services
      .map((service) => ({
        slug: service.slug,
        label: service.h2,
        description: service.body_content,
        path: hasGeneratedPage(`services/${service.slug}`) ? `/services/${service.slug}` : `#${service.slug || "services"}`,
      })),
    areas: areas
      .map((area) => ({
        slug: area.slug,
        label: area.h2,
        description: area.body_content,
        path: hasGeneratedPage(`areas/${area.slug}`) ? `/areas/${area.slug}` : `#areas`,
      })),
  };
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
  // Same resolver as the brief. These were two chains that could disagree,
  // and a page printing one number in the body and another in the footer is
  // worse than a page printing none.
  const contact = resolveBusinessContact(scrapeResults, { phone: lead.phone, email: lead.email }, { forceFallback: lead.source === "outreach" || lead.source === "manual" });
  const phone = displayPhone(contact.phone);
  const intent = conversionIntentFor(lead.industry, Boolean(phone));

  return {
    businessName,
    industry: lead.industry || "Local Services",
    licensedInsured: findLicenseInsuranceMention(facts),
    primaryAction: intent.primary,
    primaryActionLabel: intent.primaryLabel,
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
    navigation,
    locationServices,
    faq,
    trustStrip,
    expertise,
    ctaBanner,
    process,
    audienceSegments,
    certifications,
    // Only highlight positive, authentic reviews (4+ stars). A negative complaint
    // or bug report from Google should never be published on a sales redesign.
    reviews: ((facts.reviews as { author_name: string; rating: number; text: string }[]) ?? [])
      .filter((r) => r.text && r.text.trim().length > 0 && (typeof r.rating !== "number" || r.rating >= 4))
      .slice(0, 8),
    nap: {
      phone,
      email: contact.email,
      address: contact.address,
    },
    socialUrls: (facts.social_urls as string[]) ?? [],
    googleReviewsUrl: lead.place_id
      ? `https://search.google.com/local/reviews?placeid=${lead.place_id}`
      : null,
    brandColorHsl: (facts.brand_color_hsl as string) ?? null,
    // Both through the shared resolver. The nav logo read facts.logo_url
    // directly, which is the SCRAPED logo — so a logo replaced in the Studio
    // was still the old one in the header of the delivered site.
    logoUrl: resolveLogoUrl(artifact.extracted_assets as Record<string, unknown> | null, facts),
    footerLogoUrl: resolveFooterLogoUrl(artifact.extracted_assets as Record<string, unknown> | null, facts),
    // Keep the delivered system visually consistent. Client fonts are useful
    // as research signals, but arbitrary scraped font imports made pages feel
    // inconsistent and occasionally broke the intended hierarchy.
    fontFamily: null,
    fontStylesheetUrl: null,
    innerPagesBuilt: artifact.inner_pages_built,
    fullSiteBuilt: (artifact.generation_phase ?? 0) >= 2,
    leadSlug: lead.slug,
    bespokeHomepageHtml: artifact.bespoke_homepage_html,
    bespokeCss: artifact.bespoke_css ?? null,
    bespokeChromeHtml: artifact.bespoke_chrome_html ?? null,
    bespokeFooterHtml: artifact.bespoke_footer_html ?? null,
    designTokens: artifact.design_tokens ?? null,
    bespokePages: artifact.bespoke_pages ?? {},
    // Leads generated before chrome was part of the design system fall back
    // to the house archetype rather than rendering no header at all.
    chromeSpec: (artifact.chrome_spec as ChromeSpec | null) ?? DEFAULT_CHROME,
    bespokeRationale: artifact.bespoke_rationale,
  };
}
