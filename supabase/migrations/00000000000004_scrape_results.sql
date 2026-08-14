create table public.scrape_results (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references public.leads(id) on delete cascade,
  -- The one blob: full page text/NAP/hours/socials/JSON-LD/forms inventory,
  -- Places fields (incl. review text), PageSpeed metrics, derived
  -- industry+keyword+town, photo quality ranking. If a claim isn't in here,
  -- it may not appear on the generated site (grounding rule).
  facts jsonb not null default '{}',
  pagespeed_mobile jsonb,
  pagespeed_desktop jsonb,
  places_raw jsonb,
  scraped_at timestamptz not null default now()
);

alter table public.scrape_results enable row level security;
