import { fetchSiteHtml, type FetchedPage } from "@/lib/scrape/fetch-site";
import { extractPhotos } from "@/lib/scrape/extract-photos";
import { extractSiteVideo } from "@/lib/scrape/extract-video";
import { isHotlinkSafe } from "@/lib/scrape/check-hotlink-safety";
import { extractPageInventory, extractContactInfoFromPage, deriveSiteName } from "@/lib/scrape/extract-text";
import { extractExistingSchema } from "@/lib/scrape/extract-schema";
import { extractLogoColor } from "@/lib/scrape/extract-logo-color";
import { extractFont } from "@/lib/scrape/extract-font";
import { rankPhotoQuality, type RankedPhoto } from "@/lib/scrape/rank-photos";
import { captionUnlabeledPhotos } from "@/lib/scrape/caption-photos";
import { callPlacesApi, resolvePlacesPhotoUrl } from "@/lib/google/places";
import { callPagespeedApi } from "@/lib/google/pagespeed";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeWithFirecrawl, crawlWithFirecrawl, mapWithFirecrawl } from "@/lib/scrape/firecrawl";
import { deriveBriefFromUrls } from "@/lib/scrape/services-from-urls";

export type ScrapeDepth = "light" | "deep";

/**
 * @param depth "light" maps the site's URLs and reads the homepage — two
 * Firecrawl credits, and enough to name the real services from the sitemap.
 * "deep" crawls real pages and costs one credit each; it is an explicit
 * operator choice for a lead worth the spend, never the default. Paying
 * thirty credits per lead before anyone has looked at it is how a spam lead
 * costs money.
 */
export async function scrapeBusiness(
  leadId: string,
  sourceUrl: string,
  businessNameHint?: string,
  depth: ScrapeDepth = "light"
) {
  // Firecrawl executes JavaScript; a plain fetch does not. Most small
  // business sites render their navigation and service content client-side,
  // so raw HTML is an empty shell -- the York lead came back with one page
  // and zero nav links, which left the brief with no services and the
  // generated site with nothing real to say. Crawling is also what the page
  // budget is for: thirty real pages instead of one shell.
  const [siteUrls, crawled, firecrawlData] = await Promise.all([
    mapWithFirecrawl(sourceUrl),
    depth === "deep" ? crawlWithFirecrawl(sourceUrl, { limit: 25 }) : Promise.resolve([]),
    scrapeWithFirecrawl(sourceUrl),
  ]);

  // The URL structure carries most of what the brief needs. A path like
  // /services/panel-upgrades names a real service as reliably as crawling
  // that page would, for one credit instead of thirty.
  const urlBrief = deriveBriefFromUrls(siteUrls);

  // Direct fetching is the fallback when Firecrawl is unavailable, so a
  // missing key degrades rather than breaks. It does not execute JavaScript,
  // which is why it is no longer the primary path.
  const pages: FetchedPage[] =
    crawled.length > 0
      ? crawled.map((page) => ({ url: page.url, html: page.html }))
      : await fetchSiteHtml(sourceUrl, depth === "deep" ? 15 : 1);

  const homepage = pages[0];
  const photoCandidates = pages.flatMap(extractPhotos);
  const rankedSitePhotos: RankedPhoto[] = await rankPhotoQuality(photoCandidates);
  const captionedSitePhotos = await captionUnlabeledPhotos(rankedSitePhotos);

  const rawSiteVideo = extractSiteVideo(pages);
  const siteVideo = rawSiteVideo && (await isHotlinkSafe(rawSiteVideo.url, "video/")) ? rawSiteVideo : null;

  const pageInventory = pages.map(extractPageInventory);
  const contactInfo = homepage ? extractContactInfoFromPage(homepage) : { phones: [], emails: [], socialUrls: [] };
  const existingSchema = homepage ? extractExistingSchema(homepage) : [];
  const logoColor = homepage ? extractLogoColor(homepage) : { logoUrl: null, brandColorHex: null, brandColorHsl: null };
  const font = homepage ? extractFont(homepage) : { googleFontFamily: null, googleFontStylesheetUrl: null };

  const siteName = deriveSiteName(pageInventory[0]?.title ?? null) || firecrawlData?.title;
  const places = await callPlacesApi(siteName ?? new URL(sourceUrl).hostname, contactInfo.phones[0]);
  const gbpPhotoUrls = (places?.photo_refs ?? [])
    .map((ref) => resolvePlacesPhotoUrl(ref))
    .filter((url): url is string => !!url);

  const pagespeed = await callPagespeedApi(sourceUrl);

  // Extract Firecrawl branding colors or fallback to logoColor
  const fcBranding = firecrawlData?.branding || {};
  const fcColors = fcBranding.colors || {};
  const primaryHex = fcColors.primary || logoColor.brandColorHex || "#533AFD";
  const accentHex = fcColors.accent || "#FFD12D";
  const logoUrl = fcBranding.images?.logo || logoColor.logoUrl || null;

  const facts = {
    business_name: places?.name ?? siteName ?? businessNameHint ?? null,
    source_url: sourceUrl,
    pages: pageInventory,
    // Read off the sitemap rather than crawled page content, so the brief is
    // populated even on a light scrape.
    sitemap_urls: siteUrls.slice(0, 200),
    derived_services: urlBrief.services,
    derived_areas: urlBrief.areas,
    notable_pages: urlBrief.notablePages,
    scrape_depth: depth,
    nap: {
      phones: Array.from(new Set([...contactInfo.phones, ...(places?.phone ? [places.phone] : [])])),
      emails: contactInfo.emails,
      address: places?.formatted_address ?? null,
    },
    town: places?.formatted_address?.split(",").slice(-3, -2)[0]?.trim() ?? null,
    social_urls: contactInfo.socialUrls,
    existing_schema: existingSchema,
    hours: places?.weekday_hours ?? null,
    rating: places?.rating ?? null,
    review_count: places?.review_count ?? null,
    reviews: places?.reviews ?? [],
    business_status: places?.business_status ?? null,
    types: places?.types ?? [],
    logo_url: logoUrl,
    brand_color_hex: primaryHex,
    brand_color_hsl: logoColor.brandColorHsl,
    colors: {
      primary: primaryHex,
      accent: accentHex,
      secondary: fcColors.secondary || "#0D1738",
    },
    branding: fcBranding,
    font,
    site_photos: captionedSitePhotos.slice(0, 30),
    site_video: siteVideo,
    gbp_photo_urls: gbpPhotoUrls,
    pagespeed: { mobile: pagespeed.mobile, desktop: pagespeed.desktop },
    markdown: firecrawlData?.markdown || "",
  };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scrape_results")
    .upsert(
      {
        lead_id: leadId,
        facts,
        pagespeed_mobile: pagespeed.mobile,
        pagespeed_desktop: pagespeed.desktop,
        places_raw: places,
      },
      { onConflict: "lead_id" }
    )
    .select()
    .single();

  if (error) throw new Error(`scrapeBusiness: failed to save scrape_results — ${error.message}`);

  if (places?.place_id) {
    await admin.from("leads").update({ place_id: places.place_id }).eq("id", leadId);
  }

  // Update lead business_name and artifacts if empty
  if (facts.business_name) {
    await admin.from("leads").update({ business_name: facts.business_name }).eq("id", leadId).is("business_name", null);
  }

  return { id: data.id, facts };
}
