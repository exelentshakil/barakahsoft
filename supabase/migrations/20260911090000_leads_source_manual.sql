-- `manual` is a lead source the code already branches on, and the database
-- rejects.
--
-- Lead.source is typed "home" | "redesign" | "outreach" | "manual", and four
-- places read that last value: the admin list and the lead sidebar both sort
-- inbound leads above operator-added ones with
-- `source === "outreach" || source === "manual"`, and AdminLeadWorkspace uses
-- the same pair to decide whether to force the fallback business contact.
--
-- None of those branches can ever run. leads_source_check permits only home,
-- redesign and outreach, so an insert carrying `manual` fails outright with a
-- 23514 — which is what happens to anyone adding a lead by hand rather than
-- through /api/leads/add-url, since that route writes `outreach`.
--
-- Widening the constraint is the additive half of the fix: nothing stores
-- `manual` today, so no existing row changes, and the branches that already
-- reference it stop being dead.

alter table leads drop constraint if exists leads_source_check;

alter table leads
  add constraint leads_source_check
  check (source = any (array['home'::text, 'redesign'::text, 'outreach'::text, 'manual'::text]));
