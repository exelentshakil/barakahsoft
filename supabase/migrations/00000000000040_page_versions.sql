-- Page versions.
--
-- The generator's job is to produce the best possible v1. It is never what
-- gets sent -- a human swaps in real photography, sharpens copy, and may
-- rebuild a page entirely from Claude Code. That refinement loop needs
-- somewhere to stand: without history, every iteration silently destroys
-- the version before it, so nobody dares iterate.
--
-- Deliberately page-level, not site-level. The homepage gets rebuilt five
-- times while the contact page is right on the first pass, and site-level
-- snapshots would force regenerating everything to change one section.
--
-- artifacts.bespoke_homepage_html / bespoke_pages remain THE LIVE CONTENT,
-- so nothing about rendering changes. This table is history plus restore:
-- promoting a version copies it back into the artifact.
create table public.page_versions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  -- "home", "about", "faq", "contact", "services/panel-upgrades", ...
  page_key text not null,
  version int not null,
  html text not null,
  -- Where it came from, so the operator can tell an AI draft from their own
  -- edit at a glance.
  source text not null default 'generated'
    check (source in ('generated','regenerated','edited','claude-code')),
  -- One line on what this version changed.
  note text,
  created_at timestamptz not null default now(),
  unique (lead_id, page_key, version)
);

create index page_versions_lookup_idx on public.page_versions (lead_id, page_key, version desc);

alter table public.page_versions enable row level security;
