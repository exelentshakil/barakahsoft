-- Per-page stylesheets.
--
-- Generated pages were composed from a fixed class vocabulary, which capped
-- how good the layout could be: the model could only assemble bricks that
-- already existed. Content came out strong and the arrangement did not.
--
-- Writing the CSS per page removes that ceiling, and removes the original
-- reason the vocabulary existed at all — a class could not resolve to
-- nothing, because the model that names a class also writes its rule.
--
-- The stylesheet is scoped and sanitised before storage. Interactions are
-- NOT stored here: those come from a reviewed runtime in the application,
-- driven by data attributes, because arbitrary model-authored JavaScript on
-- a client's public site is a different risk category entirely.
alter table public.artifacts
  add column bespoke_css text;

comment on column public.artifacts.bespoke_css is
  'Per-page stylesheet. Every selector is scoped to .bespoke-page before storage.';
