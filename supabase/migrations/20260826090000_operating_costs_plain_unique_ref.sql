-- Make the external_ref index usable by ON CONFLICT.
--
-- It was created partial — UNIQUE (external_ref) WHERE external_ref IS NOT
-- NULL — and Postgres will only infer a partial index for ON CONFLICT when
-- the statement repeats the same predicate. PostgREST sends a bare
-- ON CONFLICT (external_ref), so every Meta sync failed with "there is no
-- unique or exclusion constraint matching the ON CONFLICT specification".
--
-- The predicate bought nothing anyway: a unique index already treats NULLs
-- as distinct, so the manually entered rows that have no external_ref never
-- collided with each other in the first place.

drop index if exists public.operating_costs_external_ref_idx;

create unique index if not exists operating_costs_external_ref_idx
  on public.operating_costs (external_ref);
