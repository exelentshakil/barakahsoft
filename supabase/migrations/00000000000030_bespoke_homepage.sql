-- v8 -- real generative homepage: Gemini generates the actual HTML for the
-- homepage (informed by real reference screenshots for the trade), instead
-- of the AI picking an enum slug from the section_variant_catalog. Nullable
-- and additive -- a lead with no bespoke_homepage_html (legacy leads, or a
-- trade with no reference screenshots yet) falls back to the existing
-- catalog-based HomeServicesV1Shell unchanged, so this never breaks an
-- already-delivered site.
alter table public.artifacts
  add column bespoke_homepage_html text,
  add column bespoke_rationale text;
