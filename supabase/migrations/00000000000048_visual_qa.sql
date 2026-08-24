-- Local-browser visual QA for generated homepage candidates.
--
-- HTML and CSS are persisted together so Playwright can inspect a rejected
-- candidate without replacing the live artifact. Screenshots stay private;
-- the local worker exchanges them through authenticated application routes.
create table public.generation_candidates (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  attempt integer not null check (attempt > 0),
  html text not null,
  css text not null,
  rationale text,
  context jsonb not null default '{}'::jsonb,
  source_report jsonb,
  creative_report jsonb,
  visual_status text not null default 'queued'
    check (visual_status in ('queued', 'running', 'passed', 'failed', 'error', 'timed_out')),
  visual_report jsonb,
  desktop_screenshot_path text,
  tablet_screenshot_path text,
  mobile_screenshot_path text,
  worker_id text,
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index generation_candidates_queue_idx
  on public.generation_candidates (visual_status, created_at);

create index generation_candidates_lead_idx
  on public.generation_candidates (lead_id, created_at desc);

alter table public.generation_candidates enable row level security;

create policy "operators read generation candidates"
  on public.generation_candidates for select using (public.is_operator());

insert into storage.buckets (id, name, public)
values ('visual-qa', 'visual-qa', false)
on conflict (id) do nothing;

create policy "service role reads visual qa"
  on storage.objects for select
  using (bucket_id = 'visual-qa' and auth.role() = 'service_role');

create policy "service role writes visual qa"
  on storage.objects for insert
  with check (bucket_id = 'visual-qa' and auth.role() = 'service_role');

create policy "service role updates visual qa"
  on storage.objects for update
  using (bucket_id = 'visual-qa' and auth.role() = 'service_role');

create policy "service role deletes visual qa"
  on storage.objects for delete
  using (bucket_id = 'visual-qa' and auth.role() = 'service_role');

-- One worker claims one row atomically. A row abandoned by a crashed worker
-- becomes claimable again after twenty minutes.
create or replace function public.claim_visual_qa_candidate(p_worker_id text)
returns setof public.generation_candidates
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.generation_candidates
  set
    visual_status = 'running',
    worker_id = nullif(left(p_worker_id, 120), ''),
    claimed_at = now()
  where id = (
    select id
    from public.generation_candidates
    where visual_status = 'queued'
       or (visual_status = 'running' and claimed_at < now() - interval '20 minutes')
    order by created_at
    for update skip locked
    limit 1
  )
  returning *;
end;
$$;

revoke all on function public.claim_visual_qa_candidate(text) from public, anon, authenticated;
grant execute on function public.claim_visual_qa_candidate(text) to service_role;
