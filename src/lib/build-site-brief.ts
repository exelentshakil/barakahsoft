import type { VerticalProfile } from "@/lib/verticals/types";
import { slugifyText } from "@/lib/slug";
import { buildRichContext, findRelevantPage } from "@/lib/facts-context";
import { extractServiceAreas } from "@/lib/scrape/extract-service-areas";
import { displayPhone } from "@/lib/phone";
import { findLicenseInsuranceMention } from "@/lib/trust-signals";
import { conversionIntentFor, painPointInstructions } from "@/lib/conversion-intent";
import type { SiteBrief } from "@/lib/generate-bespoke-site";
import type { PageInventory } from "@/lib/scrape/extract-text";
import type { Lead, ScrapeResults } from "@/types/database";
import { resolveBusinessContact } from "@/lib/business-contact";
import { cleanAboutContent } from "@/lib/clean-about-content";

// Assembles the single source of truth a generation runs against.
//
// The operator can override any field from the Studio, but every default
// here is a REAL value pulled from this lead's own scrape. Nothing in this
// module invents a fallback: a missing phone stays null and the generator
// is told there is no phone, rather than being handed a placeholder that
// would ship to a client as if it were theirs. (The route this replaced
// defaulted to a hardcoded phone number and a hardcoded electrician
// service list, which is precisely how unrelated businesses ended up with
// the same "bespoke" page.)

export interface BriefOverrides {
  businessName?: string;
  industry?: string;
  city?: string;
  founder?: string;
  phone?: string;
  email?: string;
  services?: string[];
  areas?: string[];
  heroImage?: string;
  aboutContent?: string;
  /** Operator-entered Facebook proof. Facebook's counts sit behind a login
   *  wall, so they cannot be scraped — but the operator can read them off the
   *  client's page and type them in. */
  facebookRating?: number | null;
  facebookReviewCount?: number | null;
  /** Advances this lead off a composition another lead already holds. */
  layoutSalt?: number | null;
  /** Operator-entered accreditations. Never inferred — see SiteBrief. */
  certifications?: string[];
}

/**
 * Routes that exist for a lead, so generated links always resolve.
 *
 * Phase 1 only knows about the sellable core. Passing phase 2's routes
 * before they are built would let the homepage link at pages that 404
 * during the exact window the client is evaluating the work.
 */
export function buildKnownPaths(
  services: string[],
  areas: string[],
  nouns: VerticalProfile["nouns"],
  extras: { locationServices?: { service: string; area: string }[] } = {}
): string[] {
  return [
    "/",
    ...services.map((s) => `/${nouns.offeringPath}/${slugifyText(s)}`),
    ...areas.map((a) => `/${nouns.areaPath}/${slugifyText(a)}`),
    ...(extras.locationServices ?? []).map((p) => `/locations/${slugifyText(`${p.service}-${p.area}`)}`),
    "/about",
    "/faq",
    "/contact",
    "/privacy",
    "/terms",
  ];
}

function realPhotos(facts: Record<string, unknown>): string[] {
  const sitePhotos = (facts.site_photos as { url: string }[] | undefined) ?? [];
  const gbpPhotos = (facts.gbp_photo_urls as string[] | undefined) ?? [];
  const all = [...sitePhotos.map((p) => p.url), ...gbpPhotos].filter(
    (u): u is string => typeof u === "string" && /^https?:\/\//i.test(u)
  );
  return Array.from(new Set(all)).slice(0, 24);
}

/**
 * Nav links are the most reliable real signal for a business's own service
 * names, but they also carry the boilerplate every site has. Filtering that
 * out here keeps "Privacy Policy" from being generated as a service page.
 */
const NAV_BOILERPLATE = /^(home|blog|contact|about|about us|privacy|privacy policy|terms|terms of service|sitemap|careers|login|search|reviews|gallery|faq|faqs|news)$/i;

