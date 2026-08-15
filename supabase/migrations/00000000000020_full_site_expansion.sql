-- Phase L (v3): the "Build full site" expansion gate. Additive/nullable
-- like every other v2/v3 migration -- every existing artifacts row parses
-- as full_site_status = 'pending' (never generated) after this ships.
-- Deliberately no separate "deferred slugs" column -- enrich-expand.ts
-- recomputes the delta idempotently from deriveServiceCandidates vs. slugs
-- already present in funnel_pages, avoiding a second source of truth.
-- Fully orthogonal to inner_pages_built (a post-payment routing gate) and
-- to leads.status -- this never writes to either.
alter table public.artifacts
  add column full_site_status text not null default 'pending'
    check (full_site_status in ('pending','building','complete','failed')),
  add column full_site_built_at timestamptz;
