-- v4 (post-launch pivot) — narrows the intake persona selector from the
-- generic 7-option list to the 10 specific home-services trades the
-- business is now exclusively focused on, matching how a real competitor
-- agency (ferociousmedia.com/home-services/) structures its own "Trades We
-- Serve" page. Existing rows using a retired slug get remapped to the
-- closest equivalent before the new constraint is added, so the migration
-- doesn't fail validating old data.
update public.leads
set persona = 'other-trade'
where persona in ('local-business-owner', 'solo-service-provider', 'home-service-business-owner', 'salon-beauty', 'agency-freelancer', 'other');

update public.leads
set persona = 'contractors'
where persona = 'contractor-tradesperson';

alter table public.leads
  drop constraint if exists leads_persona_check;

alter table public.leads
  add constraint leads_persona_check check (persona in (
    'contractors',
    'electricians',
    'homebuilders',
    'hvac',
    'movers',
    'pest-control',
    'plumbers',
    'remodelers',
    'restoration',
    'roofers',
    'other-trade'
  ));
