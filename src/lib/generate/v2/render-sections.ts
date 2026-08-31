import { callGemini } from "@/lib/gemini-client";
import * as cheerio from "cheerio";
import { sanitizeBespokeHtml } from "@/lib/sanitize-generated-html";
import { sanitizeGeneratedCss } from "@/lib/sanitize-css";
import {
  CLASS_VOCABULARY,
  MOCKUP_RULES,
  COPY_RULES,
  CONVERSION_RULES,
  STRUCTURE_CONTRACT,
} from "@/lib/generate/v2/vocabulary";
import type { PageSystem, SectionSpec } from "@/lib/generate/v2/design-system";
import type { LayoutDna } from "@/lib/generate/v2/layout-dna";
import type { SiteBrief } from "@/lib/generate-bespoke-site";

// Stage two: every section is written by its own model call, and the calls
// run at the same time.
//
// The design decisions are already made and frozen in the stylesheet, so a
// section writer is doing markup and copy, not design invention — which is
// the only reason twenty parallel calls produce one coherent page instead of
// twenty unrelated ones. Each call sees the full class vocabulary, the design
// system summary, and the labels of the sections either side of it, so
// neighbouring compositions do not collide.

export interface RenderedSection {
  id: string;
  kind: string;
  label: string;
  html: string;
  css: string;
}

const FAST_CHAIN = ["gemini-flash-latest", "gemini-2.5-flash"];

/**
 * Remove media frames that have no image in them.
 *
 * A .bs-media frame is a fixed-aspect box with a background — with an <img>
 * inside it is a photograph, and without one it is a large grey rectangle. A
 * section writer given no photograph would lay out the composition it was
 * asked for and leave the frame empty, and the first real build shipped with
 * eleven frames and six images: five grey boxes down the page.
 *
 * Deterministic rather than another line in the prompt, because "do not emit
 * an empty frame" is exactly the kind of instruction a model follows in four
 * sections out of five.
 */
export function stripEmptyMediaFrames(html: string): string {
  const $ = cheerio.load(html, null, false);
  let removed = 0;
  $("[class*='bs-media'], [class*='bs-collage']").each((_, element) => {
    const node = $(element);
    if (node.find("img").length > 0 || node.find("svg").length > 0) return;
    // Text inside the frame means it is being used as a plate, not a photo
    // slot, so leaving it alone is safer than deleting visible copy.
    if (node.text().trim().length > 0) return;
    node.remove();
    removed++;
  });
  if (removed > 0) console.warn(`[render-sections] removed ${removed} empty media frame(s)`);
  return removed > 0 ? $.html() : html;
}

function systemSummary(system: PageSystem, dna: LayoutDna): string {
  return `DESIGN SYSTEM ALREADY BUILT AND FROZEN — you are writing markup for it, not redesigning it.
The stylesheet is hand-written and ships with the application. It is not generated, you cannot see
it change, and nothing you write can restyle it. Your job is to produce the exact shapes it styles.
- ${system.systemName}: ${system.rationale}
- Palette: primary ${system.palette.primary}, accent ${system.palette.accent}, ink ${system.palette.ink}, surface ${system.palette.surface}
- Type: ${system.typography.displayFamily} display / ${system.typography.bodyFamily} body
- Corners: ${dna.cornerStyle}. Recurring motif: ${dna.motif}.
- The stylesheet already implements every class listed below. Use those classes. Do not invent
  a class you have not been given unless you also return the CSS for it.`;
}

/**
 * The About section's founder badge, spelled out.
 *
 * Every reference site the client works from has the same thing: the owner's
 * photograph with a plate carrying the logo and their name and role. Left to
 * a description it came out as a text chip, or with an invented job title, or
 * missing entirely — so the exact markup and the exact facts are supplied.
 */
