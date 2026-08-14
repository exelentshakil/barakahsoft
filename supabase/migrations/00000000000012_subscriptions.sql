-- Reserved for the future $500/week ads-retainer upsell tier (PRD §2).
-- Schema now, feature later — not wired into any route in v1.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  stripe_subscription_id text,
  kind text not null default 'ads_retainer',
  status text not null default 'incomplete',
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
