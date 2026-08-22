-- Bespoke generation runs as its own background stage so the Studio and the
-- client portal can show real progress ("Designing homepage", "Building
-- service pages") instead of a spinner with no information behind it.
-- Generation is deliberately slow -- it is several sequential model calls
-- with a critique pass -- so it cannot run inside a request.
alter table public.build_jobs drop constraint build_jobs_stage_check;

alter table public.build_jobs
  add constraint build_jobs_stage_check
  check (stage in ('scrape','enrich','render','screenshot','qa','deliver','rebuild_inner_pages','go_live','bespoke'));
