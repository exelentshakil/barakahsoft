-- The client's own Facebook Pixel ID, for tracking visitors on THEIR
-- delivered site once they provide it (typically post-purchase) --
-- explicitly separate from BarakahSoft's own pixel (src/lib/meta-pixel.ts),
-- which tracks the lead-gen intake funnel, a different concern entirely.
-- Nullable: most leads won't have one until the client supplies it.
alter table public.leads
  add column facebook_pixel_id text;
