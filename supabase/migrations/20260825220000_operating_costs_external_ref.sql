-- Make a synced cost row identifiable, so syncing twice is not paying twice.
--
-- Ad spend is pulled per day and the same day gets pulled again every time
-- the sync runs — yesterday's figure is not final until Meta finishes
-- attributing it. Without a stable key each run would insert another row and
-- the period total would climb on its own, which is the worst possible
-- failure on a margin report: silent, plausible, and always in the same
-- direction.

alter table public.operating_costs
  add column if not exists external_ref text;

-- One row per source per day. An upsert on this key updates the figure
-- instead of adding to it.
create unique index if not exists operating_costs_external_ref_idx
  on public.operating_costs (external_ref)
  where external_ref is not null;

-- Campaign performance alongside the spend, so "what did it cost and what
-- did it return" is one row rather than a spreadsheet and a memory.
alter table public.operating_costs
  add column if not exists impressions integer,
  add column if not exists clicks integer,
  add column if not exists results integer;
