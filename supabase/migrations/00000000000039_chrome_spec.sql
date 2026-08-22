-- Per-lead header and footer design.
--
-- Every delivered site shared one hand-built mega menu and one footer, so
-- however bespoke the page body was, the frame around it announced that the
-- site came off a production line.
--
-- The chrome is specified rather than generated as markup: navigation
-- carries real routing, click tracking and the quote modal, and
-- model-authored nav markup is how sites end up with links to pages that
-- do not exist. The spec chooses archetype, density and treatment from the
-- lead's design DNA; React renders it.
alter table public.artifacts
  add column chrome_spec jsonb;
