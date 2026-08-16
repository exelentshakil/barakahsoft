-- v4 Phase S3 — every existing section_variant_catalog row is driven
-- entirely by per-lead color/font/photo tokens (Phase J), not hardcoded
-- industry visuals, so the two new playbooks (salon-beauty,
-- agency-freelancer) need no new component variants — just these two tags
-- added so loadSectionVariantCatalog's `.contains("industry_tags", [...])`
-- filter actually returns rows for a lead detected/self-identified as
-- either one. A lead-specific hero/grid treatment per vertical stays an
-- explicit stretch goal for a later pass.
update public.section_variant_catalog
set industry_tags = industry_tags || array['salon-beauty', 'agency-freelancer']
where not (industry_tags @> array['salon-beauty']);
