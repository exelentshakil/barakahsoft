-- Per-model token prices, editable without a redeploy.
--
-- These started life in an environment variable, which meant changing a rate
-- was a deploy and nobody could see what was set. They belong in the
-- database: they change on the provider's schedule, not ours.
--
-- `source` records where a rate came from. A price looked up by a model is
-- not the same fact as one the operator read off an invoice, and a margin
-- report should be able to tell them apart.

create table if not exists public.model_prices (
  model text primary key,
  provider text not null check (provider in ('openai', 'gemini')),
  -- USD per million tokens.
  input_per_million numeric(12, 6) not null check (input_per_million >= 0),
  output_per_million numeric(12, 6) not null check (output_per_million >= 0),
  source text not null default 'manual' check (source in ('manual', 'looked-up')),
  source_url text,
  confirmed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.model_prices enable row level security;

create policy "operators read model prices"
  on public.model_prices for select using (public.is_operator());
