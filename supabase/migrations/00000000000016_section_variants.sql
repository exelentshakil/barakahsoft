-- Per-lead section-variant composition: which hand-built layout variant
-- renders in each fixed section slot (hero, proof, services-grid, reviews,
-- service-area, faq, guarantee, cta), picked by a per-lead AI composition
-- step from section_variant_catalog. Additive/nullable so every existing
-- artifacts row parses as "use the default (= current) variant for every
-- kind" -- old/already-delivered rows render identically after this ships.
alter table public.artifacts
  add column section_variant_selections jsonb not null default '{}',
  add column composition_rationale text;

-- The pre-vetted menu the composition step picks from -- an AI selection is
-- only ever an enum value validated against this table, never a component
-- path or markup, so nothing AI-generated reaches the DOM directly.
create table public.section_variant_catalog (
  id uuid primary key default gen_random_uuid(),
  section_kind text not null,
  variant_slug text not null,
  industry_tags text[] not null default '{}',
  component_path text not null,
  description text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (section_kind, variant_slug)
);

alter table public.section_variant_catalog enable row level security;

insert into public.section_variant_catalog (section_kind, variant_slug, industry_tags, component_path, description, is_default) values
  ('hero', 'split-image', array['home-services','karting-recreation'], 'src/components/site-shell/sections/hero/HeroSplitImage', 'Headline and subhead on the left, a real photo on the right. Safe, classic, works for any business.', true),
  ('hero', 'stat-forward', array['home-services','karting-recreation'], 'src/components/site-shell/sections/hero/HeroStatForward', 'Full-bleed real photo behind a centered headline, with the real rating/review count called out above it as a stat badge. Best when there is a strong real review count and rating.', false),

  ('proof', 'bar', array['home-services','karting-recreation'], 'src/components/site-shell/sections/proof/ProofBar', 'One inline bar: rating chip, a short differentiator line, and a small real photo. Compact, safe default.', true),
  ('proof', 'stat-grid', array['home-services','karting-recreation'], 'src/components/site-shell/sections/proof/ProofStatGrid', 'Rating and review count as separate stat tiles next to the differentiator line. Best when both a real rating and a real review count exist.', false),

  ('services-grid', 'card-grid', array['home-services','karting-recreation'], 'src/components/site-shell/sections/services-grid/ServicesCardGrid', 'A grid of bordered cards, one per service. Safe default, works for any service count.', true),
  ('services-grid', 'icon-list', array['home-services','karting-recreation'], 'src/components/site-shell/sections/services-grid/ServicesIconList', 'A denser two-column icon-led list. Best for a longer real service list (6+ services).', false),

  ('reviews', 'grid', array['home-services','karting-recreation'], 'src/components/site-shell/sections/reviews/ReviewsGrid', 'A grid of review cards. Safe default.', true),
  ('reviews', 'carousel', array['home-services','karting-recreation'], 'src/components/site-shell/sections/reviews/ReviewsCarousel', 'A horizontal scroll-snap row of review cards. Best for a shorter real review list (2-4 reviews) where a full grid would look sparse.', false),

  ('service-area', 'badges', array['home-services','karting-recreation'], 'src/components/site-shell/sections/service-area/AreaBadges', 'Service areas as pill badges. Safe default, works for any area count.', true),
  ('service-area', 'list', array['home-services','karting-recreation'], 'src/components/site-shell/sections/service-area/AreaList', 'A calmer columned list with pin icons. Best for a longer real area list (6+ areas).', false),

  ('faq', 'stacked', array['home-services','karting-recreation'], 'src/components/site-shell/sections/faq/FaqStacked', 'One stacked column of questions. Safe default.', true),
  ('faq', 'two-column', array['home-services','karting-recreation'], 'src/components/site-shell/sections/faq/FaqTwoColumn', 'A two-column grid of questions. Best for a longer real FAQ list (8+ questions) to reduce scroll length.', false),

  ('guarantee', 'band', array['home-services','karting-recreation'], 'src/components/site-shell/sections/guarantee/GuaranteeBand', 'A full-width tinted band with the guarantee text. Safe default.', true),
  ('guarantee', 'card', array['home-services','karting-recreation'], 'src/components/site-shell/sections/guarantee/GuaranteeCard', 'A centered bordered card. Best when the guarantee is a genuinely strong real claim worth featuring more prominently.', false),

  ('cta', 'centered', array['home-services','karting-recreation'], 'src/components/site-shell/sections/cta/CtaCentered', 'A centered closing CTA with call/email buttons. Safe default.', true),
  ('cta', 'split', array['home-services','karting-recreation'], 'src/components/site-shell/sections/cta/CtaSplit', 'A tinted two-column split with a contact card. Best as a stronger visual close for a business with both a real phone and email.', false);
