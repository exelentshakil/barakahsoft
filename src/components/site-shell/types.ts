import type { FunnelPageSection } from "@/types/database";

// A funnel_pages entry with its media_asset_ids resolved to real Storage
// URLs — render-shell.ts does this once, generically, for every section.
export type ResolvedSection = FunnelPageSection & { imageUrl: string | null; imageUrls: string[] };

// The resolved props a template shell renders from — assembled once by
// render-shell.ts (render_shell atom) from an artifact + its scrape facts,
// so the shell components themselves never touch Supabase directly.
export interface SitePayload {
  businessName: string;
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
  brandColorHsl: string | null;
  logoUrl: string | null;
  fontFamily: string | null;
  fontStylesheetUrl: string | null;
  innerPagesBuilt: boolean;
  // v3 (Phase L) — whether enrich-expand.ts has finished for this lead.
  // Orthogonal to innerPagesBuilt (payment/indexability): about/faq/legal/
  // location pages need real expanded content to exist at all, regardless
  // of whether the site has gone live.
  fullSiteBuilt: boolean;
  leadSlug: string;
  sectionVariants: Record<string, string>;
}

export function sectionHref(payload: Pick<SitePayload, "innerPagesBuilt" | "leadSlug">, kind: "services" | "areas", slug: string): string {
  return payload.innerPagesBuilt ? `/s/${payload.leadSlug}/${kind}/${slug}` : `#${slug}`;
}
