-- v6 Phase DD -- for 6 kinds (trust-strip, expertise, cta-banner, process,
-- audience-segments, certifications) the composer had exactly one catalog
-- row each (always the premium slug), so selectSectionVariants literally
-- had no real choice to make for these kinds -- the plain default variant
-- has always existed as a component (registry.ts's DEFAULT_VARIANT) but
-- never had a catalog row, so the AI could never pick it. This adds:
-- 1) a real base row for each kind's existing default component, and
-- 2) one new "-alt" variant per kind, built from real vision analysis of
--    the design-reference roofer screenshots (specific patterns: a dark
--    edge-to-edge utility bar, a bordered card grid, a numbered-index
--    process treatment, a split-card CTA, wide audience-split cards, and a
--    compact logo-style certification strip).
insert into public.section_variant_catalog (section_kind, variant_slug, industry_tags, component_path, description, is_default) values
  ('trust-strip', 'bar', array['home-services','karting-recreation','salon-beauty','agency-freelancer'], 'src/components/site-shell/sections/trust-strip/TrustStripBar', 'A calm, tinted single-row strip of trust signals (rating, phone, license) — understated, blends with the page background.', true),
  ('trust-strip', 'utility-bar-premium', array['home-services','karting-recreation','salon-beauty','agency-freelancer'], 'src/components/site-shell/sections/trust-strip/TrustStripUtilityBar', 'A compact, solid dark utility bar with signals spread edge-to-edge — reads as an authoritative top-of-page credential strip.', false),
  ('expertise', 'split', array['home-services','karting-recreation','salon-beauty','agency-freelancer'], 'src/components/site-shell/sections/expertise/ExpertiseSplit', 'A two-column split: a real photo on one side, a short bulleted list of reasons on the other.', true),
  ('expertise', 'card-grid-alt', array['home-services','karting-recreation','salon-beauty','agency-freelancer'], 'src/components/site-shell/sections/expertise/ExpertiseCardGrid', 'No photo required — a structured grid of bordered cards, each with an icon badge, title, and description. Works well when there is no differentiator photo.', false),
  ('cta-banner', 'centered', array['home-services','karting-recreation','salon-beauty','agency-freelancer'], 'src/components/site-shell/sections/cta-banner/CtaBannerCentered', 'A simple centered full-width color band with a headline and one call button.', true),
  ('cta-banner', 'split-card-alt', array['home-services','karting-recreation','salon-beauty','agency-freelancer'], 'src/components/site-shell/sections/cta-banner/CtaBannerSplitCard', 'A contained, bordered two-column card — headline on one side, a distinct phone-call block on the other — instead of a full-bleed band.', false),
  ('process', 'steps', array['home-services','karting-recreation','salon-beauty','agency-freelancer'], 'src/components/site-shell/sections/process/ProcessSteps', 'Small numbered circles above each step — compact and simple.', true),
  ('process', 'numbered-index-alt', array['home-services','karting-recreation','salon-beauty','agency-freelancer'], 'src/components/site-shell/sections/process/ProcessNumberedIndex', 'Oversized "01/02/03/04" index numerals in the brand gradient with a thin divider line — a bolder, more editorial step treatment.', false),
  ('audience-segments', 'grid', array['home-services','karting-recreation','salon-beauty','agency-freelancer'], 'src/components/site-shell/sections/audience-segments/AudienceGrid', 'A 4-across grid of small bordered cards, one per customer segment.', true),
  ('audience-segments', 'split-alt', array['home-services','karting-recreation','salon-beauty','agency-freelancer'], 'src/components/site-shell/sections/audience-segments/AudienceSegmentsSplit', 'A couple of large, wide split cards (best for 2-3 segments like residential vs commercial) with more visual weight than a 4-across grid.', false),
  ('certifications', 'badges', array['home-services','karting-recreation','salon-beauty','agency-freelancer'], 'src/components/site-shell/sections/certifications/CertificationBadges', 'Plain inline icon+text badges in a centered row.', true),
  ('certifications', 'logo-strip-alt', array['home-services','karting-recreation','salon-beauty','agency-freelancer'], 'src/components/site-shell/sections/certifications/CertificationsLogoStrip', 'A compact, evenly-spaced strip of bordered badge chips — reads closer to a real manufacturer/accreditation logo row.', false)
on conflict (section_kind, variant_slug) do nothing;
