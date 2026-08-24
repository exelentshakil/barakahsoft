# Make a generated site sellable

Use this after first generation or for a paid, lead-specific refinement. It is
section surgery, not another full AI rebuild: preserve strong sections, repair
weak ones, and save a version that can be restored.

## 1. Resolve and load the lead

Extract the slug from the preview URL, then use the local runtime with the
project environment. If the public URL and local slug disagree, search the
configured leads by business name and stop rather than editing a guess.

```sh
npx tsx --env-file=.env.local /path/to/temporary-refinement-script.ts
```

The script imports:

```ts
import { getSiteData } from "@/lib/get-site-data";
import { buildSiteBrief } from "@/lib/build-site-brief";
import { loadSections, saveSections } from "@/lib/refine-sections";
import { criticiseDesign } from "@/lib/audit/design-critic";
import { verifyHomepage } from "@/lib/audit/quality-gate";
```

Call `getSiteData(slug)`, derive the brief with `buildSiteBrief`, then call
`loadSections(site.artifact)`. Read the real facts, tokens, HTML, CSS and both
critics before changing anything.

## 2. Read the standard and inspect the page

`docs/design-standard.md` is the specification. Also inspect the rendered
preview or supplied screenshots. Critics catch measurable failures; judgement
still catches a boring hero, distorted media, weak testimonial treatment or an
unbalanced owner story.

Distinguish generated body problems from chrome problems. Header/footer React
components live in `src/components/site-shell/`; section HTML cannot repair
them.

## 3. Perform section surgery

Edit only the affected entries returned by `loadSections()`. Keep untouched
sections byte-for-byte. Markup and CSS move together: append or revise matching
rules using only `--bs-*` tokens, then call:

```ts
await saveSections({ leadId, sections, css, note: "Specific repair summary" });
```

`saveSections()` sanitizes HTML/CSS, verifies unique section root IDs, rebuilds
the homepage, records a restorable version and persists the addressable
sections. A `null` Inngest `save-sections` result is not part of this flow; the
generation pipeline now persists its plan inside `plan-site`.

## 4. Verify from stored data

Reload with `getSiteData()`, then run both:

```ts
const critic = await criticiseDesign(html, tokens, brief.intent, !!brief.phone);
const quality = verifyHomepage(html, brief, tokens, css);
```

Finish only when `critic.passes === true` and `quality.passes === true`. Read and
repair blockers directly. Warnings require judgement; do not manufacture a new
full-page design merely to silence subjective polish.

## Non-negotiables

- Never invent facts, contact details, ratings, people, roles or testimonials.
- Never introduce literal colours, fonts, shadows or unplanned image URLs.
- Keep the primary CTA label and `--bs-primary` treatment consistent in body,
  navigation and footer.
- Preserve image proportions with `aspect-ratio` and `object-fit`.
- Reviews show supplied stars, verbatim copy and attribution.
- Do not output raw HTML/CSS in the final response; report the saved result and
  gate status only.
