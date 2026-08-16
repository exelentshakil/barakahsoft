-- v4 Phase P2 — lets an operator paste in the token Google Search Console
-- issues once a lead's real custom domain (leads.custom_domain, Phase P1)
-- is verified there. Nullable: most leads won't have one until the client's
-- domain is live and the operator completes GSC verification for it.
alter table public.leads
  add column google_site_verification text;
