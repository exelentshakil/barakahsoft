-- Vertical profiles: what kind of business this is, as data.
--
-- The generator answered that question with regexes on the trade name spread
-- across eight files. A profile collects those decisions in one place, and
-- these two columns are how a lead points at one.

-- Which profile this lead resolved to. Null means "not yet classified"; the
-- router fills it during the scrape. An operator can overwrite it from the
-- brief screen, and the router honours that above everything else.
alter table public.leads add column if not exists vertical_slug text;

-- Coverage reporting: which of the nine macro-ICPs this business is, and
-- whether this engine can serve it well. The engine is a local-business
-- lead-generation site builder — it is fed by Google Places and converts on a
-- call or a form — so a business with no listing, no phone and no location is
-- recorded as unsupported rather than shipped a page with an empty reviews
-- section. Counting those is how coverage becomes a measured number instead of
-- an estimate, and the unsupported bucket says which renderer to build next.
alter table public.leads add column if not exists icp_category text;
alter table public.leads add column if not exists icp_fit text
  check (icp_fit is null or icp_fit in ('native', 'adapted', 'unsupported'));

create index if not exists leads_icp_idx on public.leads (icp_category, icp_fit);

-- The profile the build actually used, frozen at generation time.
--
-- Same reasoning as artifacts.design_tokens: a page must always render against
-- the profile it was generated against, or editing a profile silently changes
-- the schema.org type and navigation labels of every site already delivered.
-- It is also what the edge-rendered /s/[leadSlug] page reads for its JSON-LD
-- without a second lookup.
alter table public.artifacts add column if not exists vertical_profile jsonb;
