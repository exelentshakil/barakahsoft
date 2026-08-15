// Hand-written row types matching supabase/migrations/*.sql, mirroring the
// quotehaul pattern of not auto-generating types until the schema settles.

export type LeadStatus =
  | "new"
  | "scraping"
  | "enriching"
  | "rendering"
  | "qa_pending"
  | "qa_approved"
  | "delivered"
  | "paid"
  | "live";

export type MediaAssetSource = "site" | "gbp" | "unsplash" | "pexels" | "upload" | "generated-video";

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
  business_name: string | null;
  slug: string;
  email: string | null;
  phone: string | null;
  pain_points: string[];
  tcpa_consent: boolean;
  industry: string | null;
  status: LeadStatus;
  place_id: string | null;
  custom_domain: string | null;
  meta_pixel_click_id: string | null;
  // The client's own Facebook Pixel ID for their delivered site — separate
  // from meta_pixel_click_id above, which is BarakahSoft's own lead-gen
  // funnel tracking.
  facebook_pixel_id: string | null;
  delivered_at: string | null;
  paid_at: string | null;
  live_at: string | null;
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
  scraped_at: string;
}

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
  kind: string;
  h2: string;
  body_content: string;
  media_asset_ids: string[];
  cta: string | null;
  // Optional, additive — structured extras a section variant might need
  // beyond the baseline fields above. Old entries simply lack it.
  variant_props?: Record<string, unknown>;
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
  section_variant_selections: Record<string, string>;
  composition_rationale: string | null;
}

export type BuildJobStage =
  | "scrape"
  | "enrich"
  | "render"
  | "screenshot"
  | "qa"
  | "deliver"
  | "rebuild_inner_pages"
  | "go_live";

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
