# BarakahSoft Lead Engine — System Specification

**Version 4.0** · Active production spec (`origin/main`)
Written to be read by a person picking this up cold, or by a model asked to change it.

---

## 1. What this system is

A business owner submits their website URL on a Facebook ad landing page. Within 48 hours they get a private portal containing:

1. **A rebuilt homepage** — bespoke, built from their real facts, designed to the caliber of the best site in their trade.
2. **An audit of their current site** — every finding measured and checkable against their own website.

They pay between $79/month and $797 flat to make it live.

**The governing rule: the AI produces the best possible first draft. It never produces what gets sent.** A human refines it. That is the product, not a workaround.

**The second rule: nothing in the report or on the page may be invented.** Not a rating, not a competitor, not a rank, not a review. Every serious failure this system has had traced back to something plausible that was not true.

---

## 2. The operator flow

```
INTAKE          Public form. Records the lead. Spends NOTHING.
   │            A spam submission costs zero until a person looks at it.
   ▼
ANALYSE         Operator clicks. ~2 Firecrawl credits + 4 Google calls.
   │            Maps the site's URLs, reads the homepage, identifies the
   │            business, researches a design direction for the trade.
   ▼
GENERATE        Homepage only. Three passes, best model available.
   │            Structure+copy → bespoke stylesheet → verification gate.
   │            Rejected pages are REBUILT, not patched.
   ▼
REFINE          Human. Real photos into named slots, section-level rewrites
   │            from plain English, or one prompt from Claude Code.
   ▼
APPROVE         Unlocks the client portal. Nothing reaches a client before.
   ▼
DELIVER         Brevo sends the private portal link.
   ▼
PAID            Stripe. Then phase 2 builds the deeper site if wanted.
```

**Every expensive step is operator-triggered.** Nothing starts itself.

---

## 3. How generation works

### Pass 1 — structure and words together
`src/lib/generate/structure.ts`

Writes semantic HTML **and** the copy in one call, naming its own classes.

Copy and layout are one decision — a headline's length constrains a hero, a section's shape determines how much can be said in it. Splitting them was tried and reverted: it produced strong copy arranged badly.

### Pass 2 — a stylesheet for that exact markup
`src/lib/generate/stylesheet.ts`

Sees the real HTML and writes rules for exactly those class names.

This is what lifted the quality ceiling. Composing from a fixed class vocabulary capped layout at whatever had been pre-built, so content came out strong and the arrangement did not. Because the same run produces markup and CSS, a class can never resolve to nothing.

Colour still comes from **compiled tokens**, not the model — so contrast stays enforced and the reference/client colour toggle rebrands a whole page without regenerating a line.

### Pass 3 — verification
`src/lib/audit/quality-gate.ts`

Everything measured, nothing judged. **A model asked "is this good?" says yes** — that is how two unreadable heroes and a page of sitemap filenames reached production here.

**Markup blockers:** fewer than 5 sections or 350 words · any band that would render blank · no `<h1>` or no CTA above the fold · fewer than 3 CTAs · missing `tel:` where the trade converts on the phone · a claimed rating, licence or testimonial the facts do not support · more than half the services missing · sub-4.5:1 contrast · literal colours · placeholder text · **and the owner's own complaints** — someone who said "not enough enquiries" cannot receive a page with three CTAs.

**Stylesheet blockers:** no hover states · no `:focus-visible` · no media queries · under 1500 characters of CSS.

A rejected page is **regenerated fresh with the failures as constraints**, up to 2 attempts. Never patched — repeated patching converges on safe, which is exactly what the old five-call chain produced.

### Interactions are not generated
`src/components/site-shell/BespokeRuntime.tsx`

Reviewed application code, requested via data attributes: `data-reveal`, `data-count-to`, `data-accordion`, `data-bar`. Arbitrary model-authored script on a client's public domain can read cookies and capture form input. Everything degrades to a readable page with JS off, so crawlers see the finished content.

---

## 4. Where quality comes from

| Input | Source | Why it matters |
|---|---|---|
| **Real facts** | Firecrawl map + homepage, Google Places | A page can only claim what is here |
| **Design direction** | Web search for the best site in that trade | Per lead, never reused — two roofers must not get the same design |
| **Conversion intent** | Derived from the trade | Roofer → quote form. Emergency plumber → phone. Dentist → booking. Shop → buy |
| **Pain points** | What the owner ticked on the landing page | Becomes build constraints the gate then enforces |
| **Imagery** | Vision-captioned real photos, generated for gaps | Placed by subject, never by position |

**Design direction is researched per lead and never cached across leads.** Caching per industry was tried and reverted: it gave every electrician the same site, which is the template outcome the whole system exists to avoid.

---

## 5. How to refine a generated site

### Option A — one prompt (fastest)

```
make this sellable: https://redesign.barakahsoft.com/s/<slug>?view=preview
```

Uses `.claude/skills/sell-this-site`. It calls `GET /api/site?url=...`, which returns the real facts, design tokens, conversion intent, **every editable section**, and the quality gate's current findings.

