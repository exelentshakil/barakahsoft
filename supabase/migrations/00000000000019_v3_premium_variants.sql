-- Phase K (v3): one new premium sibling per homepage section kind, built
-- from the new design-system primitives (src/components/site-shell/primitives).
-- Each is a genuine new catalog row alongside the existing default -- the
-- AI composition step (compose-sections.ts) can now pick it, but a bad
-- pick/failed call always still falls back to the existing shipped default,
-- same safety property as every other catalog row.
insert into public.section_variant_catalog (section_kind, variant_slug, industry_tags, component_path, description, is_default) values
  ('hero', 'split-image-premium', array['home-services','karting-recreation'], 'src/components/site-shell/sections/hero/HeroSplitImagePremium', 'Same split-image layout as the default, but with a decorative glow behind the photo, a real rating badge above the headline, and staggered entrance motion. The premium first impression -- prefer this whenever a real hero photo exists.', false),

  ('proof', 'stat-grid-premium', array['home-services','karting-recreation'], 'src/components/site-shell/sections/proof/ProofStatGridPremium', 'Same real rating/review stats as stat-grid, in gradient icon-badge tiles with a lift-hover instead of flat bordered boxes. Best whenever both a real rating and real review count exist.', false),

  ('services-grid', 'card-grid-premium', array['home-services','karting-recreation'], 'src/components/site-shell/sections/services-grid/ServicesCardGridPremium', 'Same real service cards as card-grid, with a photo zoom-on-hover, lift shadow, and arrow reveal. The premium default for any lead with real service photos.', false),

  ('reviews', 'carousel-premium', array['home-services','karting-recreation'], 'src/components/site-shell/sections/reviews/ReviewsCarouselPremium', 'Same real reviews as carousel, in a real drag/swipe carousel with arrow controls and dot pagination instead of a plain CSS scroll row. Best for a genuinely premium feel with any real review count.', false),

  ('trust-strip', 'badges-premium', array['home-services','karting-recreation'], 'src/components/site-shell/sections/trust-strip/TrustStripBadges', 'Same real trust items as bar, in a full-width gradient color-block band instead of a lightly-tinted strip. The premium default.', false),

  ('expertise', 'split-glow-premium', array['home-services','karting-recreation'], 'src/components/site-shell/sections/expertise/ExpertiseSplitGlow', 'Same real differentiator photo/bullets as split, with a decorative glow blob and an eyebrow label. The premium default whenever a real expertise photo exists.', false),

  ('cta-banner', 'gradient-premium', array['home-services','karting-recreation'], 'src/components/site-shell/sections/cta-banner/CtaBannerGradient', 'Same real phone CTA as centered, in a multi-stop gradient mesh band with soft glow accents instead of a flat solid-primary band. The premium default.', false),

  ('process', 'timeline-premium', array['home-services','karting-recreation'], 'src/components/site-shell/sections/process/ProcessTimeline', 'Same real process steps as steps, with gradient numbered badges connected by a line on desktop instead of plain flat circles. The premium default.', false),

  ('audience-segments', 'cards-premium', array['home-services','karting-recreation'], 'src/components/site-shell/sections/audience-segments/AudienceSegmentsCards', 'Same real audience segments as grid, with gradient icon badges and a hover-lift card. The premium default.', false),

  ('certifications', 'glow-premium', array['home-services','karting-recreation'], 'src/components/site-shell/sections/certifications/CertificationsGlow', 'Same real certification badges as badges, each in a glow-ringed pill instead of plain inline text. The premium default.', false);
