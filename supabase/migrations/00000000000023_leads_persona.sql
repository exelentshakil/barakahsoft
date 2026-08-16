-- v4 Phase R2 — the intake form's "which best describes you?" self-ID,
-- separate from leads.industry (AI/keyword-inferred post-hoc from scraped
-- site facts). Nullable: only new intakes collect this; existing leads
-- simply lack it. Phase R3 uses it as a prior for detectIndustry when set.
alter table public.leads
  add column persona text
    check (persona in (
      'local-business-owner',
      'solo-service-provider',
      'contractor-tradesperson',
      'salon-beauty',
      'home-service-business-owner',
      'agency-freelancer',
      'other'
    ));
