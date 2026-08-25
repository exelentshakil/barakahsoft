-- A homepage refinement changes markup, stylesheet and addressable sections
-- together. Keep that set together so restoring a version cannot pair old
-- HTML with today's CSS.
alter table public.page_versions
  add column if not exists bespoke_css text,
  add column if not exists bespoke_sections jsonb;
