create table public.hosting_subscriptions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references public.leads(id) on delete cascade,
  stripe_subscription_id text,
  tier text not null check (tier in ('hosting','hosting_support')),
  status text not null default 'incomplete',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

alter table public.hosting_subscriptions enable row level security;
