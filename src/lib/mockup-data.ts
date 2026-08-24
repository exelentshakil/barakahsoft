import type { Lead, Artifact, ScrapeResults } from "@/types/database";
import type { SitePayload } from "@/components/site-shell/types";
import type { MockupData, MockupHeadlineMode } from "@/components/mockup/SocialLaunchMockup";

export interface ExtractMockupOptions {
  lead: Lead;
  artifact: Artifact | null;
  scrapeResults: ScrapeResults | null;
  facts?: Record<string, unknown> | null;
  payload?: SitePayload | null;
  isPaid?: boolean;
}

export function extractMockupData({
  lead,
  artifact,
  scrapeResults,
  facts: factsProp,
  payload,
  isPaid = false,
}: ExtractMockupOptions): MockupData {
  const facts = factsProp ?? (scrapeResults?.facts as Record<string, unknown> | null) ?? {};
  const extracted = (artifact?.extracted_assets as Record<string, unknown> | null) ?? {};
  const savedMockup = (extracted?.mockup as {
    themeId?: string;
    headlineMode?: MockupHeadlineMode;
    featuredPhotoUrl?: string;
  } | undefined) ?? {};

  const bespokeHtml = artifact?.bespoke_homepage_html || payload?.bespokeHomepageHtml || null;
  const bespokeCss = artifact?.bespoke_css || payload?.bespokeCss || null;

  const businessName = lead.business_name || (facts?.business_name as string) || payload?.businessName || lead.slug;
  const city = (facts?.town as string) || (facts?.city as string) || "New York";
  const trade = lead.industry || (facts?.industry as string) || payload?.services?.[0]?.h2 || "Contractor";
  const brandColorHex =
    (facts?.brand_color_hex as string) ||
    (extracted?.brand_color_hex as string) ||
    payload?.brandColorHsl ||
    "#1b4d3e";

  const logoUrl =
    (extracted?.branding as any)?.logo ||
    (facts?.logo_url as string) ||
    ((facts?.existing_schema as any)?.logo as string) ||
    payload?.logoUrl ||
    null;

  const rating = (facts?.rating as number) || (payload?.proof?.rating as number) || 5.0;
  const reviewCount = (facts?.review_count as number) || (payload?.proof?.reviewCount as number) || 100;
  const yearsExperience = (facts?.years_in_business as number) || 10;
  const founderName = (facts?.founder_name as string) || lead.contact_name || "Dan Martin";
  const founderTitle = "Founder / Operator";

  // 1. Extract Copy & Imagery Directly from the Homepage's About Section
  let extractedAboutImg: string | null = null;
  let extractedAboutHeadline: string | null = null;
  let extractedAboutBody: string | null = null;
  let extractedHeroHeadline: string | null = null;

  if (bespokeHtml) {
    // Hero Headline from Homepage H1
    const h1Match = bespokeHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
      const cleanH1 = h1Match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (cleanH1) extractedHeroHeadline = cleanH1;
    }

    // Exact About Section from Homepage
    const aboutSectionMatch =
      bespokeHtml.match(/<section[^>]*(?:id=["']about["']|class=["'][^"']*about[^"']*["'])[^>]*>([\s\S]*?)<\/section>/i) ||
      bespokeHtml.match(/<div[^>]*(?:id=["']about["']|class=["'][^"']*about[^"']*["'])[^>]*>([\s\S]*?)<\/div>/i);

    if (aboutSectionMatch) {
      const aboutContent = aboutSectionMatch[1];

      // Extract About image from the homepage section
      const imgMatch = aboutContent.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
      if (imgMatch && imgMatch[1] && !imgMatch[1].startsWith("data:image/svg") && !imgMatch[1].includes("icon")) {
        extractedAboutImg = imgMatch[1];
      }

      // Extract About heading (h2 / h3 / h4)
      const hMatch = aboutContent.match(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/i);
      if (hMatch) {
        const cleanH = hMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (cleanH) extractedAboutHeadline = cleanH;
      }

      // Extract About paragraph body
      const pMatch = aboutContent.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      if (pMatch) {
        const cleanP = pMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (cleanP) extractedAboutBody = cleanP;
      }
    }
  }

  // Also check artifact's bespoke_sections if available
  if (!extractedAboutHeadline && Array.isArray(artifact?.bespoke_sections)) {
    const aboutSec = artifact.bespoke_sections.find((s) => s.id === "about" || s.kind === "about");
    if (aboutSec?.html) {
      const imgMatch = aboutSec.html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
      if (imgMatch && imgMatch[1]) extractedAboutImg = imgMatch[1];

      const hMatch = aboutSec.html.match(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/i);
      if (hMatch) extractedAboutHeadline = hMatch[1].replace(/<[^>]+>/g, "").trim();

      const pMatch = aboutSec.html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      if (pMatch) extractedAboutBody = pMatch[1].replace(/<[^>]+>/g, "").trim();
    }
  }

  // Fallbacks from copy_plan and payload
  const copyPlan = (artifact?.copy_plan as any) ?? {};
  const copyPlanAbout = copyPlan.sections?.find((s: any) => s.id === "about");

  const heroHeadline =
    extractedHeroHeadline ||
    copyPlan.headline ||
    payload?.headline ||
    `PREMIER ${trade.toUpperCase()} IN ${city.toUpperCase()}`;

  const aboutHeadline =
    extractedAboutHeadline ||
    copyPlanAbout?.heading ||
    `A PASSION FOR ${trade.toUpperCase()} EXCELLENCE`;

  const aboutBody =
    extractedAboutBody ||
    copyPlanAbout?.body ||
    payload?.differentiator ||
    `Dedicated to providing premium ${trade.toLowerCase()} and expert craftsmanship across ${city} with verified customer satisfaction.`;

  // 2. Auto-Select the About / Team Photo
  const primaryAboutTeamPhoto =
    savedMockup.featuredPhotoUrl ||
    extractedAboutImg ||
    (extracted?.about_image_url as string) ||
    (facts?.founder_photo_url as string) ||
    (facts?.team_photo_url as string) ||
    null;

  const photos = (facts?.site_photos as { url?: string }[] | undefined) ?? [];
  const gbpPhotos = (facts?.gbp_photo_urls as string[] | undefined) ?? [];

  // Construct available photos list putting the About / Team photo FIRST
  const availablePhotos: string[] = Array.from(
    new Set(
      [
        primaryAboutTeamPhoto,
        extractedAboutImg,
        (facts?.founder_photo_url as string),
        extracted?.about_image_url as string,
        (facts?.team_photo_url as string),
        extracted?.hero_image_url as string,
        payload?.heroImageUrl,
        payload?.proof?.imageUrl,
        ...gbpPhotos,
        ...photos.map((p) => p.url).filter(Boolean),
        ...(payload?.services?.map((s) => s.imageUrl).filter(Boolean) as string[] ?? []),
      ].filter(Boolean) as string[]
    )
  );

  const currentFeaturedPhoto = primaryAboutTeamPhoto || availablePhotos[0] || null;

  const previewUrl = `/s/${lead.slug}?view=preview`;

  const headlineMode: MockupHeadlineMode =
    savedMockup.headlineMode || (isPaid ? "launched" : "proposed");

  const themeId = savedMockup.themeId || "olive";

  return {
    businessName,
    city,
    trade,
    brandColor: brandColorHex,
    logoUrl,
    rating,
    reviewCount,
    yearsExperience,
    founderName,
    founderTitle,
    aboutHeadline,
    aboutBody,
    heroHeadline,
    photoUrl: currentFeaturedPhoto,
    secondaryPhotoUrl: availablePhotos[1] || currentFeaturedPhoto,
    availablePhotos,
    siteUrl: lead.source_url,
    previewUrl,
    headlineMode,
    themeId,
    bespokeHtml,
    bespokeCss,
  };
}
