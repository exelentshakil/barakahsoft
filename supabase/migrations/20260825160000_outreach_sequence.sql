-- Where each outreach prospect sits in the cold sequence.
--
-- The sequence is three touches and then it stops: a free rebuilt concept,
-- a short bump two days later, and a final note handing over the files with
-- no obligation. Tracking the stage on the lead is what makes "show me
-- everyone due the 48h bump" a query rather than a spreadsheet.
--
-- Nothing here sends anything. Advancing a stage is recorded only after an
-- operator has actually sent that touch.

alter table public.leads
  -- 0 = added, nothing sent yet. 1..3 = that touch has been sent.
  add column if not exists outreach_stage integer not null default 0,
  add column if not exists outreach_last_sent_at timestamptz,
  -- Set when a prospect replies or is manually retired, so the sequence
  -- stops for them without deleting the lead.
  add column if not exists outreach_stopped_at timestamptz;

alter table public.leads
  drop constraint if exists leads_outreach_stage_check;

alter table public.leads
  add constraint leads_outreach_stage_check check (outreach_stage between 0 and 3);

-- The list this powers is always "outreach prospects at stage N, oldest
-- contact first", so the index matches that shape.
create index if not exists leads_outreach_idx
  on public.leads (outreach_stage, outreach_last_sent_at nulls first)
  where source in ('outreach', 'manual') and outreach_stopped_at is null;
