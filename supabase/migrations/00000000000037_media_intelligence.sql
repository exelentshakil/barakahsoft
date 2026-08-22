-- Media intelligence, v9.
--
-- Two failures this addresses, both confirmed on the York lead:
--
-- 1. Generated pages hotlinked Google Places photo URLs, which carry the
--    account's Places API key as a query parameter. Every delivered site
--    published that key in page source. Photos are now mirrored into
--    Storage at ingest, so a credential-bearing URL is never a candidate.
--
-- 2. Photos had no usable description. The existing captioner infers from
--    surrounding page text and only for hashed filenames, so Google photos
--    -- which have no page context at all -- always came back null. The
--    generator was choosing images blind, which is how a chandelier became
--    the hero of an electrical contractor and building photos were
--    captioned as named people. Captions now come from actually looking at
--    the image.
alter table public.media_assets drop constraint media_assets_source_check;

alter table public.media_assets
  add constraint media_assets_source_check
  check (source in ('site','gbp','unsplash','pexels','upload','generated'));

alter table public.media_assets
  -- What the image actually depicts, from vision. The generator reads this
  -- to place images semantically instead of by position in a list.
  add column caption text,
  -- Coarse classification, so a slot can require a matching subject:
  -- 'work' (job in progress), 'team' (real people), 'property', 'vehicle',
  -- 'product', 'interior', 'exterior', 'logo', 'unusable'.
  add column subject text,
  -- Whether this image is good enough to put on a premium page at all.
  add column usable boolean not null default true,
  -- For generated imagery: the prompt it came from, so a regeneration is
  -- reproducible and an operator can see why an image looks how it does.
  add column generation_prompt text;

create index media_assets_lead_usable_idx on public.media_assets (lead_id, usable, subject);
