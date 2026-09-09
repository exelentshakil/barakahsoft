-- The specific things a business has, read from its own site.
--
-- Until now the only structured output of a scrape was `facts.derived_services`
-- and `facts.derived_areas` — two flat string arrays. There was nowhere to put
-- a membership tier, a class name, a coach, an amenity or a policy, so a page
-- built for a gym had nothing gym-shaped to say and fell back to whatever the
-- section slots implied, which was trade work.
--
-- Every row in this array carries the page it was read from, and anything the
-- extractor could not point at a scraped page is dropped before it gets here.
alter table public.scrape_results
  add column if not exists entities jsonb not null default '[]'::jsonb;

comment on column public.scrape_results.entities is
  'Verified facts from the client''s own site: pricing tiers, classes, people, amenities, policies. Each carries the source page it was read from.';

-- Read by the composer when deciding whether a blueprint section has anything
-- to render, so it is filtered by kind far more often than it is listed.
create index if not exists scrape_results_entities_idx
  on public.scrape_results using gin (entities jsonb_path_ops);