function aboutBadgeBrief(brief: SiteBrief, logoUrl: string | null, imageUrl: string | null): string {
  const founder = brief.founder?.trim();
  return `
THE FOUNDER BADGE — mandatory in this section, built exactly like this:
  <figure class="bs-media bs-media--wide">
    <img src="${imageUrl ?? "USE THE PHOTOGRAPH ASSIGNED ABOVE"}" alt="…" width="1200" height="800" loading="lazy">
    <div class="bs-founder-badge">
      ${logoUrl ? `<div><img src="${logoUrl}" alt="${brief.businessName} logo" width="120" height="48"></div>` : `<div><strong>${brief.businessName}</strong></div>`}
      <div><span>${founder ?? brief.businessName}</span><span class="bs-small">${founder ? "Founder" : "Local, family owned"}</span></div>
    </div>
  </figure>
The badge sits INSIDE the photograph's frame (the stylesheet positions it) and never over body copy.
${founder ? `The founder's name is exactly "${founder}". Do not invent a second name, a job title beyond "Founder", or a year count.` : "No founder name was supplied — use the business name and do not invent a person."}
The section must also carry the real story from the source material below, two actions, and a stat
band of four supported numbers.`;
}

function neighbourNote(sections: SectionSpec[], index: number): string {
  const before = sections[index - 1];
  const after = sections[index + 1];
  return `- The section directly ABOVE yours is: ${before ? `"${before.label}" (${before.background} background, ${before.archetype.slice(0, 140)})` : "the site navigation"}
- The section directly BELOW yours is: ${after ? `"${after.label}" (${after.background} background)` : "the site footer"}
Do not repeat the composition of either neighbour, and make sure your background choice does not
sit flat against theirs.`;
}

function factsFor(brief: SiteBrief): string {
  return `- Business: ${brief.businessName} — ${brief.industry} in ${brief.city}
- Phone: ${brief.phone ?? "not supplied"} ${brief.phone ? `(click-to-call href "tel:${brief.phone.replace(/[^\d+]/g, "")}")` : ""}
- Owner: ${brief.founder ?? "not supplied — do not name one"}
- Services: ${brief.services.join(" | ") || "not supplied"}
- Areas: ${brief.areas.join(" | ") || "not supplied"}
- Primary action label, used verbatim everywhere: ${brief.intent.primaryLabel}
- Review proof: ${brief.rating && brief.reviewCount ? `${brief.rating} from ${brief.reviewCount} reviews` : "none — never show stars or a rating"}
- Real reviews: ${brief.reviews.length ? brief.reviews.slice(0, 6).map((r) => `${r.author} (${r.rating}★): ${r.text.slice(0, 300)}`).join(" || ") : "none"}
- Licensed/insured: ${brief.licensedInsured ? "supported, may be stated" : "NOT supported, never state it"}
- Story source: ${(brief.aboutContent ?? "none").slice(0, 1800)}`;
}

async function renderOne(
  spec: SectionSpec,
  index: number,
  system: PageSystem,
  dna: LayoutDna,
  brief: SiteBrief,
  logoUrl: string | null
): Promise<RenderedSection | null> {
  const isHero = index === 0 || spec.kind === "hero";
  const isAbout = spec.kind === "about";
  const archetypeOverride =
    isHero ? dna.hero.spec : spec.kind === "about" ? dna.about.spec : null;

  // The archetype is a class the shipped stylesheet implements, not a
  // description the model has to rebuild from scratch in CSS.
  const background =
    spec.background === "tint"
      ? " bs-section--tint"
      : spec.background === "ink"
        ? " bs-section--ink"
        : spec.background === "brand"
          ? " bs-section--brand"
          : spec.background === "photo"
            ? " bs-section--photo"
            : "";
  const rootClass = isHero
    ? `bs-section bs-hero bs-hero--${dna.hero.id}`
    : spec.kind === "about"
      ? `bs-section bs-about bs-about--${dna.about.id}${background}`
      : `bs-section${background}`;
  // The hero used to write the site navigation. It cannot: a nav living inside
  // the homepage hero does not exist on any inner route, and a model writing
  // its own hrefs linked at on-page anchors instead of real pages. Chrome is
  // built once by renderChrome and rendered around every route.

  const prompt = `Write ONE section of a bespoke local-business homepage.

${systemSummary(system, dna)}

${CLASS_VOCABULARY}

${STRUCTURE_CONTRACT}

THE SECTION YOU ARE WRITING (section ${index + 1} of ${system.sections.length})
- id: ${spec.id}   kind: ${spec.kind}   label: ${spec.label}
- REQUIRED root element: <section id="${spec.id}" class="${rootClass}">
- Background role: ${spec.background}
- Its job on the page: ${spec.intent}
- Composition to build: ${archetypeOverride ?? spec.archetype}
${archetypeOverride ? `- Section-specific brief from the art director: ${spec.archetype}` : ""}
- Factual points it must make: ${spec.copyPoints.join(" | ") || "derive from the business facts below"}
- Photograph for this section: ${spec.imageUrl ?? "NONE. Do not emit a .bs-media or .bs-collage frame at all — an empty frame renders as a large grey rectangle. Compose with colour, type, inline SVG and the motif instead. Never invent an image URL, never use a placeholder path, never use the logo as a photograph."}


${isAbout ? aboutBadgeBrief(brief, logoUrl, spec.imageUrl) : ""}
${neighbourNote(system.sections, index)}

BUSINESS FACTS
${factsFor(brief)}

${COPY_RULES}

${CONVERSION_RULES}

${MOCKUP_RULES}

OUTPUT RULES
- Return a single <section id="${spec.id}" class="${rootClass}">…</section> with exactly that class
  list. Nothing before it, nothing after it, no markdown fence, no explanation.
- Do NOT write a <nav>, a <header> or a <footer>. The site chrome is built separately and
  rendered around this page; anything you write here would be a second copy of it.${isHero ? " The hero's top padding must clear a fixed navigation bar roughly 96px tall." : ""}
- Real semantic HTML: headings step down properly, lists are lists, figures are figures. Exactly
  one <h1> exists on the whole page and it belongs to the hero, so ${isHero ? "use <h1> here" : "use <h2> here"}.
- Every <img> needs width, height, alt, and object-fit handled by .bs-media. The hero image takes
  loading="eager" fetchpriority="high"; every other image takes loading="lazy".
- No <script>, no <style> tags, no inline colour styles, no Tailwind classes.
- A lead form is written as <form data-lead-form class="bs-form"> with fields named exactly
  name, phone, email, service, message. Never set an action or a method.
- Inline SVG icons are welcome; keep them 24x24 with currentColor strokes.
- Add data-reveal to two or three blocks at most.

If — and only if — this composition needs something the class vocabulary cannot express, append
after the closing </section> a line "/*CSS*/" followed by CSS in which EVERY selector begins with
#${spec.id}. Do not restate rules that already exist.`;

  const raw = await callGemini(prompt, FAST_CHAIN[0], undefined, {
    modelChain: FAST_CHAIN,
    maxTokens: 24000,
    temperature: 0.6,
    timeoutMs: 240_000,
    system:
      "You are a senior front-end engineer building one section of an already-designed page. You output HTML only, you never invent facts, and you never restyle the design system.",
  });
  if (!raw) return null;

  const cleaned = raw.replace(/```[a-z]*\s*/gi, "").replace(/```/g, "").trim();
  const [markup, extra] = cleaned.split("/*CSS*/");
  const html = stripEmptyMediaFrames(sanitizeBespokeHtml(markup.trim()));
  if (!html || html.length < 120) return null;

  return {
    id: spec.id,
    kind: spec.kind,
    label: spec.label,
    html,
    css: extra ? sanitizeGeneratedCss(extra.trim()) : "",
  };
}

