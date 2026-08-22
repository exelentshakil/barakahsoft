-- Addressable page sections.
--
-- Pages were stored as one HTML blob, which made the only available repair
-- "regenerate everything" -- throwing away every section that was already
-- good in order to fix the one that was not. That is why a slightly broken
-- hero meant starting over.
--
-- Sections are the unit of work now: regenerate one, rewrite one from an
-- instruction, insert one, remove one, reorder them. bespoke_homepage_html
-- remains the rendered concatenation so nothing about rendering or export
-- changes; this column is the editable truth it is derived from.
--
-- `locked` is the guarantee the operator actually needs: a section they have
-- approved is never touched by any later regeneration, whatever it targets.
alter table public.artifacts
  add column bespoke_sections jsonb not null default '[]'::jsonb;

comment on column public.artifacts.bespoke_sections is
  'Ordered [{id, kind, label, html, locked}]. bespoke_homepage_html is derived from this.';
