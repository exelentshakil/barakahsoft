-- Tracks whether a lead's custom_domain was brought by the client (byod)
-- or purchased through BarakahSoft's own Vercel registrar account
-- (purchased) -- operator bookkeeping only, not read by any app logic.
alter table public.leads
  add column domain_source text check (domain_source in ('byod', 'purchased'));
