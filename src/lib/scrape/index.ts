import { fetchSiteHtml } from "@/lib/scrape/fetch-site";
import { extractPhotos } from "@/lib/scrape/extract-photos";
import { extractPageInventory, extractContactInfoFromPage, deriveSiteName } from "@/lib/scrape/extract-text";
import { extractExistingSchema } from "@/lib/scrape/extract-schema";
import { extractLogoColor } from "@/lib/scrape/extract-logo-color";
import { extractFont } from "@/lib/scrape/extract-font";
import { rankPhotoQuality, type RankedPhoto } from "@/lib/scrape/rank-photos";
import { captionUnlabeledPhotos } from "@/lib/scrape/caption-photos";
import { callPlacesApi, resolvePlacesPhotoUrl } from "@/lib/google/places";
import { callPagespeedApi } from "@/lib/google/pagespeed";
import { createAdminClient } from "@/lib/supabase/admin";

// ScrapeBusiness molecule — fetch_site_html + call_places_api +
// call_pagespeed_api + extract_photos + extract_logo_color + fetch_gbp_photos
// -> one complete scrape_results row (plan §4/§5). Everything downstream
// (playbook detection, section generation, the photo waterfall) reads only
// from the resulting facts blob — nothing here writes to artifacts directly.
export async function scrapeBusiness(leadId: string, sourceUrl: string, businessNameHint?: string) {
  const pages = await fetchSiteHtml(sourceUrl);
  const homepage = pages[0];

  const photoCandidates = pages.flatMap(extractPhotos);
  const rankedSitePhotos: RankedPhoto[] = await rankPhotoQuality(photoCandidates);
  const captionedSitePhotos = await captionUnlabeledPhotos(rankedSitePhotos);

  const pageInventory = pages.map(extractPageInventory);
  const contactInfo = homepage ? extractContactInfoFromPage(homepage) : { phones: [], emails: [], socialUrls: [] };
  const existingSchema = homepage ? extractExistingSchema(homepage) : [];
  const logoColor = homepage ? extractLogoColor(homepage) : { logoUrl: null, brandColorHex: null, brandColorHsl: null };
  const font = homepage ? extractFont(homepage) : { googleFontFamily: null, googleFontStylesheetUrl: null };

  // The site's own declared name (from its <title>) is a far more reliable
  // Places query than businessNameHint — for real leads that's the intake
  // form's "name" field, i.e. the submitter's own contact name, not a
  // business name, and using it here matched Places to unrelated people.
  const siteName = deriveSiteName(pageInventory[0]?.title ?? null);
  const places = await callPlacesApi(siteName ?? new URL(sourceUrl).hostname, contactInfo.phones[0]);
  const gbpPhotoUrls = (places?.photo_refs ?? [])
    .map((ref) => resolvePlacesPhotoUrl(ref))
    .filter((url): url is string => !!url);

  const pagespeed = await callPagespeedApi(sourceUrl);

  const facts = {
    business_name: places?.name ?? siteName ?? businessNameHint ?? null,
    source_url: sourceUrl,
    pages: pageInventory,
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
    logo_url: logoColor.logoUrl,
    brand_color_hex: logoColor.brandColorHex,
    brand_color_hsl: logoColor.brandColorHsl,
    font,
    site_photos: captionedSitePhotos.slice(0, 30),
    gbp_photo_urls: gbpPhotoUrls,
    pagespeed: { mobile: pagespeed.mobile, desktop: pagespeed.desktop },
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

  return data;
}
