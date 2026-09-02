// Hand-written row types matching supabase/migrations/*.sql, mirroring the
// quotehaul pattern of not auto-generating types until the schema settles.

export type LeadStatus =
  | "new"
  | "processing"
  | "ready"
  | "contacted"
  | "qualified"
  | "won"
  | "lost"
  | "scraping"
  | "enriching"
  | "rendering"
  | "qa_pending"
  | "qa_approved"
  | "delivered"
  | "paid"
  | "live";

export type MediaAssetSource = "site" | "gbp" | "unsplash" | "pexels" | "upload" | "generated";

export interface Account {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Playbook {
  id: string;
  slug: string;
  industry_label: string;
  content: Record<string, unknown> | null;
  created_at: string;
}

export interface Lead {
  id: string;
  owner_account_id: string | null;
  source_url: string;
  source: "home" | "redesign" | "outreach" | "manual";
  contact_name: string | null;
  business_name: string | null;
  slug: string;
  email: string | null;
  phone: string | null;
  pain_points: string[];
  help_needed: string[];
  anything_else: string | null;
  tcpa_consent: boolean;
  industry: string | null;
  // v4 Phase R2 — self-identified at intake, distinct from the AI/keyword-
  // inferred `industry` above. See src/lib/personas.ts for the slug set.
  persona: string | null;
  status: LeadStatus;
  place_id: string | null;
  custom_domain: string | null;
  // 'byod' = client already owned it, operator just entered it; 'purchased'
  // = bought through BarakahSoft's own Vercel registrar account. Operator
  // bookkeeping only.
  domain_source: "byod" | "purchased" | null;
  meta_pixel_click_id: string | null;
  // The client's own Facebook Pixel ID for their delivered site — separate
  // from meta_pixel_click_id above, which is BarakahSoft's own lead-gen
  // funnel tracking.
  facebook_pixel_id: string | null;
  // v4 Phase P2 — the token GSC issues once custom_domain (above) is
  // verified there; rendered as a meta tag on the delivered site when set.
  google_site_verification: string | null;
  delivered_at: string | null;
  last_viewed_at?: string | null;
  paid_at: string | null;
  live_at: string | null;
  // Operator-approved before/after showcase for the public landing page.
  // Approval is deliberate per lead — a finished build does not put a real
  // client's old site on the marketing homepage on its own.
  showcase_approved: boolean;
  showcase_before_url: string | null;
  showcase_after_url: string | null;
  showcase_label: string | null;
  showcase_approved_at: string | null;
  showcase_sort: number;
  // Cold outreach sequence position. 0 = nothing sent; 1..3 = that touch has
  // been sent. outreach_stopped_at ends the sequence without deleting the
  // lead — set when a prospect replies or asks to stop.
  outreach_stage: number;
  outreach_last_sent_at: string | null;
  outreach_stopped_at: string | null;
  /** Model-written stage-1 copy awaiting operator review. Cleared on send. */
  outreach_draft?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ScrapeResults {
  id: string;
  lead_id: string;
  facts: Record<string, unknown>;
  pagespeed_mobile: Record<string, unknown> | null;
  pagespeed_desktop: Record<string, unknown> | null;
  places_raw: Record<string, unknown> | null;
  // Measured local search visibility. Every cell comes from a real search
  // that was actually performed; nothing here is inferred.
  search_visibility: {
    query: string;
    provider: "gemini" | "openai";
    cells: { area: string; rank: number | null; topCompetitor: string | null; ahead: string[] }[];
    visible: number;
    missing: number;
    dominant: number;
    measuredAt: string;
  } | null;
  search_visibility_at: string | null;
  // Real competitors with measured review counts and speed scores.
  competitors: unknown | null;
  scraped_at: string;
}

export type MediaStorageMode = "hotlink" | "copied";

export interface MediaAsset {
  id: string;
  lead_id: string;
  storage_path: string;
  public_url: string;
  source: MediaAssetSource;
  slot_hint: string | null;
  width: number | null;
  height: number | null;
  quality_score: number | null;
  attribution_name: string | null;
  attribution_url: string | null;
  // v4 Phase N — 'hotlink' means public_url is the real source URL (client
  // site, Unsplash/Pexels CDN), never downloaded; 'copied' means it's a
  // Supabase Storage URL from copyToStorage, the pre-v4 behavior.
  storage_mode: MediaStorageMode;
  created_at: string;
}

export interface TemplateShell {
  id: string;
  slug: string;
  industry_tags: string[];
  component_path: string;
  created_at: string;
}

export interface FunnelPageSection {
  slug: string;
  kind: "ads_retainer" | "lead_engine" | string;
  h2: string;
  body_content: string;
  media_asset_ids: string[];
  cta: string | null;
  // Optional, additive — structured extras a section variant might need
  // beyond the baseline fields above. Old entries simply lack it.
  variant_props?: Record<string, unknown>;
  // Longer-form standalone-page SEO copy, generated only by
  // enrich-expand.ts once a lead is qualified. Optional/additive -- fast-
  // pass sections simply lack it, and the standalone page templates fall
  // back to body_content when absent.
  long_body_content?: string;
}

export interface Artifact {
  id: string;
  lead_id: string;
  template_shell_id: string;
  extracted_assets: Record<string, unknown>;
  funnel_pages: FunnelPageSection[];
  inner_pages_built: boolean;
  screenshot_url: string | null;
  qa_status: "pending" | "approved" | "rejected";
  qa_notes: string | null;
  last_edited_at: string | null;
  last_edited_by: string | null;
  created_at: string;
  // Which section-variant renders in each fixed slot (kind -> variant_slug),
  // picked per lead by enrich-generate's composition step. Defaults to '{}'
  // in the DB (migration 00000000000016) so old rows still parse cleanly.
  section_variant_selections: Record<string, unknown>;
  composition_rationale: string | null;
  // v3 (Phase L) -- whether the full multi-page site (remaining services,
  // location-service pages, about/faq/legal) has been built for this lead.
  // Orthogonal to inner_pages_built (a post-payment routing/indexability
  // gate) -- this is a separate, pre-payment "operator qualified this lead,
  // build the rest" gate, flipped automatically by enrich-expand.ts the
  // moment the lead is QA-approved, not by a payment event.
  full_site_status: "pending" | "building" | "complete" | "failed";
  full_site_built_at: string | null;
  // v8 -- real generated HTML for the homepage (Gemini, informed by real
  // reference screenshots), sanitized before storage. Null for legacy
  // leads or a trade with no reference library yet -- those fall back to
  // the existing catalog-based shell.
  bespoke_homepage_html: string | null;
  bespoke_rationale: string | null;
  // The page's own stylesheet. Selectors are scoped before storage.
  bespoke_css: string | null;
  /** Generated navigation, rendered on every route rather than the homepage alone. */
  bespoke_chrome_html: string | null;
  /** Generated footer, likewise site-wide. */
  bespoke_footer_html: string | null;
  // v9 -- inspiration design DNA. The reference site the operator chose,
  // and the design spec distilled from it. Contributes visual direction
  // only; the lead's own scrape stays the sole source of facts.
  inspiration_url: string | null;
  inspiration_branding: unknown | null;
  // CSS custom properties compiled from inspiration_branding, stored so a
  // generated page always renders with the tokens it was generated against.
  design_tokens: { vars: Record<string, string>; fontHref: string | null; mood: string } | null;
  // Generated markup for inner pages, keyed by route ("about", "faq",
  // "services/panel-upgrades", ...).
  bespoke_pages: Record<string, string>;
  // The approved copy plan and media plan. Persisted because phase 2 runs
  // long after phase 1 and must reuse the voice and photography the client
  // already approved, rather than re-deriving them.
  copy_plan: unknown | null;
  media_plan: unknown | null;
  generation_phase: number;
  // Per-lead header and footer design, chosen from the design DNA.
  chrome_spec: unknown | null;
  // Ordered, addressable sections. bespoke_homepage_html is derived from
  // these, so a page can be repaired one section at a time instead of
  // regenerated whole.
  bespoke_sections: { id: string; kind: string; label: string; html: string; locked: boolean }[];
  // Whose colours the rebuilt site uses. Defaults to the reference palette,
  // because a redesign is what is being sold.
  colour_source: "reference" | "client" | "hybrid";
}

export type BuildJobStage =
  | "scrape"
  | "enrich"
  | "render"
  | "screenshot"
  | "qa"
  | "deliver"
  | "rebuild_inner_pages"
  | "go_live"
  | "bespoke";

export interface BuildJob {
  id: string;
  lead_id: string;
  stage: BuildJobStage;
  pages_done: number;
  pages_total: number;
  status: "running" | "complete" | "failed";
  error_message: string | null;
  updated_at: string;
}

export type { GenerationCandidate, VisualQaStatus, VisualQaReport } from "@/lib/visual-qa";

export interface ClosePlanStep {
  id: string;
  lead_id: string;
  step_number: number;
  kind: "email" | "call" | "sms";
  scheduled_at: string | null;
  sent_at: string | null;
  status: "pending" | "sent" | "skipped" | "done";
  script_or_template: string | null;
  created_at: string;
}

export interface Outcome {
  id: string;
  lead_id: string;
  result: "won" | "lost" | "no_response" | "nurturing";
  notes: string | null;
  recorded_at: string;
}

export interface HostingSubscription {
  id: string;
  lead_id: string;
  stripe_subscription_id: string | null;
  tier: "hosting" | "hosting_support";
  status: string;
  current_period_end: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  lead_id: string;
  stripe_subscription_id: string | null;
  kind: string;
  status: string;
  created_at: string;
}