/** Bounded parallelism: the whole page at once, without tripping rate limits. */
async function inPool<T, R>(items: T[], limit: number, task: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await task(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Render one contiguous slice of the manifest.
 *
 * The Inngest orchestration calls this a batch at a time: every step is its
 * own 300-second Vercel invocation, so twenty sections in one step could not
 * finish inside the ceiling however wide the concurrency was.
 */
export async function renderSectionRange(
  system: PageSystem,
  dna: LayoutDna,
  brief: SiteBrief,
  logoUrl: string | null,
  offset: number,
  count: number
): Promise<RenderedSection[]> {
  const slice = system.sections.slice(offset, offset + count);
  const rendered = await Promise.all(
    slice.map((spec, localIndex) =>
      renderOne(spec, offset + localIndex, system, dna, brief, logoUrl).catch((err) => {
        console.error(`[render-sections] "${spec.id}" failed:`, err);
        return null;
      })
    )
  );
  const kept = rendered.filter((section): section is RenderedSection => section !== null);
  if (kept.length < slice.length) {
    console.warn(`[render-sections] ${slice.length - kept.length} of ${slice.length} sections in this batch did not render`);
  }
  return kept;
}

export async function renderAllSections(
  system: PageSystem,
  dna: LayoutDna,
  brief: SiteBrief,
  logoUrl: string | null,
  concurrency = 6
): Promise<RenderedSection[]> {
  const rendered = await inPool(system.sections, concurrency, (spec, index) =>
    renderOne(spec, index, system, dna, brief, logoUrl).catch((err) => {
      console.error(`[render-sections] "${spec.id}" failed:`, err);
      return null;
    })
  );

  // A section that failed is dropped rather than replaced with a placeholder:
  // a missing band reads as a shorter page, a placeholder reads as broken.
  const kept = rendered.filter((section): section is RenderedSection => section !== null);
  const lost = system.sections.length - kept.length;
  if (lost > 0) console.warn(`[render-sections] ${lost} of ${system.sections.length} sections did not render`);
  return kept;
}

export interface NavLink {
  label: string;
  href: string;
  /** Present only for a top-level item that opens a mega-menu panel. */
  children?: { label: string; href: string }[];
}

export interface ChromeData {
  links: NavLink[];
  phone: string | null;
  primaryLabel: string;
  primaryHref: string;
  utility: string[];
}

const MENU_PANELS = [
  "a services grid: three or four columns of items, each an inline SVG glyph, the service name, and a one-line benefit",
  "a split panel: services listed in two columns on the left, service areas as a compact map-pin list on the right, with a small promo block beneath",
  "a featured panel: one large highlighted service block on the left with a heading and a call to action, and the remaining services as a plain two-column link list on the right",
];

export async function renderChrome(
  system: PageSystem,
  dna: LayoutDna,
  brief: SiteBrief,
  logoUrl: string | null,
  data: ChromeData
): Promise<RenderedSection | null> {
  const panel = MENU_PANELS[dna.seed % MENU_PANELS.length];

  const prompt = `Write the SITE CHROME — the navigation bar and its mega menu — for a bespoke
local-business website. It is rendered above every page of the site, not just the homepage.

${systemSummary(system, dna)}

${CLASS_VOCABULARY}

THE COMPOSITION TO BUILD
${dna.chrome.name} — ${dna.chrome.spec}
Mega-menu panel style for this lead: ${panel}

THE EXACT SHAPE THE SHIPPED STYLESHEET STYLES — build this, do not improvise it:
  <nav class="bs-nav" data-nav data-sticky-nav>
    <div class="bs-utility"><div class="bs-container"><span>…</span><span>…</span></div></div>   (omit if no utility items)
    <div class="bs-nav__bar">
      <a class="bs-nav__logo" href="/"> logo <img> or the business name </a>
      <ul class="bs-nav__links">
        <li><a href="/">Home</a></li>
        <li class="bs-nav__item" data-nav-dropdown>
          <button type="button" data-nav-trigger aria-expanded="false">Services</button>
          <div class="bs-nav__panel" data-nav-panel><div class="bs-grid-3"> … item links … </div></div>
        </li>
        …
      </ul>
      <div class="bs-nav__actions">
        <a class="bs-link-call" href="tel:…"> icon + number </a>
        <a class="bs-btn" href="…">PRIMARY LABEL</a>
        <button type="button" data-nav-toggle aria-expanded="false" aria-label="Menu"> burger svg </button>
      </div>
    </div>
    <div class="bs-nav__drawer" data-nav-drawer>
      <button type="button" data-nav-close aria-label="Close menu">×</button>
      … every link, flat, as plain <a> …
    </div>
  </nav>
The panel's closed state, the drawer's off-screen state and the mobile breakpoints are already in
the stylesheet. Do not write CSS for them and do not add inline styles that would fight them.

BUSINESS
- ${brief.businessName}, ${brief.industry} in ${brief.city}
- Logo image: ${logoUrl ?? "none — set the business name in the display face as a wordmark instead"}
- Phone: ${data.phone ?? "not supplied — omit the call link entirely"}
- Utility bar items: ${data.utility.join(" | ") || "none — omit the utility bar"}

THE NAVIGATION, AS DATA — the application owns every destination on this site.
Use these labels and these hrefs EXACTLY as written. You may not invent a link, change an href,
turn a href into an on-page anchor, add a link that is not listed, or drop one that is.
${JSON.stringify(data.links, null, 2)}

Primary action: label "${data.primaryLabel}", href "${data.primaryHref}".

BEHAVIOUR — you may not write JavaScript, and <script> is stripped. Interactivity is requested
with these attributes, which the reviewed application runtime implements:
- <nav class="bs-nav" data-nav data-sticky-nav>            the bar itself; it gains data-scrolled="true" once the page scrolls
- a top-level item with children is wrapped in <div class="bs-nav__item" data-nav-dropdown>
    containing <button type="button" data-nav-trigger aria-expanded="false">Label</button>
    and <div class="bs-nav__panel" data-nav-panel>…the mega menu…</div>
- <button type="button" data-nav-toggle aria-expanded="false" aria-label="Menu"> opens mobile
- <div class="bs-nav__drawer" data-nav-drawer> is the mobile drawer; put a
    <button type="button" data-nav-close aria-label="Close menu"> inside it
The panel and the drawer must be readable and correctly positioned with CSS alone when closed —
style the closed state yourself; the runtime only flips data-open="true"/"false" on them.

${COPY_RULES}

OUTPUT RULES
- Return a single <nav class="bs-nav" data-nav data-sticky-nav>…</nav>. Nothing else, no fence,
  no commentary, no <header> wrapper, no <script>, no <style>, no Tailwind classes.
- The logo image, if supplied, is an <img> with width, height, alt and NO class that could scale
  it: it is capped at 52px tall by the application.
- Areas never get a photograph — use a map-pin glyph. Services use inline SVG glyphs, not images.
- Every dropdown panel must also be reachable in the mobile drawer.
- If the composition needs extra CSS, append "/*CSS*/" then CSS whose every selector begins with
  .bs-nav.`;

  const raw = await callGemini(prompt, FAST_CHAIN[0], undefined, {
    modelChain: FAST_CHAIN,
    maxTokens: 20000,
    temperature: 0.55,
    timeoutMs: 240_000,
    system: "You are a senior front-end engineer. You output HTML only.",
  });
  if (!raw) return null;

  const cleaned = raw.replace(/```[a-z]*\s*/gi, "").replace(/```/g, "").trim();
  const [markup, extra] = cleaned.split("/*CSS*/");
  const html = sanitizeBespokeHtml(markup.trim());
  if (!html || html.length < 120) return null;
  return { id: "chrome", kind: "nav", label: "Navigation", html, css: extra ? sanitizeGeneratedCss(extra.trim()) : "" };
}

export async function renderFooter(
  system: PageSystem,
  dna: LayoutDna,
  brief: SiteBrief,
  logoUrl: string | null
): Promise<RenderedSection | null> {
  const prompt = `Write the FOOTER for a bespoke local-business homepage.

${systemSummary(system, dna)}

${CLASS_VOCABULARY}

THE FOOTER COMPOSITION TO BUILD
${dna.footer.name} — ${dna.footer.spec}

BUSINESS FACTS
${factsFor(brief)}
- Logo: ${logoUrl ?? "none — set the business name in the display face instead"}
- Email: ${brief.email ?? "not supplied"}

LINKS THE FOOTER MUST CARRY (relative hrefs exactly as written)
- Services column: ${brief.services.slice(0, 8).map((service) => service).join(" | ") || "omit the column"}
- Areas column: ${brief.areas.slice(0, 8).join(" | ") || "omit the column"}
- Useful links: Home "/", About "/about", Services "/services", FAQ "/faq", Contact "/contact",
  Privacy "/privacy", Terms "/terms"

${COPY_RULES}

THE EXACT SHAPE THE SHIPPED STYLESHEET STYLES:
  <footer class="bs-footer">
    <div class="bs-container">
      <div class="bs-footer-cta"> h2.bs-h2, a line, .bs-actions with a .bs-btn--light and a .bs-link-call </div>
      <div class="bs-footer__cols">
        <div class="bs-footer__col"> identity, short blurb, .bs-badge trust chips, tel link </div>
        <div class="bs-footer__col"><h3>Services</h3><ul>…</ul></div>
        <div class="bs-footer__col"><h3>Service Areas</h3><ul>…</ul></div>
        <div class="bs-footer__col"><h3>Useful Links</h3><ul>…</ul></div>
      </div>
      <div class="bs-footer__bottom"><span>© 2026 …</span><span>…legal links…</span></div>
    </div>
  </footer>

OUTPUT RULES
- Return a single <footer class="bs-footer">…</footer> built to that shape. Nothing else, no fence,
  no commentary.
- Include the year 2026 and the business name in the bottom bar.
- Include the phone as a real tel: link and the address/service area line if supplied.
- No <script>, no <style>, no inline colour styles, no Tailwind classes.
- If the composition needs extra CSS, append "/*CSS*/" then CSS whose every selector begins with
  .bs-footer.`;

  const raw = await callGemini(prompt, FAST_CHAIN[0], undefined, {
    modelChain: FAST_CHAIN,
    maxTokens: 16000,
    temperature: 0.55,
    timeoutMs: 240_000,
    system: "You are a senior front-end engineer. You output HTML only.",
  });
  if (!raw) return null;

  const cleaned = raw.replace(/```[a-z]*\s*/gi, "").replace(/```/g, "").trim();
  const [markup, extra] = cleaned.split("/*CSS*/");
  const html = sanitizeBespokeHtml(markup.trim());
  if (!html || html.length < 120) return null;
  return { id: "footer", kind: "footer", label: "Footer", html, css: extra ? sanitizeGeneratedCss(extra.trim()) : "" };
}
