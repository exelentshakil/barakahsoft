import type { FunnelPageSection } from "@/types/database";
import type { ConversionAction } from "@/lib/conversion-intent";

// A funnel_pages entry with its media_asset_ids resolved to real Storage
// URLs — render-shell.ts does this once, generically, for every section.
export type ResolvedSection = FunnelPageSection & { imageUrl: string | null; imageUrls: string[] };

export interface SiteNavItem {
  slug: string;
  label: string;
  description: string;
  /** Route relative to the lead's site root. Present only for a substantive generated page. */
  path: string;
}

// The resolved props a template shell renders from — assembled once by
// render-shell.ts (render_shell atom) from an artifact + its scrape facts,
// so the shell components themselves never touch Supabase directly.
export interface SitePayload {
  businessName: string;
  primaryAction: ConversionAction;
  primaryActionLabel: string;
  headline: string;
  subhead: string;
  heroImageUrl: string | null;
  heroVideoUrl: string | null;
  proof: {
    rating: number | null;
    reviewCount: number | null;
    imageUrl: string | null;
  };
  differentiator: string;
  guarantee: string;
  services: ResolvedSection[];
  areas: ResolvedSection[];
  navigation: {
    services: SiteNavItem[];
    areas: SiteNavItem[];
  };
  // v3 (Phase L) — real service x area combination pages, only populated
  // once enrich-expand.ts has run and found real extractable area names.
  locationServices: ResolvedSection[];
  faq: FunnelPageSection[];
  // Phase E — each null unless real facts genuinely grounded it (never
  // rendered just to hit a section count).
  trustStrip: ResolvedSection | null;
  expertise: ResolvedSection | null;
  ctaBanner: ResolvedSection | null;
  process: ResolvedSection | null;
  audienceSegments: ResolvedSection | null;
  certifications: ResolvedSection | null;
  reviews: { author_name: string; rating: number; text: string }[];
  nap: {
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  socialUrls: string[];
  // Deep link to this business's real Google reviews. Null when no Places
  // match exists -- never fabricated, and the link simply does not render.
  googleReviewsUrl: string | null;
  brandColorHsl: string | null;
  logoUrl: string | null;
  footerLogoUrl?: string | null;
  fontFamily: string | null;
  fontStylesheetUrl: string | null;
  innerPagesBuilt: boolean;
  // Where this site's own routes live. Undefined here means /s/<slug>,
  // which is correct while we host it. The exported site is the root of its
  // own domain, so it sets "" and every chrome link resolves to /services/x
  // rather than /s/<slug>/services/x, which would 404 on their host.
  basePath?: string;
  /** Keep admin preview navigation inside website-preview mode. */
  previewMode?: boolean;
  // The exported site ships no privacy or terms routes -- we are not
  // putting words in a client's legal pages -- so the links are omitted
  // rather than left pointing at nothing.
  hideLegalLinks?: boolean;
  // v3 (Phase L) — whether enrich-expand.ts has finished for this lead.
  // Orthogonal to innerPagesBuilt (payment/indexability): about/faq/legal/
  // location pages need real expanded content to exist at all, regardless
  // of whether the site has gone live.
  fullSiteBuilt: boolean;
  leadSlug: string;
  // v8 -- real generated HTML for the homepage (Gemini, vision-informed by
  // real reference screenshots, sanitized before storage). Null falls back
  // to the catalog-based shell.
  bespokeHomepageHtml: string | null;
  // The page's own stylesheet, scoped to .bespoke-page before storage.
  bespokeCss: string | null;
  // v9 -- CSS custom properties compiled from the lead's inspiration design
  // DNA. Applied to the wrapper element so every bs-* class in generated
  // markup resolves to this lead's own palette, type and rhythm.
  designTokens: { vars: Record<string, string>; fontHref: string | null; mood: string } | null;
  // v9 -- generated markup for inner pages, keyed by route.
  bespokePages: Record<string, string>;
  // v9 -- per-lead header/footer design, chosen from the design DNA.
  chromeSpec: import("@/lib/chrome-spec").ChromeSpec;
  bespokeRationale: string | null;
}

export function siteHref(payload: Pick<SitePayload, "basePath" | "leadSlug" | "previewMode">, path = ""): string {
  const root = `${payload.basePath ?? `/s/${payload.leadSlug}`}${path}` || "/";
  return "previewMode" in payload && payload.previewMode ? `${root}?view=preview` : root;
}

export function homepageAnchor(payload: Pick<SitePayload, "basePath" | "leadSlug" | "previewMode">, anchor: string): string {
  return `${siteHref(payload)}#${anchor}`;
}
