-- Approved before/after showcases for the public landing page.
--
-- The marketing site's "Design Quality Bar" section rendered a hardcoded
-- array of third-party design-reference screenshots — real sites, but other
-- people's work, and labeled as research precisely so nothing misrepresented
-- authorship. This adds the thing that actually sells: our own delivered
-- redesigns, shown as a before/after comparison against the client's real
-- previous site.
--
-- Approval is deliberate and per-lead. Nothing reaches the landing page
-- because a build finished — an operator has to approve it, because the
-- "before" is a real business's real old site and showing it publicly is a
-- judgement call, not a side effect.

alter table public.leads
  add column if not exists showcase_approved boolean not null default false,
  add column if not exists showcase_before_url text,
  add column if not exists showcase_after_url text,
  add column if not exists showcase_label text,
  add column if not exists showcase_approved_at timestamptz,
  add column if not exists showcase_sort integer not null default 0;

-- The landing page reads only approved rows: highest sort weight first,
-- then most recently approved.
create index if not exists leads_showcase_idx
  on public.leads (showcase_sort desc, showcase_approved_at desc)
  where showcase_approved;

-- Public bucket: these are marketing images of sites already publicly
-- visible on the open web, and the landing page serves them to anonymous
-- visitors. Writes stay service-role only, same as every other bucket here.
insert into storage.buckets (id, name, public)
values ('showcase', 'showcase', true)
on conflict (id) do nothing;

drop policy if exists "public read showcase" on storage.objects;
create policy "public read showcase"
  on storage.objects for select
  using (bucket_id = 'showcase');

drop policy if exists "service role writes showcase" on storage.objects;
create policy "service role writes showcase"
  on storage.objects for insert
  with check (bucket_id = 'showcase' and auth.role() = 'service_role');

drop policy if exists "service role updates showcase" on storage.objects;
create policy "service role updates showcase"
  on storage.objects for update
  using (bucket_id = 'showcase' and auth.role() = 'service_role');

drop policy if exists "service role deletes showcase" on storage.objects;
create policy "service role deletes showcase"
  on storage.objects for delete
  using (bucket_id = 'showcase' and auth.role() = 'service_role');
