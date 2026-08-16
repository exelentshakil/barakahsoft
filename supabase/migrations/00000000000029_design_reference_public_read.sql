-- v6.1 -- the design-reference bucket (real premium competitor/industry
-- screenshots) now also powers a public "the caliber we build to" showcase
-- on the marketing landing page, not just server-side vision-model input.
-- These are resized copies of already-publicly-visible business websites,
-- so nothing new is exposed by making the bucket public-read; writes stay
-- service-role-only exactly as before.
update storage.buckets set public = true where id = 'design-reference';

create policy "public read design-reference"
  on storage.objects for select
  using (bucket_id = 'design-reference');
