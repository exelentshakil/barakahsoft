-- Bespoke generation v9 -- inspiration design DNA as a first-class input.
--
-- The operator researches a best-in-class site in the lead's industry and
-- drops its URL into the Studio. That site is scraped and distilled into a
-- normalized design spec (palette, typography, geometry, layout rhythm,
-- motifs) stored in inspiration_branding. The generator then combines TWO
-- separate inputs that must never be mixed up:
--
--   inspiration_branding  -> how it LOOKS  (design DNA, from the reference)
--   scrape_results.facts  -> what it SAYS  (truth, from the real lead)
--
-- Keeping them in separate columns is the whole point: it makes it
-- structurally impossible for a reference site's copy, claims, reviews or
-- phone number to leak into a real client's page. Only visual direction
-- crosses over.
alter table public.artifacts
  add column inspiration_url text,
  add column inspiration_branding jsonb,
  -- Resolved CSS custom-property set derived from inspiration_branding
  -- (or from the lead's own brand colors when no inspiration is set).
  -- Stored rather than recomputed so a generated page always renders with
  -- the exact tokens it was generated against.
  add column design_tokens jsonb,
  -- Generated markup for inner pages, keyed by route ("about", "faq",
  -- "services/panel-upgrades", ...). bespoke_homepage_html stays its own
  -- column: the homepage gets materially more generation effort and is
  -- read on its own hot path.
  add column bespoke_pages jsonb not null default '{}'::jsonb;

comment on column public.artifacts.inspiration_branding is
  'Design DNA distilled from a reference site. Visual direction only -- never copy, claims, or facts.';
