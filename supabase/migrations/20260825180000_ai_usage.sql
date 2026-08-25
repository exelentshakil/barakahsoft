-- What each lead actually cost to process.
--
-- Token counts were already known — both clients logged them — and then
-- thrown away, so "we spent $100 processing leads and made $2k" was a
-- question nothing here could answer. One row per model call, keyed to the
-- lead that caused it.
--
-- Tokens and dollars are stored separately on purpose. Tokens are measured;
-- the dollar figure is derived from a price list that only the operator can
-- supply and that changes without warning. Storing the cost that applied at
-- the time means a later price change does not silently rewrite last
-- month's margin.

create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  -- Null for work not tied to a lead, so a general call is still counted in
  -- the weekly total even though no lead can be charged for it.
  lead_id uuid references public.leads(id) on delete cascade,
  provider text not null check (provider in ('openai', 'gemini')),
  model text not null,
  -- What the call was for: 'site-plan', 'structure', 'stylesheet', ...
  purpose text,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  -- Null when the model has no configured price. Deliberately not zero —
  -- "free" and "unpriced" must not read the same on a margin report.
  cost_usd numeric(12, 6),
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_lead_idx on public.ai_usage (lead_id, created_at desc);
create index if not exists ai_usage_period_idx on public.ai_usage (created_at desc);

alter table public.ai_usage enable row level security;

create policy "operators read ai usage"
  on public.ai_usage for select using (public.is_operator());

-- Costs that are not model calls: ad spend, and anything else worth setting
-- against revenue for a period. Kept alongside so one query answers "what
-- did this week cost".
create table if not exists public.operating_costs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('ads', 'tooling', 'other')),
  label text,
  amount_usd numeric(12, 2) not null,
  incurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists operating_costs_period_idx on public.operating_costs (incurred_on desc);

alter table public.operating_costs enable row level security;

create policy "operators read operating costs"
  on public.operating_costs for select using (public.is_operator());
