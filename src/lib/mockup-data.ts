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

export function unescapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  let res = str;
  // Multiple passes to safely decode double-encoded entities
  for (let i = 0; i < 3; i++) {
    const next = res
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&mdash;/gi, " ")
      .replace(/&ndash;/gi, " ")
      .replace(/&#8212;/g, " ")
      .replace(/&#8211;/g, " ")
      .replace(/&nbsp;/gi, " ")
      .trim();
    if (next === res) break;
    res = next;
  }
  return res.replace(/^[—–-]\s*/, "").trim();
}

/**
 * Decorative SVG is not copy.
 *
 * The generated About section carries a circular "seal" whose <textPath>
 * repeats the town and trade twice so the text meets itself around the ring.
 * Tag-stripping that alongside the real prose put "CHEYENNE, WY · TRUSTED
 * LOCAL TRADE · CHEYENNE, WY · TRUSTED LOCAL TRADE ·" on the front of the
 * client's own about copy in the portal.
 */
function stripDecorative(html: string): string {
  return html.replace(/<svg[\s\S]*?<\/svg>/gi, " ");
}

/**
 * Tag-stripped text that keeps its paragraph breaks.
 *
 * Collapsing every whitespace run flattened a four-paragraph company story
 * into a single unreadable block in the proposal.
 */
