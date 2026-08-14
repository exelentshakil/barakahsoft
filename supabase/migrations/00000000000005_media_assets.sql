create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  source text not null check (source in ('site','gbp','unsplash','pexels','upload')),
  slot_hint text,
  width int,
  height int,
  quality_score numeric,
  attribution_name text,
  attribution_url text,
  created_at timestamptz not null default now()
);

create index media_assets_lead_slot_idx on public.media_assets (lead_id, slot_hint);

alter table public.media_assets enable row level security;
