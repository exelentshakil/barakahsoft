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
  .bs-section--brand       SOLID brand-colour background, white text, white cards and buttons
  .bs-section--photo       full-bleed photographic band; its FIRST child is a .bs-media holding the
                           image, everything else goes in a .bs-container after it
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
  .bs-card--photo          a card whose FIRST child is a .bs-media — use this for service cards
  .bs-gallery              four-across work gallery of .bs-media squares
  .bs-trustbar             slim credential/stat strip, usually directly under the hero
  .bs-review               one review card: copy, then .bs-review__author with a .bs-review__avatar
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

HERO (the first section only)
  .bs-hero                 root, on the <section> alongside .bs-section. Full-bleed, min-height 92vh,
                           dark, and it paints its own scrim — you do not add one.
  .bs-hero--<archetype>    the assigned archetype modifier, given to you in the brief
  .bs-hero__bg             the background photo frame; put ONE <img> in it, nothing else
  .bs-hero__proofbar       optional credential strip pinned across the hero's bottom edge

ABOUT
  .bs-about                root, on the <section> alongside .bs-section
  .bs-about--<archetype>   the assigned archetype modifier, given to you in the brief

STATE / UTILITY
  .bs-center .bs-left .bs-right      text alignment
  .bs-hide-mobile .bs-hide-desktop
  .bs-accent .bs-muted .bs-invert    colour roles for a single element`;

export const STRUCTURE_CONTRACT = `STRUCTURE — the stylesheet is already written and shipped with the application. It styles these exact
shapes, so build these shapes. A class you invent has no rule behind it and renders as nothing.

A normal section:
  <section id="ID" class="bs-section [bs-section--tint|bs-section--ink]">
    <div class="bs-container"> … </div>
  </section>

The hero:
  <section id="hero" class="bs-section bs-hero bs-hero--ARCHETYPE">
    <div class="bs-hero__bg bs-media"><img src="…" alt="…" width="1600" height="900" loading="eager" fetchpriority="high"></div>
    <div class="bs-container">
      <div class="bs-split bs-split--wide-left">
        <div class="bs-stack"> eyebrow chip, h1.bs-display with one span.bs-mark, p.bs-lede, .bs-rating, .bs-actions </div>
        <form data-lead-form class="bs-form">
          <div class="bs-form__head"> <h2 class="bs-h3">…</h2> <p>…</p> </div>
          <div class="bs-stack--tight">
            <label class="bs-field"><input class="bs-input" name="name" placeholder="Full Name" required></label>
            … phone, email, service select …
            <button type="submit" class="bs-btn bs-btn--wide">PRIMARY LABEL</button>
            <p class="bs-small bs-center">one line of reassurance</p>
          </div>
        </form>
      </div>
    </div>
    <div class="bs-hero__proofbar"><div class="bs-container"> four short credential items </div></div>
  </section>

The hero has NO background of its own to set, NO overlay div, and NO nav — the section paints its
scrim, and the navigation is built separately.

A stat band:  <div class="bs-stats"><div class="bs-stat"><span class="bs-stat__value">10+</span><span class="bs-stat__label">Years</span></div>…</div>
A card grid:  <div class="bs-grid-3"><article class="bs-card">…</article>…</div>
A photo:      <figure class="bs-media bs-media--wide"><img …></figure>  (never an empty frame)`;

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

export const CONVERSION_RULES = `CONVERSION AND IMPACT — this is a sales page for a local business, not a brochure.

1. The hero carries a real lead-capture form. Not a link to one, not a button that scrolls: the form
   itself, in the first screen, as an elevated card with a solid brand-coloured header bar.
2. Headlines are LOUD. The hero h1 is the largest thing on the page by a wide margin, set in the
   display face at its heaviest weight, with tight leading and one line or phrase in the brand
   colour. A polite, evenly-sized headline is the single most common way one of these pages fails.
3. Every section below the hero ends with a way to act: a primary button, a click-to-call link, or
   both. Never let a visitor reach the bottom of a section with nowhere to go.
4. The phone number is a real tel: link everywhere it appears, and it appears often.
5. Proof is specific and visible: the star rating, the review count, the named platforms, the
   warranty length, the credentials. Vague reassurance persuades nobody.
6. Buttons look like buttons — solid fill, generous padding, real weight. Never two ghost buttons
   side by side, and never a primary action rendered as a text link.
7. A section that is only text is a wasted section. Give every one a visual anchor: a photograph, a
   stat band, an inline SVG glyph set, a quote plate, a numbered rail or a bordered card grid.`;
