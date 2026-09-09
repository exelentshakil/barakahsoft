-- One person, several brands.
--
-- accounts.email was UNIQUE, which made an operator's email map to exactly one
-- tenant. That is wrong for the person who runs the platform AND needs to open
-- a partner's dashboard to see what they are seeing: the second row failed on
-- the constraint, and forcing it by editing the first would have silently moved
-- them out of their own account.
--
-- The identity that must be unique is the pair: one row per person per brand.
alter table public.accounts drop constraint if exists accounts_email_key;

create unique index if not exists accounts_email_tenant_key
  on public.accounts (email, tenant_slug);

-- Which brands may this login read?
--
-- Replaces current_tenant_slug(), which returned a single value and is now
-- ambiguous. A JWT says who is asking but not which dashboard they have open —
-- only the request host knows that, and RLS cannot see it. So the honest answer
-- is the set of brands they hold an account for.
--
-- The guarantee these policies exist to make is unchanged: they stop a
-- partner's BROWSER receiving another brand's realtime inserts, and a partner
-- with one account still matches exactly one brand. Someone holding accounts
-- for two brands sees both, which is correct — they operate both.
--
-- Route-level scoping in lib/tenant-scope.ts is separate and stricter: it
-- resolves the tenant from the host, so an operator working in one brand's
-- dashboard cannot reach another's leads through the API even though RLS here
-- would permit the read.
create or replace function public.operator_tenant_slugs() returns setof text
language sql stable security definer set search_path = public as $$
  select tenant_slug from public.accounts
  where email = (select auth.jwt() ->> 'email');
$$;

drop function if exists public.current_tenant_slug();

drop policy if exists "operators read own tenant leads" on public.leads;
create policy "operators read own tenant leads" on public.leads for select
  using (public.is_operator() and tenant_slug in (select public.operator_tenant_slugs()));

drop policy if exists "operators read own tenant artifacts" on public.artifacts;
create policy "operators read own tenant artifacts" on public.artifacts for select
  using (public.is_operator() and exists (
    select 1 from public.leads l
    where l.id = artifacts.lead_id and l.tenant_slug in (select public.operator_tenant_slugs())
  ));

drop policy if exists "operators read own tenant scrape results" on public.scrape_results;
create policy "operators read own tenant scrape results" on public.scrape_results for select
  using (public.is_operator() and exists (
    select 1 from public.leads l
    where l.id = scrape_results.lead_id and l.tenant_slug in (select public.operator_tenant_slugs())
  ));

drop policy if exists "operators read own tenant media assets" on public.media_assets;
create policy "operators read own tenant media assets" on public.media_assets for select
  using (public.is_operator() and exists (
    select 1 from public.leads l
    where l.id = media_assets.lead_id and l.tenant_slug in (select public.operator_tenant_slugs())
  ));

drop policy if exists "operators read own tenant page versions" on public.page_versions;
create policy "operators read own tenant page versions" on public.page_versions for select
  using (public.is_operator() and exists (
    select 1 from public.leads l
    where l.id = page_versions.lead_id and l.tenant_slug in (select public.operator_tenant_slugs())
  ));
