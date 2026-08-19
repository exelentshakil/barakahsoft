alter table public.leads
  add column if not exists source text not null default 'home',
  add column if not exists contact_name text,
  add column if not exists help_needed text[] not null default '{}',
  add column if not exists anything_else text;

alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads add constraint leads_source_check check (source in ('home', 'redesign'));

-- Preserve existing build-stage values while adding the sales pipeline values
-- required by V1. Build state is separated in a later phase.
alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check check (status in (
  'new','processing','ready','contacted','qualified','won','lost',
  'scraping','enriching','rendering','qa_pending','qa_approved','delivered','paid','live'
));

create index if not exists leads_source_idx on public.leads(source);
