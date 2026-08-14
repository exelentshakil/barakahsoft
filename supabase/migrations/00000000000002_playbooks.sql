-- Source of truth for playbook content stays in /playbooks/*.json (git-diffable).
-- This table is a lightweight index so the admin UI can list/select playbooks
-- without reading the filesystem from a server component on every render.
create table public.playbooks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  industry_label text not null,
  content jsonb,
  created_at timestamptz not null default now()
);

alter table public.playbooks enable row level security;