export function servicesFromFacts(facts: Record<string, unknown>): string[] {
  // Sitemap-derived names come from the site's own URL structure and are the
  // most reliable signal available — and on a light scrape they are the only
  // one, since only the homepage was read.
  const derived = (facts.derived_services as string[] | undefined) ?? [];
  if (derived.length >= 3) return derived.slice(0, 8);

  const pages = (facts.pages as PageInventory[] | undefined) ?? [];
  const fromNav = pages.flatMap((p) => p.navLinks.map((l) => l.text.trim()));
  const fromLists = pages.flatMap((p) => p.listItemCandidates ?? []);

  const candidates = [...fromNav, ...fromLists]
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 3 && s.length < 48 && !NAV_BOILERPLATE.test(s))
    // A real service name is a noun phrase, not a sentence or a CTA.
    .filter((s) => !/[.!?]$/.test(s) && s.split(" ").length <= 6);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const c of candidates) {
    const key = c.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(c);
  }
  return unique.slice(0, 8);
}

function cityFromFacts(facts: Record<string, unknown>): string | null {
  if (typeof facts.town === "string" && facts.town.trim()) return facts.town.trim();
  const address = (facts.nap as { address?: string } | undefined)?.address;
  if (!address) return null;
  // "123 Main St, Brooklyn, NY 11201" -> "Brooklyn, NY"
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) return `${parts[parts.length - 3]}, ${parts[parts.length - 2].split(" ")[0]}`;
  return parts[parts.length - 2] ?? null;
}

