---
name: sell-this-site
description: Make a generated BarakahSoft client site sellable from one prompt. Use when given a /s/<slug> preview URL and asked to fix, improve, rebuild or "make sellable" a lead's website. Handles hero, sections, contrast, CTAs, header and footer.
---

# Make a generated site sellable

You are given a preview URL like `https://redesign.barakahsoft.com/s/kingcontractor?view=preview`.
Everything you need comes from one call. Do not guess at the design system.

## 1. Load the context

```
GET /api/site?url=<the full preview URL>
```

Returns the lead's real facts, the design tokens, the conversion intent, every
editable section, and the design critic's current findings. Read `howToEdit.rules`
before writing any markup — they are constraints, not suggestions.

## 2. Look at the page

Fetch the preview URL and read it. The critic catches contrast, hierarchy and
CTA coverage; it does not catch a hero that fails to say what the business does,
or a section that is simply boring. That judgement is yours.

## 3. Decide the smallest fix that works

- **A section is weak** → regenerate that one section with an instruction.
- **Several sections are weak** → fix them one at a time. Never rebuild the
  whole page to fix a third of it; the parts that work are worth keeping.
- **The page is structurally wrong** → rebuild with `{"phase":1}`, but only
  after checking the brief is right. A rebuild from a bad brief produces a
  differently bad page.

## 4. Apply it

Per section, best first:

```
POST /api/leads/<leadId>/sections
{"action":"regenerate","sectionId":"section-2","instruction":"Make the hero
 headline state what they actually do and where. Put the phone number and the
 quote button side by side above the fold."}
```

Adding something the page lacks:

```
POST /api/leads/<leadId>/sections
{"action":"add","sectionId":"section-3","description":"A guarantee band with
 three specific promises and a call button"}
```

Writing markup yourself, when you know exactly what you want:

```
POST /api/leads/<leadId>/bespoke
{"page_key":"home","html":"<section class=\"bs-section\">...","note":"why"}
```

## 5. Verify

Re-fetch `/api/site?url=...` and confirm `critic.passes` is true and the issues
you set out to fix are gone. Look at the page again — the critic passing is a
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
- Use a class outside the `bs-*` vocabulary — it is stripped and renders bare.
- Edit a locked section. Those are approved.
- Rebuild the whole site because one section is wrong.
