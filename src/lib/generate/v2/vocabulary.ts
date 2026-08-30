// The fixed class vocabulary shared by the stylesheet writer and every
// section writer.
//
// This is the mechanism that lets ~20 sections be written in PARALLEL by
// separate model calls without the page falling apart. The design system
// call chooses the VALUES (colour, type scale, radii, shadow, density,
// section rhythm); it does not get to invent class names. Every section
// call then writes markup against the same names it can see here, so a
// section written by one call and a section written by another are styled
// by the same rules and cannot drift.
//
// A section that genuinely needs something the vocabulary cannot express
// returns a small extra CSS block scoped to its own #id, which is appended
// after the system stylesheet. That is the only escape hatch, and because
// it is id-scoped it can never leak into another section.

export const CLASS_VOCABULARY = `THE CLASS VOCABULARY — these names are fixed. Never rename them, never invent an
alternative for something already listed, and never use Tailwind utility classes
(no bg-*, text-*, flex, grid, p-4, md:*). Tailwind is NOT loaded on the page.

LAYOUT
  .bs-section              every top-level <section>. Owns the vertical rhythm.
  .bs-section--tint        quiet tinted background variant
  .bs-section--ink         dark inverted background variant (text flips automatically)
  .bs-section--flush       removes vertical padding (for full-bleed media bands)
  .bs-container            max-width wrapper with the page gutter
  .bs-container--narrow    reading-width wrapper (~72ch)
  .bs-split                two-column grid, collapses to one column under 900px
  .bs-split--reverse       image column second on desktop, first on mobile
  .bs-split--wide-left     55/45 split
  .bs-split--wide-right    45/55 split
  .bs-grid-2 / .bs-grid-3 / .bs-grid-4   equal card grids, collapse responsively
  .bs-stack                vertical flow with the standard gap
  .bs-stack--tight         vertical flow, half gap
  .bs-row                  horizontal flow, wraps, standard gap
  .bs-row--between         horizontal flow, space-between
  .bs-overlap-up           pulls the block up into the previous section
  .bs-bleed                full-viewport-width block inside a container

TYPE
  .bs-eyebrow              small capitalised label above a heading
  .bs-eyebrow--chip        the same as a solid filled chip
  .bs-display              hero-scale headline (use once, on the h1)
  .bs-h2 / .bs-h3 / .bs-h4 section and card headings
  .bs-lede                 the paragraph directly under a heading
  .bs-body                 ordinary body copy
  .bs-small                fine print / captions
  .bs-mark                 wraps the ONE emphasised phrase inside a headline
  .bs-quote                pull-quote block
  .bs-signature            the founder's signature line

ACTION
  .bs-btn                  primary action
  .bs-btn--ghost           secondary outlined action
  .bs-btn--light           action on an ink background
  .bs-btn--wide            full-width action
  .bs-link-call            click-to-call link with its icon
  .bs-actions              the row that holds two actions

SURFACE
  .bs-card                 elevated content card
  .bs-card--flat           bordered, no shadow
  .bs-card--ink            dark card
  .bs-panel                large surface panel (used by hero form, about card)
  .bs-media                image frame; direct child <img> is object-fit: cover
  .bs-media--tall / --wide / --square   aspect ratios 3/4, 16/9, 1/1
  .bs-collage              asymmetric photo collage container
  .bs-badge                small pill of proof (licensed, insured, warranty)
  .bs-chip                 compact labelled tag
  .bs-stat                 one statistic: .bs-stat__value + .bs-stat__label
  .bs-stats                the band that holds them
  .bs-rating               star row + rating text
  .bs-icon                 24px inline SVG wrapper
  .bs-rule                 the recurring accent rule motif
  .bs-marker               the recurring numbered marker motif
  .bs-founder-badge        the founder identity plate (logo tile + name plate)

FORM
  .bs-form                 the lead form (must carry data-lead-form)
  .bs-form__head           its coloured header bar
  .bs-field                one labelled field wrapper
  .bs-input / .bs-select / .bs-textarea

CHROME
  .bs-nav / .bs-nav__bar / .bs-nav__logo / .bs-nav__links / .bs-nav__actions
  .bs-utility              the slim bar above the nav
  .bs-footer / .bs-footer__cols / .bs-footer__col / .bs-footer__bottom
  .bs-footer-cta           the conversion slab attached to the footer

STATE / UTILITY
  .bs-center .bs-left .bs-right      text alignment
  .bs-hide-mobile .bs-hide-desktop
  .bs-accent .bs-muted .bs-invert    colour roles for a single element`;

export const MOCKUP_RULES = `SOCIAL-MOCKUP RULES — the hero and the about section are screenshotted and
placed on a laptop mockup for social posts. These are hard failures, not taste:

1. The hero must fill the first screen: min-height 92vh on desktop, and every
   word of the headline, subhead, rating strip and both actions must be inside
   that first screen with at least 24px of clearance. Nothing may be clipped by
   the section's own bounds, and no text may be cut off mid-line.
2. The logo in the nav is set with max-height:52px and width:auto. A logo is
   NEVER the hero background, never a full-width image, and never scaled to
   fill a container. If the only supplied image is the logo, the hero uses a
   flat brand-coloured or ink background with a subtle motif instead of a photo.
3. Every photograph is object-fit: cover inside a fixed-aspect frame. Never
   distort, never letterbox, never leave an image at its intrinsic size.
4. Text over a photograph always sits on a scrim: a gradient or a solid plate
   giving at least 4.5:1 contrast. Never white text directly on a light photo.
5. The founder badge, rating badge and any overlapping chip must sit fully
   inside the image they overlap, and must never cover body copy or a heading.
   Give them their own stacking context and enough offset that they read as
   deliberate.
6. The about section must be a self-contained composition that still reads
   when cropped to 16:10 — headline, image and one proof element inside that
   crop, with no element bisected by the crop line.
7. The nav sits above everything (z-index 100). Nothing from the hero may
   overlap it, and the hero's top padding must clear the nav's full height.
8. No horizontal scrollbar at any width. No element wider than 100%.
9. Two actions side by side must wrap as a pair, never overlap, and never
   leave one button orphaned on its own line at desktop widths.`;

export const COPY_RULES = `COPY RULES
- Write for the buyer of this specific trade in this specific city. Never
  generic marketing filler, never "welcome to our website".
- Use only supplied facts. Never invent a credential, an award, a year count,
  a certification, a metric or a review. If a fact is not supplied, write
  around it rather than fabricating it.
- Numbers that ARE supplied should be used prominently.
- The primary action wording is identical everywhere it appears.
- No em-dash-prefixed eyebrows, no "unlock", "elevate", "seamless", "dive in".`;