It then edits **section by section** — the parts that already work survive.

### Option B — the admin, no HTML needed

- **Section editor** — pick the weak section, say what is wrong in plain English. **Approving a section locks it**, and the lock is enforced in the API, so iterating on a hero can never cost a services section you liked.
- **Refine panel** — every image slot named. Generated images are labelled **Placeholder**; upload a real photo or regenerate from a prompt.
- **Inspiration panel** — override the researched design direction with any URL.

### Rules any editor must follow

1. Never state a fact, price, rating or testimonial not in the brief.
2. Only image URLs already on the page — others are deleted at sanitise.
3. Locked sections are rejected by the API.
4. Never rebuild the whole site to fix one section.
5. Colour comes from tokens. Literal colours are a gate blocker.

---

## 6. Cost per lead

| Step | Cost |
|---|---|
| Intake | **Zero** |
| Analyse | ~2 Firecrawl pages + 4 Google calls |
| Design research | 1 search + up to 3 pages, per lead |
| Generate | 2 large model calls (best model) + image generation for empty slots |
| Visibility (optional) | 9 / 25 / 49 real searches — **you choose the size** |
| Competitors (optional) | 1 search + a few API calls |

Firecrawl's map endpoint returns a whole site's URL structure for **one credit**, which is why a lead costs ~2 pages instead of ~30.

---

## 7. Report modules

The portal composes itself. A module renders only when **real data exists** *and* **it applies to this business type**.

**Universal:** technical & SEO audit · mobile speed · content depth · conversion friction · competitor benchmark

**Local businesses only:** search visibility grid · reviews gap · service areas

`is_local_business` from classification is the switch. A national agency does not see a local search grid — an empty grid reads as broken, not as inapplicable. **A shorter report is correct when less applies.**

---

## 8. Key files

```
src/lib/generate/structure.ts       Pass 1 — HTML + copy
src/lib/generate/stylesheet.ts      Pass 2 — bespoke CSS
src/lib/audit/quality-gate.ts       Pass 3 — measured verification
src/lib/audit/site-audit.ts         The client's current-site audit
src/lib/audit/competitors.ts        Real competitor benchmark
src/lib/audit/search-visibility.ts  Measured local search visibility
src/lib/design-dna.ts               Reference site → design spec
src/lib/design-tokens.ts            Design spec → CSS variables, contrast enforced
src/lib/classify-business.ts        Name, trade, city, services from content
src/lib/conversion-intent.ts        What the page is FOR, per trade
src/lib/report-modules.ts           Which report modules apply
src/lib/page-sections.ts            Section-level editing
src/lib/sanitize-css.ts             CSS safety + scoping to .bespoke-page
src/lib/openai-client.ts            Model chains, parameter self-correction
src/inngest/functions/bespoke-generate.ts   The generation job
```

**API surface:** `/api/site` (everything about a site from its URL) · `/api/leads/[id]/analyse` · `/generate` · `/sections` · `/slots` · `/versions` · `/audit` · `/visibility` · `/inspiration` · `/qa` · `/deliver` · `/export` · `/api/diag/services` · `/api/diag/openai`

---

## 9. Recurring failure patterns

Every significant bug in this project has been one of these. Check for them before shipping anything.

**A silent fallback that becomes permanent.** Design research fell back to a house default when industry was null, and that default then *counted as a choice* and blocked every later attempt to research properly. Fallbacks must be distinguishable from decisions.

**A guard that protects machine output.** "Don't overwrite if non-empty" protected the previous scrape's own wrong guess, so a re-analysis could never fix what the first pass got wrong. Only protect what a human actually set.

**Asking a model to check its own work.** Contrast, hierarchy and CTA coverage are computed. A model asked whether contrast is acceptable agrees that it is.

**A rule assuming something the generator wasn't obliged to do.** The gutter lived on `.bs-section` and the model wrote `bs-hero` alone, so the headline sat against the viewport edge. Remove the possibility rather than instructing harder.

**Repeated patching flattens.** Draft → revise → repair produced pages where nothing was wrong and nothing was good. Rebuild fresh with constraints instead.

**Presence of a key proves nothing.** Brevo was configured and returned "Key not found" on every send, visible only in a log nobody read. `/api/diag/services` makes real calls.

**Hardcoded parameter handling rots.** Search models reject `response_format`; the client knew only two hardcoded corrections and returned nothing at all. Read the error, don't guess.

**RLS that is invisible server-side.** `leads`, `artifacts` and `scrape_results` had RLS on with no policies. Every server query worked (service role bypasses RLS) while Realtime silently delivered nothing to the browser.

---

## 10. Known gaps

- **Phase 2** (service, area, location pages) exists but is untested end to end.
- **Stripe checkout → webhook → paid** has never been exercised with a real test payment.
- **Export to standalone Next.js** exists, untested.
- The design critic's judgement pass is advisory and does not gate.
- No automated tests. The quality gate covers output, not the pipeline.
- Header and footer are spec-driven but not directly editable when they come out wrong.
