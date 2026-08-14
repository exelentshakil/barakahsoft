create table public.build_jobs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  stage text not null check (stage in ('scrape','enrich','render','screenshot','qa','deliver','rebuild_inner_pages','go_live')),
  pages_done int not null default 0,
  pages_total int not null default 1,
  status text not null default 'running' check (status in ('running','complete','failed')),
  error_message text,
  -- Realtime-subscribed column — every Inngest step upserts this row so
  -- BuildProgress.tsx gets live updates with zero polling.
  updated_at timestamptz not null default now()
);

create index build_jobs_lead_idx on public.build_jobs (lead_id);

alter table public.build_jobs enable row level security;

-- Unlike every other table here, this one gets a real anon-read policy:
-- the public "Live Build Progress" page (unguessable lead UUID in the URL,
-- no login) subscribes to this table via Supabase Realtime, which enforces
-- RLS for the anon key. The row itself carries no PII, only pipeline
-- progress (stage/pages_done/pages_total/status), so a public read is safe.
create policy "anyone can read build progress"
  on public.build_jobs for select
  using (true);

alter publication supabase_realtime add table public.build_jobs;