export function buildSiteBrief(
  lead: Lead,
  scrapeResults: ScrapeResults,
  vertical: VerticalProfile,
  overrides: BriefOverrides = {}
): SiteBrief {
  const facts = (scrapeResults.facts ?? {}) as Record<string, unknown>;
  const pages = (facts.pages as PageInventory[] | undefined) ?? [];
  const nap = (facts.nap as { phones?: string[]; emails?: string[] } | undefined) ?? {};

  const contact = resolveBusinessContact(scrapeResults, { phone: lead.phone, email: lead.email }, { forceFallback: lead.source === "outreach" || lead.source === "manual" });

  const services = overrides.services?.filter(Boolean).length
    ? overrides.services.filter(Boolean)
    : servicesFromFacts(facts);

  const derivedAreas = (facts.derived_areas as string[] | undefined) ?? [];
  const areas = overrides.areas?.filter(Boolean).length
    ? overrides.areas.filter(Boolean)
    : derivedAreas.length > 0
      ? derivedAreas.slice(0, 12)
      : extractServiceAreas(pages).slice(0, 12);

  const rawPhotos = realPhotos(facts);
  const heroImage = overrides.heroImage || rawPhotos[0] || null;
  const photos = Array.from(
    new Set([
      ...(heroImage ? [heroImage] : []),
      ...rawPhotos,
    ])
  ).filter((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u));

  const rating = typeof facts.rating === "number" ? facts.rating : null;
  const reviewCount = typeof facts.review_count === "number" ? facts.review_count : null;

  const reviews = ((facts.reviews as {
    author_name: string;
    rating: number;
    text: string;
    profile_photo_url?: string | null;
    relative_time_description?: string | null;
  }[] | undefined) ?? [])
    .filter((r) => r?.text && r.text.trim().length > 20 && (typeof r.rating !== "number" || r.rating >= 4))
    .slice(0, 8)
    .map((r) => ({
      author: r.author_name,
      rating: r.rating || 5,
      text: r.text.trim(),
      avatar: typeof r.profile_photo_url === "string" && /^https:\/\//.test(r.profile_photo_url) ? r.profile_photo_url : null,
      when: typeof r.relative_time_description === "string" ? r.relative_time_description : null,
    }));

  return {
    vertical,
    businessName:
      overrides.businessName?.trim() ||
      (typeof facts.business_name === "string" ? facts.business_name : "") ||
      lead.business_name ||
      new URL(lead.source_url).hostname.replace(/^www\./, ""),
    industry: overrides.industry?.trim() || lead.industry || "Local Services",
    city: overrides.city?.trim() || cityFromFacts(facts) || "the local area",
    founder: overrides.founder?.trim() || lead.contact_name || null,
    phone: displayPhone(overrides.phone?.trim() || contact.phone),
    email: overrides.email?.trim() || contact.email,
    // Cleaned HERE, at the source, rather than in the one consumer that
    // remembered to call it. Every other reader of aboutContent — the section
    // renderer, the design-system prompt, the site plan, the no-model fallback
    // — was being handed raw scraped markdown, which is how "### Who we are
    // [Read more](https://...)" ended up rendered on a client's about section.
    aboutContent:
      cleanAboutContent(overrides.aboutContent?.trim() || (typeof facts.about_content === "string" ? facts.about_content : null)) || null,
    services,
    areas,
    rating,
    reviewCount,
    reviews,
    photos,
    // Places gives us the place_id, so the "read all reviews" link goes to
    // their real review list rather than a search that might land anywhere.
    googleReviewUrl: lead.place_id ? `https://search.google.com/local/reviews?placeid=${lead.place_id}` : null,
    facebookRating: overrides.facebookRating ?? null,
    facebookReviewCount: overrides.facebookReviewCount ?? null,
    layoutSalt: overrides.layoutSalt ?? 0,
    geo: (() => {
      const loc = (scrapeResults.places_raw as { geometry?: { location?: { lat?: number; lng?: number } } } | null)
        ?.geometry?.location;
      return typeof loc?.lat === "number" && typeof loc?.lng === "number" ? { lat: loc.lat, lng: loc.lng } : null;
    })(),
    address:
      (scrapeResults.places_raw as { formatted_address?: string } | null)?.formatted_address ??
      ((facts.nap as { address?: string } | undefined)?.address ?? null),
    regionHint: (() => {
      // "4585 WY-22, Wilson, WY 83014, USA" -> "WY, USA"
      const address = (scrapeResults.places_raw as { formatted_address?: string } | null)?.formatted_address;
      if (!address) return null;
      const parts = address.split(",").map((x) => x.trim()).filter(Boolean);
      if (parts.length < 2) return null;
      const country = parts[parts.length - 1];
      const state = (parts[parts.length - 2] ?? "").replace(/\s*\d{4,}\s*$/, "").trim();
      return state ? `${state}, ${country}` : country;
    })(),
    certifications: (overrides.certifications ?? (facts?.certifications as string[] | undefined) ?? [])
      .filter((name): name is string => typeof name === "string" && name.trim().length > 0)
      .slice(0, 3),
    socials: ((facts.social_urls as string[] | undefined) ?? [])
      .filter((url) => /^https?:\/\//i.test(url))
      .slice(0, 6),
    heroImage,
    factsDigest: buildRichContext(facts, { relevantPage: findRelevantPage(facts), maxChars: 5000 }),
    licensedInsured: findLicenseInsuranceMention(facts),
    leadSlug: lead.slug,
    // The complaints the owner ticked on the intake form. These never
    // reached generation before, so the rebuilt page had no idea what the
    // client actually wanted fixed.
    painInstructions: painPointInstructions(lead.pain_points),
    intent: conversionIntentFor(
      overrides.industry?.trim() || lead.industry,
      !!(overrides.phone?.trim() || nap.phones?.[0] || lead.phone),
      vertical
    ),
  };
}

/** Blocking problems that would make a generation produce a thin, generic page. */
export function briefReadiness(brief: SiteBrief): { ready: boolean; warnings: string[] } {
  const warnings: string[] = [];
  if (brief.services.length < 3) warnings.push(`Only ${brief.services.length} real services found — add more in the brief or the page will be thin.`);
  if (!brief.phone) warnings.push("No real phone number found — call-to-action buttons will have nothing to dial.");
  if (brief.photos.length === 0) warnings.push("No real photos found — the page will be built from type and color only.");
  if (brief.factsDigest.length < 800) warnings.push("Very little real content was scraped — consider re-scraping before generating.");
  if (brief.city === "the local area") warnings.push("No real city detected — set one in the brief for local headlines.");
  return { ready: brief.services.length >= 2, warnings };
}

/**
 * The services a lead's scrape found, for vertical matching.
 *
 * The router tests a profile's patterns against the business's own service
 * names as well as its industry, because "bridal bouquets" identifies a
 * florist more reliably than an industry string that came back "retail".
 */
export function servicesForMatching(scrapeResults: ScrapeResults | null): string[] {
  if (!scrapeResults) return [];
  return servicesFromFacts((scrapeResults.facts ?? {}) as Record<string, unknown>);
}
