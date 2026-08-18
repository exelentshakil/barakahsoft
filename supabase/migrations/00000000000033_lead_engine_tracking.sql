create table if not exists public.lead_inquiries (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null check (channel in ('form', 'phone_click')),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'booked', 'won', 'lost', 'spam', 'out_of_area')),
  name text,
  contact text,
  service text,
  location text,
  source text,
  campaign_id text,
  ad_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_inquiries_lead_id_created_at_idx on public.lead_inquiries(lead_id, created_at desc);
create index if not exists lead_inquiries_status_idx on public.lead_inquiries(status);

create table if not exists public.lead_ad_spend_daily (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  spend_date date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  source text not null default 'meta_manual',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, spend_date, source)
);

create index if not exists lead_ad_spend_daily_lead_date_idx on public.lead_ad_spend_daily(lead_id, spend_date desc);
alter table public.lead_inquiries enable row level security;
alter table public.lead_ad_spend_daily enable row level security;