function cleanCopy(html: string): string {
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ");
  return unescapeHtml(
    text
      .replace(/[^\S\n]+/g, " ")       // spaces and tabs, never newlines
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
  ).trim();
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
    heroOffsetY?: number;
    aboutOffsetY?: number;
  } | undefined) ?? {};

  const bespokeHtml = artifact?.bespoke_homepage_html || payload?.bespokeHomepageHtml || null;
  const bespokeCss = artifact?.bespoke_css || payload?.bespokeCss || null;

  const businessName = unescapeHtml(lead.business_name || (facts?.business_name as string) || payload?.businessName || lead.slug);
  // The primary service area, not `town`. The crawler's `town` is a single
  // guess and it gets this wrong — Saddle Roofing, whose every page says
  // Cheyenne, came back as "Stuart", so the proposal told a Wyoming roofer we
  // were serving a town they do not work in. The first derived area is what
  // the built site itself leads with, so the two agree by construction.
  const derivedAreas = ((facts?.derived_areas as string[] | undefined) ?? []).filter(
    (area) => typeof area === "string" && area.trim().length > 0
  );
  const city = unescapeHtml(
    derivedAreas[0] || (facts?.town as string) || (facts?.city as string) || (extracted?.city as string) || ""
  );
  const trade = unescapeHtml(lead.industry || (facts?.industry as string) || (extracted?.industry as string) || payload?.services?.[0]?.h2 || "Restoration Contractor");

  // Prioritize compiled design tokens from the bespoke website
  const tokenVars = ((artifact?.design_tokens as { vars?: Record<string, string> })?.vars) || {};
  const primaryToken = tokenVars["--bs-primary"];
  const accentToken = tokenVars["--bs-accent"];
  const onPrimaryToken = tokenVars["--bs-on-primary"];
  const invertSurfaceToken = tokenVars["--bs-invert-surface"];

  const brandColorHex =
    primaryToken ||
    (facts?.brand_color_hex as string) ||
    (extracted?.brand_color_hex as string) ||
    payload?.brandColorHsl ||
    "#FFD974";

  const rating = (facts?.rating as number) || (payload?.proof?.rating as number) || 4.9;
  const reviewCount = (facts?.review_count as number) || (payload?.proof?.reviewCount as number) || 109;
  // Null rather than 15. This is printed on a proposal a stranger reads as a
  // claim about their own business; a default is a fabrication, and a fact we
  // cannot source is one we do not show.
  const yearsExperience = (facts?.years_in_business as number) || null;
  // The built page already names the founders correctly in its badge, and it
  // is the name the client will read on their own site. `lead.contact_name`
  // is whoever was typed in at intake — "Tony" where the business is run by
  // "Tony & Hannah Ostheimer" — so it is the last resort, not the first.
  const badgeFounder = bespokeHtml
    ?.match(/<div class="bs-founder-badge__name">\s*<strong>([\s\S]*?)<\/strong>/i)?.[1]
    ?.replace(/<[^>]+>/g, "")
    .trim();
  const rawFounderName =
    badgeFounder || (facts?.founder_name as string) || (extracted?.founder_name as string) || lead.contact_name || "Leadership Team";
  const founderName = unescapeHtml(rawFounderName.length > 40 ? "Leadership Team" : rawFounderName);
  const founderTitle = founderName !== "Leadership Team" ? "Founder & Owner" : ("Team at " + businessName);

  const phone =
    ((facts.nap as { phones?: string[] })?.phones ?? []).find((p) => /\d{7,}/.test(p.replace(/\D/g, ""))) ||
    payload?.nap?.phone ||
    lead.phone ||
    "(702) 213-5972";

  // 1. Extract Copy & Imagery Directly from the Homepage About Section
  let extractedAboutEyebrow: string | null = null;
  let extractedAboutHeadline: string | null = null;
  let extractedAboutBody: string | null = null;
  let extractedHeroHeadline: string | null = null;

  if (bespokeHtml) {
    // Hero Headline from Homepage H1
    const h1Match = bespokeHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
      const cleanH1 = unescapeHtml(h1Match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " "));
      if (cleanH1) extractedHeroHeadline = cleanH1;
    }

    // Exact About Section from Homepage
    const aboutSectionMatch =
      bespokeHtml.match(/<section[^>]*(?:id=["']about["']|class=["'][^"']*about[^"']*["'])[^>]*>([\s\S]*?)<\/section>/i) ||
      bespokeHtml.match(/<div[^>]*(?:id=["']about["']|class=["'][^"']*about[^"']*["'])[^>]*>([\s\S]*?)<\/div>/i);

    if (aboutSectionMatch) {
      const aboutContent = stripDecorative(aboutSectionMatch[1]);

      // Extract About eyebrow (strip any leading dashes or em-dashes and unescape)
      const eyebrowMatch =
        aboutContent.match(/<span[^>]*(?:class=["'][^"']*(?:eyebrow|subtitle|label|tag)[^"']*["'])[^>]*>([\s\S]*?)<\/span>/i) ||
        aboutContent.match(/<p[^>]*(?:class=["'][^"']*(?:eyebrow|subtitle|label|tag)[^"']*["'])[^>]*>([\s\S]*?)<\/p>/i);
      if (eyebrowMatch) {
        const cleanE = unescapeHtml(eyebrowMatch[1].replace(/<[^>]+>/g, ""));
        if (cleanE) extractedAboutEyebrow = cleanE;
      }

      // Extract About heading (h2 / h3 / h4)
      const hMatch = aboutContent.match(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/i);
      if (hMatch) {
        const cleanH = unescapeHtml(hMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " "));
        if (cleanH) extractedAboutHeadline = cleanH;
      }

      // Extract only clean narrative body paragraphs (exclude captions, badge text, short snippets)
      const pMatches = Array.from(aboutContent.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi));
      const validParagraphs = pMatches
        .map((m) => cleanCopy(m[1]))
        .filter((p) => p.length >= 45 && !p.toLowerCase().startsWith("about ") && !p.toLowerCase().startsWith("every item is carefully packed") && !p.toLowerCase().includes("complete insurance claim support"));

      if (validParagraphs.length > 0) {
        extractedAboutBody = validParagraphs[0];
      }
    }
  }

  // Also check artifact bespoke_sections if available
  if ((!extractedAboutHeadline || !extractedAboutBody) && Array.isArray(artifact?.bespoke_sections)) {
    const aboutSec = artifact.bespoke_sections.find((s) => s.id === "about" || s.kind === "about");
    if (aboutSec?.html) {
      const aboutSecHtml = stripDecorative(aboutSec.html);
      if (!extractedAboutHeadline) {
        const hMatch = aboutSecHtml.match(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/i);
        if (hMatch) extractedAboutHeadline = unescapeHtml(hMatch[1].replace(/<[^>]+>/g, ""));
      }

      if (!extractedAboutBody) {
        const pMatches = Array.from(aboutSecHtml.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi));
        const validParagraphs = pMatches
          .map((m) => cleanCopy(m[1]))
          .filter((p) => p.length >= 45 && !p.toLowerCase().includes("every item is carefully packed"));
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
    unescapeHtml(copyPlan.headline) ||
    unescapeHtml(payload?.headline) ||
    ("PREMIER " + trade.toUpperCase() + " IN " + city.toUpperCase());

  const aboutHeadline =
    extractedAboutHeadline ||
    unescapeHtml(copyPlanAbout?.heading) ||
    ("A real name & dedicated team behind every project in " + city);

  const aboutEyebrow =
    extractedAboutEyebrow ||
    ("ABOUT " + businessName.toUpperCase());

  const aboutBody =
    extractedAboutBody ||
    unescapeHtml(copyPlanAbout?.body) ||
    unescapeHtml(payload?.differentiator) ||
    ("When disaster strikes your property, you need accountable local professionals who arrive fast. " + businessName + " provides a trusted single point of contact from first assessment to final repairs across " + city + ".");

  const previewUrl = "/s/" + lead.slug + "?view=preview";

  const headlineMode: MockupHeadlineMode =
    savedMockup.headlineMode || (isPaid ? "launched" : "proposed");

  const themeId = savedMockup.themeId || "brand";

  return {
    businessName,
    city,
    trade,
    brandColor: brandColorHex,
    accentColor: accentToken || null,
    onPrimaryColor: onPrimaryToken || null,
    invertSurface: invertSurfaceToken || null,
    logoUrl: (extracted?.logo_url as string) || (facts?.logo_url as string) || payload?.logoUrl || null,
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
    // Defaults that suit a typical build; the operator nudges from here.
    heroOffsetY: typeof savedMockup.heroOffsetY === "number" ? savedMockup.heroOffsetY : -20,
    aboutOffsetY: typeof savedMockup.aboutOffsetY === "number" ? savedMockup.aboutOffsetY : -80,
    aboutImageUrl:
      ((artifact?.media_plan as Array<{ slot: string; url: string }>) || []).find(
        (m) => m.slot === "about" || m.slot === "team" || m.slot === "service-0"
      )?.url ||
      (extracted?.about_image_url as string) ||
      (facts?.about_image_url as string) ||
      (extracted?.cutout_url as string) ||
      (extracted?.hero_cutout as string) ||
      null,
  };
}
