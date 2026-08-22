-- Operator read access, which Realtime needs to deliver anything.
--
-- leads, artifacts and scrape_results had RLS enabled and NO policies. The
-- service role bypasses RLS, so every server-side query worked and the gap
-- was invisible — but Realtime evaluates RLS against the BROWSER's key, so
-- the admin workspace subscribed successfully and then received no events at
-- all. A lead submitted from the landing page never appeared until someone
-- reloaded, and the live pipeline updates silently did nothing.
--
-- build_jobs already had a policy, which is precisely why the build progress
-- page was the one live thing that worked.
--
-- Scoped to operators, not public: these rows carry lead PII (names, emails,
-- phone numbers) and the business content being sold. The check mirrors
-- is-admin-session.ts — membership of the accounts allowlist — so a signed-in
-- Supabase user who is not an operator gets nothing.
create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.accounts
    where email = (select auth.jwt() ->> 'email')
  );
$$;

create policy "operators read leads"
  on public.leads for select using (public.is_operator());

create policy "operators read artifacts"
  on public.artifacts for select using (public.is_operator());

create policy "operators read scrape results"
  on public.scrape_results for select using (public.is_operator());

create policy "operators read media assets"
  on public.media_assets for select using (public.is_operator());

create policy "operators read page versions"
  on public.page_versions for select using (public.is_operator());
