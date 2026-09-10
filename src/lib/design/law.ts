// The design law, in one place, injected verbatim into every prompt.
//
// Two halves, and the second matters more.
//
// Half one is prohibitions. A page satisfying all of them is inoffensive, and
// inoffensive does not sell a build — which is what half two is for. Every
// rule in half two is a measurable minimum, and the audit reports a page that
// clears half one and fails half two as timid.

export const DESIGN_LAW = `
THE DESIGN LAW — half one, the safety floor

CONTRAST. Body text at least 7:1 against its ground. Large display at least
4.5:1. This is measured on the rendered page, not taken on trust.

DARKNESS IS NOT THE ENEMY; LOW CONTRAST IS. A dark section is welcome wherever
it clears the floor. Premium work uses dark grounds at 14:1 and reads
perfectly. What is banned is grey-on-charcoal at 3:1, not darkness itself.

COLOUR BUDGET, roughly 60/30/10. Sixty per cent neutral ground, thirty per
cent supporting structure, ten per cent brand. Brand is an accent — calls to
action, emphasis, rules, icons, active states. Never a full-bleed ground
behind paragraphs. Two accent hues at most. No gradient soup.

NO CHEAP CARD SOUP. A card must earn itself. Hairline borders, not heavy ones.
Subtle shadow or none. Never stack heavy radius, a border and a drop shadow on
the same element. One radius across the page, two at most.

TYPOGRAPHY. Two families maximum. Measure between 60 and 75 characters.

GRID DISCIPLINE. One grid, one max width, everything aligned to it. No
arbitrary one-off margins.

THE DESIGN LAW — half two, the ambition floor

These are requirements, not permissions. A page that misses them is reported
as timid and sent back.

- Scale contrast at least 8:1 between display and body; display at least 88px
  at desktop. Timid type is the loudest amateur tell.
- The hero fills at least 85vh and carries no more than 12 words.
- At least three full-bleed moments breaking the content column.
- At least one deliberate grid break — an overlap, an offset, a rotation, an
  asymmetry that means something.
- Section padding at least 96px, and the largest single whitespace gap on the
  page above 160px. The nerve to leave sixty per cent of a screen empty is
  what reads as expensive.
- Photography is the primary material, not decoration: one image at 70vh or
  taller, one dramatic crop, one bleed off the edge.
- A motion budget — entrance reveals, one scroll-linked behaviour, hover
  states on everything interactive.
- One editorial device carried through the whole page: oversized numerals, a
  seal, marginalia, an index, vertical rules, a repeated marque. One idea,
  repeated, is what separates designed from assembled.
- Texture. A grain or material layer. Nothing is bald flat colour.

THE ORGANISING IDEA

The page states one idea in a sentence, and every composition decision traces
back to it. An agency page expresses a concept. An assembled page expresses a
section list.
`.trim();

/**
 * How the model is allowed to express any value at all.
 *
 * The single rule the whole pipeline rests on. A model choosing #3a5a45 and
 * 18px is guessing at problems the engines solved with colour science and font
 * metrics, and its guesses are what make generated pages read as machine-made.
 */
export const TOKEN_CONTRACT = `
YOU NEVER TYPE A VALUE

Not a hex code, not a pixel size, not a font name, not a duration. Every one of
those is already solved and waiting in a custom property. A literal in your
output is a bug the audit reports.

COLOUR — text tokens and fill tokens are different things, and mixing them is
the single mistake that gets a build rejected.

  TEXT on a light ground     var(--ink) var(--ink-2) var(--ink-3)
  TEXT on a dark ground      var(--on-dark) var(--on-dark-2)
  ACCENT TEXT, any ground    class="accent" — it resolves itself, correctly,
                             on whichever ground it is sitting on
  MUTED TEXT, any ground     class="muted" — likewise

  FILLS, never text          var(--brand) var(--brand-ground) var(--brand-wash)
                             var(--dark) var(--dark-2) var(--paper-2) var(--paper-3)
  TEXT ON A FILL             var(--on-brand) over --brand
                             var(--on-brand-ground) over --brand-ground

  RULES AND BORDERS          var(--line) var(--line-strong) var(--rule)
                             border-color and background only. Never color:.
  ALPHA                      rgb(var(--ink-rgb) / 12%) rgb(var(--brand-rgb) / 8%)

  DECORATIVE TYPE — an oversized watermark numeral, a background letterform,
  a repeated marque — carries aria-hidden="true". It is not read aloud and it
  is not held to the reading contrast floor, which is what lets it be as faint
  as the design wants. Without the attribute it is treated as content and its
  contrast is measured.

  NEVER write color: var(--brand). It is a fill. As text it measures under 4:1
  against both the light ground and the dark one, so a page that does it fails
  the contrast floor and is sent back. If you want brand-coloured text, the
  answer is always class="accent".

TYPE     var(--fs-0) … var(--fs-8), with var(--tr-N) tracking and var(--lh-N)
         leading to match. var(--font-display) var(--font-body) var(--measure)
         Shorthands: var(--fs-body) var(--fs-display) var(--lh-body)

SPACE    var(--s-0) … var(--s-9) for every margin, padding and gap.
         var(--section-y) var(--section-y-lg) var(--gutter) var(--maxw)
         var(--overlap-1) var(--overlap-2) var(--overlap-3) var(--radius)

MOTION   var(--dur-fast) var(--dur) var(--dur-slow) var(--ease) var(--travel)

LAYOUT   .wrap .section .section-lg .bleed-wide .bleed-full
         .split (set --cols to var(--split-major) / --split-minor /
         --split-lead / --split-trail) .grid (set --cols-n) .stack .cluster
         .switcher .sidebar .measure
         .pull-up-1 .pull-up-2 .pull-in-1 .pull-in-2 for on-grid overlap
         .cap-display .cap-body to trim a heading to its cap height

You may write any CSS you like on top of these, invent any class names you
want, and compose any structure the page needs. What you may not do is type a
literal where a token exists.
`.trim();

/**
 * The mechanisms the application owns.
 *
 * Everything visual is the model's. These two are not, because they are the
 * money path: a generated script that breaks form submission loses the lead
 * silently while the page still looks perfect.
 */
export const MECHANISM_CONTRACT = `
INTERACTION

No <script> tags. Behaviour is requested with data attributes and implemented
by reviewed application code:

  data-open-quote-modal   on any call-to-action button or link
  data-lead-form          on a lead capture form (never write an action=)
  data-reveal             on anything that should animate in on scroll
  data-reveal-delay       a stagger index
  data-count-to           an animating number, with data-count-suffix
  data-accordion          with data-accordion-item / -trigger
  data-review-slider      with data-review-track / -prev / -next
  data-nav data-nav-toggle data-nav-drawer data-nav-close data-sticky-nav

FACTS

Never invent a price, a person, a review, a certification, a statistic or a
year. Anything listed as verified is printed exactly as supplied. Anything
listed as missing is designed around, not filled in with a plausible guess.

IMAGES

Only URLs from the supplied manifest, each with its data-slot attribute intact
so a photograph can be swapped later without rebuilding the page.
`.trim();

export const SECTION_BAND: [number, number] = [8, 14];
