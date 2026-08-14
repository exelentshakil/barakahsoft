create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'operator',
  created_at timestamptz not null default now()
);

-- RLS enabled with no policies: every read/write goes through the
-- service-role key from trusted server code (route handlers, server
-- components) for now, per PRD §18 — "not active today, single operator,
-- service-role key". Enabling RLS with zero policies still default-denies
-- the anon/authenticated keys and keeps Supabase's security advisor clean,
-- without adding real policy logic before it's actually needed.
alter table public.accounts enable row level security;
