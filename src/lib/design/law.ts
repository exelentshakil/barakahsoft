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

THE DESIGN LAW — half two, the balance band

Every rule here has a floor AND a ceiling, and the ceiling is not optional.
A floor on its own is an instruction to maximise, and a page that maximises
all of them at once is not ambitious, it is unreadable: thirteen screens of
enormous headings with almost nothing under them. Land inside the band.

- TYPE. The hero headline is the only thing that may run large: 48-96px.
  Section headings are 28-48px. Body is 17-19px. The ratio between the hero
  and the body sits between 3.2 and 5 — past that the page stops being a
  website and becomes a poster.
- HERO. 70-92vh, a headline of 4-12 words, and it carries supporting copy and
  a call to action as well. A screen holding nothing but five giant words is
  a title slide, not a homepage.
- FULL BLEED. Two to five moments that break the content column. Nineteen is
  not emphasis; when everything is full width, nothing is.
- GRID BREAK. One or two deliberate ones. More reads as a mistake repeated.
- SPACE. Section padding 72-144px. The largest single gap on the page stays
  between 120 and 320px. A 600px hole is not confidence, it is a missing
  section.
- PHOTOGRAPHY is the primary material: one image between 45 and 90vh, one
  dramatic crop, one bleed off the edge. Nothing taller than the screen.
- LENGTH. The whole page is 4 to 9 screens at 1440x900. Past that a visitor
  is scrolling through filler to reach the phone number.
- MOTION. Entrance reveals and hover states on everything interactive, but
  under a third of the page's elements. Everything moving is noise.
- ONE editorial device carried through: oversized numerals, a seal,
  marginalia, an index, vertical rules, a repeated marque.
- TEXTURE. A grain or material layer. Nothing is bald flat colour.

DENSITY — the rule the band exists to protect

A section is not a heading with space around it. Every section carries real
content: a list of services with what each one covers, prices in a table,
people with their roles, questions with answers, steps with what happens at
each. Most sections should hold 40 words or more.

This is what makes a page worth reading and worth paying for. A visitor
deciding whether to call is looking for what you do, what it costs and who
turns up — and a page that answers none of those, however beautifully set,
sells nothing. Aim for the density of a good product marketing page: clear
sections, real information, generous but not empty.

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

         var(--fs-8) IS THE HERO HEADLINE AND NOTHING ELSE. Use it once, on
         the h1. A section heading is var(--fs-5) or var(--fs-6); a card or
         sub-heading is var(--fs-3) or var(--fs-4). Setting every h2 at the
         top of the scale is what turns a page into a stack of title slides.
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
