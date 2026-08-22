# The BarakahSoft design standard

One page. Every rule here is either enforced by `src/lib/audit/quality-gate.ts`
or written into the generator prompts in `src/lib/generate/`. Nothing in it is
taste — each line exists because a page failed without it.

Read this before editing any generated site, by hand or with an agent.

---

## 0. The stance

You are a **Senior UI/UX Architect and Conversion Rate Optimiser**, not a coder
decorating a page. The only measure of success is that a visitor understands the
offer within four seconds and takes exactly one action.

**Clarity beats artistry every time.** Where a decision is between looking clever
and being understood, choose understood.

---

## 1. Colour — 60 / 30 / 10

| Share | Role | Tokens |
|---|---|---|
| **60%** | Canvas. Backgrounds, mostly empty. | `--bs-surface`, `--bs-surface-alt` |
| **30%** | Structure. Text, borders, cards, dividers. | `--bs-ink`, `--bs-ink-muted`, `--bs-border-color` |
| **10%** | Action. Almost nowhere but the primary CTA. | `--bs-primary` |

An accent that appears eight times is not an accent, it is a theme — and it
leaves the button nothing to stand against.

- Body text clears **4.5:1** against whatever sits behind it. Computed, not judged.
- **Never `#000000`.** Pure black on a dark ground maximises contrast to the point
  of eye fatigue and is the clearest tell of an unconsidered palette. The tokens
  carry a soft charcoal instead. *Blocker.*
- Never a saturated brand colour as body text. Accent-coloured text uses
  `--bs-primary-on-surface`, which is the accent corrected for readability.
- No literal hex, `rgb()`, font or shadow anywhere. *Blocker above 6 literals.*

## 2. Typography

**Two families, maximum.** One display face, one highly legible body face. A
third is clutter. *Warning above two.*

| | Target |
|---|---|
| Hero heading | 40–48px desktop, via `clamp()` |
| Section headings | Step down clearly — never within 2px of each other |
| Body | 16–18px at **1.5–1.65** line-height |
| Measure | **45–75 characters**, set as `max-width` in `ch` |

Squashed line-height reads as cheap faster than any other single property.
Beyond 75 characters the eye loses its place returning to the left margin.

`text-wrap: balance` on headings, `pretty` on paragraphs. Letter-spacing on
uppercase labels only, never on body text.

## 3. Space is the product

| | Target |
|---|---|
| Section vertical padding | **96–128px** desktop, `clamp()` to scale down |
| Container padding | **24–32px** |
| Whitespace | At least **40%** of any screen stays empty |
| Grid | 12 columns desktop, fluid 4-column feel on mobile |
| Tap targets | **≥44px** tall on mobile |

Whitespace is what steers the eye to the offer. A crowded page hides its own
call to action, and a button a thumb misses is a lost enquiry.

## 4. Conversational psychology

- **F-shaped reading.** Western readers sweep left along the top, then down the
  left margin. The promise, the proof and the primary action live on those lines.
  A CTA floated right mid-section is a CTA nobody sees.
- **Forms are short or stepped.** A wall of fields kills a conversion. Ask for
  the minimum that allows a follow-up, and say what happens next.
- **Trust anchors go inside the conversion moment** — next to the button, not in
  a section of their own three screens away. Hesitation happens at the point of
  action, so the reassurance belongs there.

## 5. Code hygiene

- **Semantic integrity.** `<main>`, `<section>`, `<article>`, `<aside>`,
  `<figure>`, `<blockquote>`, `<ul>`, `<dl>` — endless nested `<div>` is
  forbidden. The structure must read without the CSS. *Blocker if zero semantic
  elements; warning above 8 divs per semantic element.*
- Exactly one `<h1>`, and a heading hierarchy that steps down properly.
- **Every `<img>` carries explicit `width` and `height`.** Without them the page
  shifts as images arrive, which Google measures. *Blocker if more than half
  are missing them.*
- Hero image: `loading="eager" fetchpriority="high"`. Everything else: `loading="lazy"`.
- No `<style>`, no `<script>`, no inline visual `style` attributes — all stripped.
- No `<header>`, `<nav>` or `<footer>` in generated body markup; those are real
  components rendered around it.
- Motion comes from data attributes only: `data-reveal`, `data-reveal-delay`,
  `data-count-to`, `data-accordion`, `data-bar`. The runtime implementing them
  is reviewed application code — see `BespokeRuntime.tsx`.
- Every transition wrapped in `@media (prefers-reduced-motion: no-preference)`.
- `:hover` on everything clickable, `:focus-visible` on everything interactive.
  *Both blockers.*

## 6. Truth

Every **fact** comes from the brief and nowhere else — no price, founding year,
certification, award, guarantee, rating or testimonial that is not in the data.
The **framing** is yours: if hours say open 24 hours, "Someone picks up at 3am"
is fair game.

Never write about the source data or about the website itself.

Phrases that have each come from real rejected output, and are banned:
counting things in a heading ("Five clear service paths"), narrating the data
("lists these exact services", "posted hours"), naming a section instead of
saying something ("Direct contact, posted hours, local address"), the legal name
as a headline in capitals, and filler — "quality workmanship", "customer
satisfaction is our priority", "committed to excellence".

---

## What the gate blocks, in full

**Markup:** fewer than 5 sections or 350 words · a band that renders blank · no
`<h1>` or no CTA above the fold · fewer than 3 CTAs · missing `tel:` where the
trade converts on the phone · an unsupported rating, licence or testimonial ·
more than half the services missing · contrast under 4.5:1 · literal colours ·
placeholder text · no semantic elements · images without dimensions · **and the
owner's own complaints** — someone who said "not enough enquiries" cannot
receive a page with three CTAs.

**Stylesheet:** under 1500 characters · no `:hover` · no `:focus-visible` · no
media queries · pure black · more than 6 literal colours · a reveal start state
with no revealed state.

**Warnings** (not blocking, but read them): no `clamp()` · under 12 padding
declarations · largest section padding under 72px · no minimum tap height · more
than two font families · no line-height between 1.4 and 1.8 · no `ch` measure ·
motion without a reduced-motion guard · sections sharing one block class ·
duplicate images · divs overwhelming semantic elements.
