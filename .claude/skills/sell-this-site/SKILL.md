---
name: sell-this-site
description: Make a generated BarakahSoft client site sellable from one prompt. Use when given a /s/<slug> preview URL and asked to fix, improve, rebuild or "make sellable" a lead's website. Handles hero, layout, contrast, typography, CTAs and the stylesheet.
---

# Make a generated site sellable

You are given a preview URL like `https://redesign.barakahsoft.com/s/kingcontractor?view=preview`.
Everything you need comes from one call. Do not guess at the design system.

## 1. Load the context

```
GET /api/site?url=<the full preview URL>
```

Returns the lead's real facts, the design tokens, the conversion intent, the
current `html` and `css`, and the critic's findings. Read `howToEdit.rules`
before writing anything — they are constraints, not suggestions.

## 2. Read the standard

`docs/design-standard.md` is the whole specification: 60/30/10 colour, the two-
family type rule, 96–128px section rhythm, F-shaped placement, semantic markup,
and the exact list of what the quality gate blocks. Every rule there is measured.

## 3. Look at the page

Fetch the preview URL and read it. The critic catches contrast, hierarchy and
CTA coverage; it does not catch a hero that fails to say what the business does,
or a page that is simply boring. That judgement is yours.

## 4. Rewrite

There is no section-level API. Splitting a page into editable blocks produced a
worse result than rewriting the whole body against the full standard — the parts
you keep, you keep by writing them back unchanged.

**Markup and stylesheet move together.** If you rename a class in the HTML and
do not send the matching CSS, that element renders bare — there is no fallback
stylesheet behind you.

```
POST /api/leads/<leadId>/bespoke
{"page_key":"home","html":"<main>…</main>","css":"…","note":"why"}
```

Both are sanitised on the way in: scripts, inline visual styles, `url()`,
`@import`, credential-bearing URLs and unknown image sources are removed. Every
CSS selector is scoped to `.bespoke-page`.

Each write creates a **new version**, so going back is cheap. Rebuild from
scratch only when the page is structurally wrong:

```
POST /api/leads/<leadId>/generate  {"phase":1}
```

and only after checking the brief is right. A rebuild from a bad brief produces
a differently bad page.

## 5. Verify

Re-fetch `/api/site?url=…`, confirm `critic.passes` is true and the issues you
set out to fix are gone. Then look at the page again — the gate passing is a
floor, not a finish.

## What good looks like

- **Above the fold**: what the business does, where, and one unmissable action.
  A visitor who reads nothing else should know whether to call.
- **The primary action matches the trade.** `conversion.primaryLabel` is derived
  from the industry — a roofer gets a quote form, an emergency plumber gets the
  phone. Do not replace it with something generic.
- **Every complaint in `business.painPoints` is visibly answered.** The owner
  ticked those boxes; the page is the reply.
- **Neutral grounds, brand colour on the action.** If a section needs emphasis,
  change the surface, not the text colour.
- **No section repeats another.** Sameness reads as filler.

## Never

- Write a fact, price, rating or testimonial not in `business`.
- Write a literal colour, font or shadow. Everything visual comes from the tokens.
- Use an image URL that is not already on the page — others are deleted.
- Include a `<script>`, a `<style>`, `<header>`, `<nav>` or `<footer>`.
- Send HTML without the CSS that styles it.
