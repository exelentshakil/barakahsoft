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
    heroCaptureUrl?: string;
    aboutCaptureUrl?: string;
  } | undefined) ?? {};

  const bespokeHtml = artifact?.bespoke_homepage_html || payload?.bespokeHomepageHtml || null;
  const bespokeCss = artifact?.bespoke_css || payload?.bespokeCss || null;

  const businessName = lead.business_name || (facts?.business_name as string) || payload?.businessName || lead.slug;
  const city = (facts?.town as string) || (facts?.city as string) || "";
  const trade = lead.industry || (facts?.industry as string) || payload?.services?.[0]?.h2 || "Home services";
  const brandColorHex =
    (facts?.brand_color_hex as string) ||
    (extracted?.brand_color_hex as string) ||
    payload?.brandColorHsl ||
    "#1b4d3e";

  const rating = (facts?.rating as number) || (payload?.proof?.rating as number) || null;
  const reviewCount = (facts?.review_count as number) || (payload?.proof?.reviewCount as number) || null;
  const yearsExperience = (facts?.years_in_business as number) || null;
  const founderName = (facts?.founder_name as string) || lead.contact_name || null;
  const founderTitle = founderName ? "Founder / Operator" : null;

  const phone =
    ((facts.nap as { phones?: string[] })?.phones ?? []).find((p) => /\d{7,}/.test(p.replace(/\D/g, ""))) ||
    payload?.nap?.phone ||
    lead.phone ||
    null;

  // 1. Extract Copy & Imagery Directly from the Homepage's About Section
  let extractedAboutEyebrow: string | null = null;
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

      // Extract About eyebrow
      const eyebrowMatch =
        aboutContent.match(/<span[^>]*(?:class=["'][^"']*(?:eyebrow|subtitle|label|tag)[^"']*["'])[^>]*>([\s\S]*?)<\/span>/i) ||
        aboutContent.match(/<p[^>]*(?:class=["'][^"']*(?:eyebrow|subtitle|label|tag)[^"']*["'])[^>]*>([\s\S]*?)<\/p>/i);
      if (eyebrowMatch) {
        const cleanE = eyebrowMatch[1].replace(/<[^>]+>/g, "").trim();
        if (cleanE) extractedAboutEyebrow = cleanE;
      }

      // Extract About heading (h2 / h3 / h4)
      const hMatch = aboutContent.match(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/i);
      if (hMatch) {
        const cleanH = hMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (cleanH) extractedAboutHeadline = cleanH;
      }

      // Extract all paragraphs and select the substantial narrative body text (skip short tags/subtitles < 30 chars)
      const pMatches = Array.from(aboutContent.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
      const validParagraphs = pMatches
        .map((m) => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
        .filter((p) => p.length >= 35 && !p.toLowerCase().startsWith("about ") && !p.toLowerCase().startsWith("who we are"));

      if (validParagraphs.length > 0) {
        extractedAboutBody = validParagraphs.slice(0, 2).join(" ");
      } else if (pMatches.length > 0) {
        extractedAboutBody = pMatches[0][1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      }
    }
  }

  // Also check artifact's bespoke_sections if available
  if ((!extractedAboutHeadline || !extractedAboutBody) && Array.isArray(artifact?.bespoke_sections)) {
    const aboutSec = artifact.bespoke_sections.find((s) => s.id === "about" || s.kind === "about");
    if (aboutSec?.html) {
      if (!extractedAboutHeadline) {
        const hMatch = aboutSec.html.match(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/i);
        if (hMatch) extractedAboutHeadline = hMatch[1].replace(/<[^>]+>/g, "").trim();
      }

      if (!extractedAboutBody) {
        const pMatches = Array.from(aboutSec.html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
        const validParagraphs = pMatches
          .map((m) => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
          .filter((p) => p.length >= 35);
        if (validParagraphs.length > 0) {
          extractedAboutBody = validParagraphs[0];
        }
      }
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
    `Meet the team behind ${businessName}.`;

  const aboutEyebrow =
    extractedAboutEyebrow ||
    `ABOUT ${businessName.toUpperCase()}`;

  const aboutBody =
    extractedAboutBody ||
    copyPlanAbout?.body ||
    payload?.differentiator ||
    `${businessName} is a licensed and insured ${trade.toLowerCase()} serving ${city}. The work covers premium craftsmanship, inspections, repairs and full replacements with verified customer satisfaction.`;

  const previewUrl = `/s/${lead.slug}?view=preview`;

  const headlineMode: MockupHeadlineMode =
    savedMockup.headlineMode || (isPaid ? "launched" : "proposed");

  const themeId = savedMockup.themeId || "olive";

  return {
    businessName,
    city,
    trade,
    brandColor: brandColorHex,
    logoUrl: null, // No logo needed per request
    rating,
    reviewCount,
    yearsExperience,
    founderName,
    founderTitle,
    aboutEyebrow,
    aboutHeadline,
    aboutBody,
    heroHeadline,
    phone,
    siteUrl: lead.source_url,
    previewUrl,
    headlineMode,
    themeId,
    bespokeHtml,
    bespokeCss,
    heroCaptureUrl: savedMockup.heroCaptureUrl || null,
    aboutCaptureUrl: savedMockup.aboutCaptureUrl || null,
  };
}
