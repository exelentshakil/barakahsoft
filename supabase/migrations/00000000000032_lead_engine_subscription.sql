-- One active commercial subscription per lead. Required for idempotent
-- Stripe webhook upserts for the managed lead-engine service.
create unique index if not exists subscriptions_lead_id_key on public.subscriptions(lead_id);
