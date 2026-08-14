create table public.leads (
  id uuid primary key default gen_random_uuid(),
  owner_account_id uuid references public.accounts(id),
  source_url text not null,
  business_name text,
  slug text not null unique,
  email text,
  phone text,
  pain_points text[] not null default '{}',
  tcpa_consent boolean not null default false,
  industry text,
  status text not null default 'new'
    check (status in ('new','scraping','enriching','rendering','qa_pending','qa_approved','delivered','paid','live')),
  place_id text,
  custom_domain text,
  meta_pixel_click_id text,
  delivered_at timestamptz,
  paid_at timestamptz,
  live_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_status_idx on public.leads (status);
create index leads_place_id_idx on public.leads (place_id);

alter table public.leads enable row level security;
