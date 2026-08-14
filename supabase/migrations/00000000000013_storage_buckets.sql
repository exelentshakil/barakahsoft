-- Public-read bucket for every image on a generated lead site (the page is
-- public, so the image must be). Write access restricted to service_role.
-- Path convention: {lead_id}/{source}/{filename}.
insert into storage.buckets (id, name, public)
values ('lead-media', 'lead-media', true)
on conflict (id) do nothing;

create policy "public read lead-media"
  on storage.objects for select
  using (bucket_id = 'lead-media');

create policy "service role writes lead-media"
  on storage.objects for insert
  with check (bucket_id = 'lead-media' and auth.role() = 'service_role');

create policy "service role updates lead-media"
  on storage.objects for update
  using (bucket_id = 'lead-media' and auth.role() = 'service_role');

create policy "service role deletes lead-media"
  on storage.objects for delete
  using (bucket_id = 'lead-media' and auth.role() = 'service_role');
