-- Measured local search visibility.
--
-- Replaces the hardcoded 49-node grid that shipped identical Queens data to
-- every client regardless of trade or geography.
--
-- Every cell here is measured: a search-capable model performs a real search
-- per area and reads which businesses actually appear. Nothing is produced
-- from a model's own knowledge, because a model asked from memory where a
-- business ranks will answer confidently and be inventing it — which is the
-- failure this column exists to end.
--
-- Stored per lead rather than shared per market, so a stale measurement can
-- never be presented as current for a different business.
alter table public.scrape_results
  add column search_visibility jsonb,
  add column search_visibility_at timestamptz;

comment on column public.scrape_results.search_visibility is
  'Measured local search visibility: {query, cells[{area, rank, topCompetitor, ahead}], visible, missing, dominant, measuredAt}. Never inferred.';
