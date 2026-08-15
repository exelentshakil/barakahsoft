-- Phase H: AI-generated hero video background (Veo 3.1 Lite). A new
-- media_assets.source value for traceability, and a new hero catalog
-- variant so the existing per-lead composition step (compose-sections.ts)
-- can pick it like any other hero option -- video only ever generates when
-- this specific variant gets selected for a lead (enrich-generate.ts).
alter table public.media_assets drop constraint media_assets_source_check;
alter table public.media_assets add constraint media_assets_source_check
  check (source in ('site','gbp','unsplash','pexels','upload','generated-video'));

insert into public.section_variant_catalog (section_kind, variant_slug, industry_tags, component_path, description, is_default) values
  ('hero', 'video-background', array['home-services','karting-recreation'], 'src/components/site-shell/sections/hero/HeroVideoBackground', 'A short AI-generated cinematic video loop plays behind the headline instead of a static photo. Best for a business that wants the most premium, attention-grabbing first impression -- costs a few cents more per lead to generate.', false);
