-- v4 Phase N — reverses the earlier "never hotlinked" decision (plan §7) for
-- storage-cost reasons: site-photo and stock-fallback media_assets rows can
-- now point directly at their real source URL instead of a Supabase Storage
-- copy, when check-hotlink-safety.ts confirms it's safe. Default 'copied'
-- keeps every existing row's meaning unchanged after this migration.
alter table public.media_assets
  add column storage_mode text not null default 'copied'
    check (storage_mode in ('hotlink', 'copied'));
