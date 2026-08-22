-- The design reference library.
--
-- Pasting a reference URL on every lead is friction on the step that most
-- decides whether the result sells itself, and it depends on the operator
-- having a good site to hand at that moment.
--
-- References are curated ONCE per industry and reused. The extracted design
-- DNA is cached alongside the URL, so applying a reference to a new lead
-- costs nothing and takes no time -- and it keeps working even if the
-- reference site later redesigns, goes down, or starts blocking crawlers,
-- which is exactly how a hardcoded list of third-party URLs would rot.
create table public.design_references (
  id uuid primary key default gen_random_uuid(),
  -- Free text, matched loosely against the lead's industry. Not the persona
  -- enum: the business now spans far more than the ten home-services trades
  -- that enum was narrowed to.
  industry text not null,
  label text not null,
  source_url text,
  -- The extracted DesignDna. Cached so applying it is instant and free.
  dna jsonb not null,
  -- House presets ship with the system and cannot be deleted by accident;
  -- operator-saved references can.
  is_house boolean not null default false,
  created_at timestamptz not null default now()
);

create index design_references_industry_idx on public.design_references (lower(industry));

alter table public.design_references enable row level security;
