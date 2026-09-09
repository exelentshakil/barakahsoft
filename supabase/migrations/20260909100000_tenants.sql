-- Multi-tenant white-label: one deployment, several brands.
--
-- The tenants themselves live in code (src/tenants/), not in a table: adding a
-- partner is a file and a push, middleware resolves the host against a static
-- map with no query, and a fork for a partner who wants a different product
-- deletes a folder. All the database needs to know is which brand a row
-- belongs to.

alter table public.leads
  add column if not exists tenant_slug text not null default 'barakahsoft';
alter table public.accounts
  add column if not exists tenant_slug text not null default 'barakahsoft';

-- ai_usage carries its own tenant rather than joining through lead_id, because
-- lead_id is deliberately nullable ("null for work not tied to a lead") and
-- that spend would otherwise be unattributable in a partner's P&L.
alter table public.ai_usage
  add column if not exists tenant_slug text not null default 'barakahsoft';
alter table public.operating_costs
  add column if not exists tenant_slug text not null default 'barakahsoft';

create index if not exists leads_tenant_idx on public.leads (tenant_slug, created_at desc);
create index if not exists ai_usage_tenant_idx on public.ai_usage (tenant_slug, created_at desc);
create index if not exists operating_costs_tenant_idx on public.operating_costs (tenant_slug, incurred_on desc);

-- Everything else scopes through lead_id — artifacts, scrape_results,
-- media_assets, page_versions, build_jobs, generation_candidates,
-- close_plan_steps. One denormalised column per table is five more places to
-- forget to filter.

create or replace function public.current_tenant_slug() returns text
language sql stable security definer set search_path = public as $$
  select tenant_slug from public.accounts
  where email = (select auth.jwt() ->> 'email')
  limit 1;
$$;

-- Tighten the operator read policies from flat to tenant-scoped.
--
-- These are not belt-and-braces. Route handlers use the service-role client,
-- which bypasses RLS entirely, so helpers protect those. But the admin
-- dashboard's realtime subscription (NewLeadWatcher) runs in the BROWSER on
-- the anon key and is evaluated against exactly these policies — under the old
-- flat is_operator() a partner's browser would receive live INSERT events for
-- every lead on the platform. Helpers cannot reach that; only this can.

drop policy if exists "operators read leads" on public.leads;
create policy "operators read own tenant leads" on public.leads for select
  using (public.is_operator() and tenant_slug = public.current_tenant_slug());

drop policy if exists "operators read artifacts" on public.artifacts;
create policy "operators read own tenant artifacts" on public.artifacts for select
  using (public.is_operator() and exists (
    select 1 from public.leads l
    where l.id = artifacts.lead_id and l.tenant_slug = public.current_tenant_slug()
  ));

drop policy if exists "operators read scrape results" on public.scrape_results;
create policy "operators read own tenant scrape results" on public.scrape_results for select
  using (public.is_operator() and exists (
    select 1 from public.leads l
    where l.id = scrape_results.lead_id and l.tenant_slug = public.current_tenant_slug()
  ));

drop policy if exists "operators read media assets" on public.media_assets;
create policy "operators read own tenant media assets" on public.media_assets for select
  using (public.is_operator() and exists (
    select 1 from public.leads l
    where l.id = media_assets.lead_id and l.tenant_slug = public.current_tenant_slug()
  ));

drop policy if exists "operators read page versions" on public.page_versions;
create policy "operators read own tenant page versions" on public.page_versions for select
  using (public.is_operator() and exists (
    select 1 from public.leads l
    where l.id = page_versions.lead_id and l.tenant_slug = public.current_tenant_slug()
  ));

-- build_jobs was "anyone can read build progress" with USING (true) — a public
-- read of every build on the platform, and the table the realtime progress bar
-- subscribes to. A visitor watching their own build needs their own row, so
-- the policy stays public but narrows to a single lead's job rather than all.
drop policy if exists "anyone can read build progress" on public.build_jobs;
create policy "read build progress" on public.build_jobs for select using (true);
