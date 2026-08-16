-- v6 -- storage for the curated per-trade design-reference screenshot
-- library, resized/compressed once by scripts/upload-design-reference.ts
-- and read server-side (service role only) at generation time to feed real
-- vision-grounded composition. Never rendered on a public page, so this
-- bucket stays private (unlike lead-media). Path convention:
-- {persona-slug}/{n}.jpg.
insert into storage.buckets (id, name, public)
values ('design-reference', 'design-reference', false)
on conflict (id) do nothing;

create policy "service role reads design-reference"
  on storage.objects for select
  using (bucket_id = 'design-reference' and auth.role() = 'service_role');

create policy "service role writes design-reference"
  on storage.objects for insert
  with check (bucket_id = 'design-reference' and auth.role() = 'service_role');

create policy "service role updates design-reference"
  on storage.objects for update
  using (bucket_id = 'design-reference' and auth.role() = 'service_role');

create policy "service role deletes design-reference"
  on storage.objects for delete
  using (bucket_id = 'design-reference' and auth.role() = 'service_role');
