# The design engine

How a lead becomes a homepage worth selling a build on.

## The problem this replaced

Every generated site looked the same, and it was code, not cache. Four
mechanisms, all now removed:

1. **Thin evidence collapsed into a template.** `composePage()` dropped any
   section the client could not evidence, then fell back to the vertical's
   fixed list below six survivors. A real example: six blueprint sections from
   the reference, four struck through, two survived — so the more distinctive
   the reference, the more reliably the generic page fired.
2. **The model never wrote the page.** It returned copy JSON and a layout spec
   of closed enums; fifteen hand-written string templates did the rendering.
3. **One 1626-line stylesheet shipped on every page.** The "design direction"
   was thirty custom properties swapped in a `:root` block — a reskin.
4. **Model-authored CSS was flattened anyway.** `normalizeRuleBody()` rewrote
   every hex into `--bs-*` tokens; its last rule overwrote *every* `color:`
   declaration in a block.

## The core idea

**The model never types a hex code, a pixel value, or a duration.** That is
where machine-made flatness comes from — a model choosing `#3a5a45` and `18px`
is guessing at problems that colour science and font metrics already solve.

| The model owns | Compiled engines own | The audit enforces |
|---|---|---|
| Intent — hue, chroma, type voice, rhythm, density, motion | Every literal: OKLCH ramps, type scale, tracking, spacing, image grading | Contrast, measure, grid alignment, colour budget, card density |
| Composition — which sections exist, their order and shape | Correct implementation of that composition | The ambition floor — a merely safe page fails |
| Copy, markup, class names, its own CSS and JS on top | Motion curves, reduced-motion, font metric overrides | Section count inside the industry band |

This is **not** the enum system returning. The old one gave the model nine axes
over fifteen fixed renderers and one shared stylesheet — the design space was a
reskin. Here structure and markup are unconstrained; what is compiled is the
token vocabulary, and it differs for every site.

## The design law

`src/lib/design/law.ts`, injected verbatim into every prompt and machine-checked
afterwards. A rule the build cannot measure is one the model drifts off within
three sites.

**Half one — the safety floor.** Body text ≥ 7:1, large display ≥ 4.5:1.
Darkness is not the enemy; low contrast is, so a dark section is welcome
wherever it clears the floor. Colour budget roughly 60/30/10 with brand as an
accent. No card soup. Two type families. Measure 60–75 characters. One grid.

**Half two — the ambition floor.** Every rule a measurable minimum, because a
page satisfying only half one is inoffensive, and inoffensive does not sell a
build. Scale contrast ≥ 8:1 and display ≥ 88px; hero ≥ 85vh in ≤ 12 words; three
full-bleed moments; one deliberate grid break; section padding ≥ 96px with the
largest gap over 160px; one image ≥ 70vh; a motion budget; one editorial device
carried through; texture. Plus a stated **organising idea** every composition
decision traces back to.

**Half three — the section band.** 8–14, tuned per industry on the vertical
profile. Five is a brochure and forty is filler.

## The engines — `src/lib/design/`

Pure, deterministic, unit-tested by `npm run check:design`.

- **`colour.ts`** (culori) — perceptually-even OKLCH ramps at constant ΔL, and
  *contrast-solved* on-colours: every "text on X" token is computed against the
  ground it will sit on, so an unreadable pair is not expressible. `--brand` is
  a fill; `--brand-ink` is the same hue made legible as text; `--brand-ground`
  is a deeper brand that can carry paragraphs.
- **`type.ts`** (Capsize) — modular scale, a hand-set **tracking curve**
  (+0.058em at 9px to −0.033em at 136px), **leading solved from size, x-height
  AND measure**, cap-height trim, and `size-adjust` fallback metrics.
- **`space.ts`** — one scale from one unit; overlap offsets are whole units, so
  a deliberate grid break still lands on the grid; split ratios are real
  proportions, never `1fr 1fr`.
- **`image.ts`** (sharp) — saliency crops rather than centre crops, and a
  per-channel grade toward the site's own hue so client photos, generated
  images and stock read as one shoot. Not a duotone.
- **`motion.ts`** — correct easing, distance-scaled durations, reduced-motion
  handled once. Reveals key off `[data-reveal-armed]`, not `[data-reveal]`, so
  a no-JS render shows content instead of a blank column.
- **`containment.ts`** — the only shared stylesheet, ~25 lines, zero aesthetics.
- **`index.ts`** — `compileDesignSystem(intent)` assembles all of it per site.

## The pipeline

Each step is one `step.run` in `src/inngest/functions/bespoke-generate.ts`.

1. **Intake brief** (`src/lib/intake-spec.ts`) — questions written for *this*
   industry, not a fixed ten-field form. Every unmet blueprint `need` becomes a
   fillable field with `unlocks`, so missing evidence is a question rather than
   a silent drop. Fields still unanswered are passed to the PRD deliberately: a
   page told what it does not know designs around the gap; a page not told
   invents a price.
2. **PRD** (`src/lib/generate/prd.ts`) — the organising idea, the editorial
   device, intent for every engine, and the section outline in the industry's
   own vocabulary. Carries `painInstructions` — the argument the page makes.
3. **Compile** — engines run over that intent.
4. **Photography** — slots come from the PRD's sections, so an orphan slot
   cannot exist. Graded to the palette.
5. **Chrome**, then **body** (`author.ts`) — two calls, because a page plus its
   stylesheet is 30–40k output tokens. The body gets the chrome's CSS so its
   classes resolve.
6. **Assemble** (`assemble.ts`) — sanitize, remediate, measure, repair, measure.

## The audit

`npm run check:audit` proves it separates a premium page from a safe one.

- **Static** (postcss) — literals that should be tokens, off-scale spacing,
  radius drift, card density, section band.
- **Rendered** (Playwright) — contrast against the ground a node *actually* sits
  on after inheritance, measure counted from Range rects, grid alignment, tap
  targets, overflow, at 1440 and 390.
- **Ambition** — the pass that fails a timid page.
- **Repair** — findings go back as one model call, then re-measure, up to twice.
  Only an unrepaired contrast failure blocks the save.

`remediate.ts` runs first and is **not** the deleted colour normaliser: it fixes
a closed list of mechanical misuses (a border token as text, an 8px literal) and
leaves a correctly written page completely untouched.

## Review queue

`/admin/queue`. Builds run unattended and land here; nothing is sent from this
app. Keyboard: `a` approve, `r` reject, `b` rebuild with a different look, `o`
open. Rebuild advances the salt *and* clears the stored design direction, so the
next run re-selects a reference instead of reproducing the rejected look.

## Verifying without spending model calls

```bash
npm run lint            # tsc + every check below plus the existing guards
npm run check:design    # the five engines, as pure functions
npm run check:audit     # builds a timid page and an ambitious one, asserts the audit separates them
npm run check:pipeline  # PRD -> compile -> assemble -> audit, with the model stubbed
npm run build
```

## Known state

- The generative steps have been exercised live against Gemini 3.1 Pro end to
  end. Best complete page scored 64/100 after two repair rounds.
- `.env.local` points `NEXT_PUBLIC_SUPABASE_URL` at a project that no longer
  resolves; the live one is `liepxeeugfrxmidcmbxo`. Until that is refreshed,
  nothing local reaches the database.
- Provider latency is the main operational risk. `callDesignModel` tries Gemini
  then OpenAI, and per-attempt timeouts are sized to the call so a dead provider
  is found in a minute rather than after a full chain walk.
