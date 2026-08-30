import { callGemini, bestGeminiChain } from "@/lib/gemini-client";
import { sanitizeBespokeHtml } from "@/lib/sanitize-generated-html";
import { sanitizeGeneratedCss } from "@/lib/sanitize-css";
import { CLASS_VOCABULARY, MOCKUP_RULES, COPY_RULES } from "@/lib/generate/v2/vocabulary";
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

function systemSummary(system: PageSystem, dna: LayoutDna): string {
  return `DESIGN SYSTEM ALREADY BUILT AND FROZEN — you are writing markup for it, not redesigning it.
- ${system.systemName}: ${system.rationale}
- Palette: primary ${system.palette.primary}, accent ${system.palette.accent}, ink ${system.palette.ink}, surface ${system.palette.surface}
- Type: ${system.typography.displayFamily} display / ${system.typography.bodyFamily} body
- Corners: ${dna.cornerStyle}. Recurring motif: ${dna.motif}.
- The stylesheet already implements every class listed below. Use those classes. Do not invent
  a class you have not been given unless you also return the CSS for it.`;
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
  const archetypeOverride =
    isHero ? dna.hero.spec : spec.kind === "about" ? dna.about.spec : null;
  // The hero used to write the site navigation. It cannot: a nav living inside
  // the homepage hero does not exist on any inner route, and a model writing
  // its own hrefs linked at on-page anchors instead of real pages. Chrome is
  // built once by renderChrome and rendered around every route.

  const prompt = `Write ONE section of a bespoke local-business homepage.

${systemSummary(system, dna)}

${CLASS_VOCABULARY}

THE SECTION YOU ARE WRITING (section ${index + 1} of ${system.sections.length})
- id: ${spec.id}   kind: ${spec.kind}   label: ${spec.label}
- Background role: ${spec.background}
- Its job on the page: ${spec.intent}
- Composition to build: ${archetypeOverride ?? spec.archetype}
${archetypeOverride ? `- Section-specific brief from the art director: ${spec.archetype}` : ""}
- Factual points it must make: ${spec.copyPoints.join(" | ") || "derive from the business facts below"}
- Photograph for this section: ${spec.imageUrl ?? "none — compose with colour, type and the motif instead. Do NOT invent an image URL, do NOT use a placeholder path, do NOT use the logo as a photograph."}


${neighbourNote(system.sections, index)}

BUSINESS FACTS
${factsFor(brief)}

${COPY_RULES}

${MOCKUP_RULES}

OUTPUT RULES
- Return a single <section id="${spec.id}" class="bs-section ...">…</section>. Nothing before it,
  nothing after it, no markdown fence, no explanation.
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
  const html = sanitizeBespokeHtml(markup.trim());
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

  const chain = bestGeminiChain();
  const raw = await callGemini(prompt, chain[0], undefined, {
    modelChain: chain,
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

OUTPUT RULES
- Return a single <footer class="bs-footer">…</footer>. Nothing else, no fence, no commentary.
- Include the year 2026 and the business name in the bottom bar.
- Include the phone as a real tel: link and the address/service area line if supplied.
- No <script>, no <style>, no inline colour styles, no Tailwind classes.
- If the composition needs extra CSS, append "/*CSS*/" then CSS whose every selector begins with
  .bs-footer.`;

  const chain = bestGeminiChain();
  const raw = await callGemini(prompt, chain[0], undefined, {
    modelChain: chain,
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
