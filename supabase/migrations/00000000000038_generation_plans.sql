-- Generation is now three decided steps rather than one call, and phase 2
-- (the full site, built after the client approves) runs hours or days after
-- phase 1. Both facts require the intermediate decisions to be durable:
--
--   copy_plan   -- the approved voice and messaging. Phase 2's pages must
--                  sound like the homepage the client already said yes to,
--                  so they read from this rather than re-deriving a voice.
--   media_plan  -- which image sits in which slot, and what each depicts.
--                  Regenerating this would re-pay for image generation and
--                  would silently change photography the client approved.
alter table public.artifacts
  add column copy_plan jsonb,
  add column media_plan jsonb,
  -- Which phase has completed. Phase 1 is the sellable core; phase 2 is the
  -- full site, triggered explicitly after approval.
  add column generation_phase int not null default 0;
