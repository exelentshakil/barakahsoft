-- Per-lead outreach copy, written by the model and reviewed by an operator.
--
-- The sequence in lib/outreach/sequence.ts is one set of words sent to every
-- prospect, so the strongest line in it — "your site is slow enough on a
-- phone that people are leaving before it loads" — is asserted about
-- businesses whose sites are fine. A claim that is wrong on arrival is worse
-- than a generic one.
--
-- Drafts are stored rather than generated at send time so an operator reads
-- the thing before a real business does. Cold email is the one place in this
-- product where a model's output reaches a stranger unaccompanied.
alter table public.leads
  add column if not exists outreach_draft jsonb;

comment on column public.leads.outreach_draft is
  'Model-written stage-1 outreach: {subject, body, hook, model, generatedAt}. Reviewed by an operator before sending; cleared when sent.';
