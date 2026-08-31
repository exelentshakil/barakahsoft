import { layoutDnaFor, type LayoutDna } from "@/lib/generate/v2/layout-dna";
import { BASE_STYLESHEET } from "@/lib/generate/v2/base-stylesheet";
import { generatePageSystem, type PageSystem } from "@/lib/generate/v2/design-system";
import {
  renderAllSections,
  renderChrome,
  renderFooter,
  type ChromeData,
  type RenderedSection,
} from "@/lib/generate/v2/render-sections";
import { enforceChromeHrefs } from "@/lib/generate/v2/chrome-data";
import { repairPage } from "@/lib/generate/v2/visual-repair";
import { buildPhotoPool } from "@/lib/generate/v2/photo-pool";
import type { SiteBrief } from "@/lib/generate-bespoke-site";

// The whole homepage build, in one place.
//
//   1. layout DNA        deterministic, per lead — this is what makes two
//                        clients in the same trade look like different studios
//                        built them rather than one template with a new colour
//   2. page system       one Pro call: palette, type, and a 14-20 section
//                        manifest written for this business specifically
//   3. stylesheet        one Pro call implementing the fixed class vocabulary
//                        in that system — after this, design is frozen
//   4. sections          every section written in PARALLEL against the frozen
//                        system, plus a bespoke footer
//   5. repair            render, look at it, fix only what is actually broken
//
// Steps 2 and 3 are where taste lives, so they run on the Pro chain. Step 4 is
// markup against a decided design, so it runs on Flash and runs wide.

export interface BuiltHomepage {
  html: string;
  /** Rendered above every route, not just the homepage. */
  chromeHtml: string | null;
  /** Rendered below every route, so inner pages do not lose it. */
  footerHtml: string | null;
  css: string;
  fontHref: string | null;
  sections: { id: string; kind: string; label: string; html: string; locked: boolean }[];
  system: PageSystem;
  dna: LayoutDna;
  rationale: string;
  notes: string[];
}

export function pageFontHref(system: PageSystem): string {
  return googleFontHref(system.typography.displayFamily, system.typography.bodyFamily);
}

function googleFontHref(display: string, body: string): string {
  const families = [...new Set([display, body])]
    .map((family) => `family=${encodeURIComponent(family.trim()).replace(/%20/g, "+")}:wght@400;500;600;700;800;900`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/**
 * Every --bs-* custom property the page can reference, with a literal value.
 *
 * This block is emitted by the application, not by the model, and it is the
 * reason the stylesheet can be trusted: the first build to use this pipeline
 * shipped a stylesheet whose `--color-primary` resolved to an undefined
 * variable, so every button rendered as a beige rectangle with beige text.
 * The model may only reference names that exist here.
 */
export function tokenBlock(system: PageSystem, base: Record<string, string>): string {
  const vars: Record<string, string> = {
    ...base,
    "--bs-primary": system.palette.primary,
    "--bs-accent": system.palette.accent,
    "--bs-ink": system.palette.ink,
    "--bs-surface": system.palette.surface,
    "--bs-surface-alt": system.palette.surfaceAlt,
    "--bs-font-display": `"${system.typography.displayFamily}", ui-sans-serif, system-ui, sans-serif`,
    "--bs-font-body": `"${system.typography.bodyFamily}", ui-sans-serif, system-ui, sans-serif`,
    "--bs-display-weight": system.typography.displayWeight,
  };
  const body = Object.entries(vars)
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
  return `.bespoke-page{${body}}`;
}

// The last stylesheet layer, written by the application rather than a model.
//
// Everything above is generated, and a generated rule can be wrong. These are
// the failures that make a build unusable on a social mockup, expressed as
// rules that land after the generated ones and therefore win: a logo blown up
// to hero size, a stretched photograph, an element wider than the viewport,
// something drawn over the navigation.
export const GUARANTEES = `
.bespoke-page{overflow-x:clip}
.bespoke-page img,.bespoke-page svg,.bespoke-page video,.bespoke-page iframe{max-width:100%}
.bespoke-page .bs-nav__logo img{max-height:52px!important;width:auto!important;object-fit:contain!important}
.bespoke-page .bs-footer .bs-footer__col img,.bespoke-page .bs-footer__brand img{max-height:56px;width:auto;object-fit:contain}
.bespoke-page .bs-media{position:relative;overflow:hidden}
.bespoke-page .bs-media>img{width:100%;height:100%;object-fit:cover;display:block}
.bespoke-page .bs-nav{z-index:100}
.bespoke-page .bs-founder-badge{z-index:5}
.bespoke-page .bs-actions{display:flex;flex-wrap:wrap;align-items:center}
.bespoke-page .bs-btn,.bespoke-page .bs-btn--ghost,.bespoke-page .bs-btn--light{white-space:nowrap;text-decoration:none}
@media (max-width:620px){.bespoke-page .bs-actions>*{flex:1 1 100%}}
`;

/** Rendered standalone for the screenshot pass — the live page adds its own shell. */
export function standalone(html: string, css: string, fontHref: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${fontHref}"><style>*{box-sizing:border-box}body{margin:0}${css}</style></head><body><div class="bespoke-page">${html}</div></body></html>`;
}

/**
 * Assemble the finished page from parts that were produced separately.
 *
 * Split out of buildHomepage because on Vercel each Inngest step is its own
 * 300-second invocation, and the whole chain takes about eight minutes — so
 * the stages run as separate steps and something has to put them back
 * together. The footer and the chrome are deliberately NOT concatenated into
 * the page markup: they belong to the site, and every route under
 * /s/[leadSlug] renders them around its own body.
 */
export function composePage(args: {
  system: PageSystem;
  tokens: Record<string, string>;
  systemCss: string;
  sections: RenderedSection[];
  footer: RenderedSection | null;
  navigation: RenderedSection | null;
}): { html: string; css: string } {
  const { system, tokens, systemCss, sections, footer, navigation } = args;
  return {
    html: sections.map((section) => section.html).join("\n"),
    css: [
      tokenBlock(system, tokens),
      systemCss,
      ...sections.map((section) => section.css),
      footer?.css ?? "",
      navigation?.css ?? "",
      GUARANTEES,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export async function buildHomepage(args: {
  brief: SiteBrief;
  tokens: Record<string, string>;
  logoUrl: string | null;
  photos: string[];
  chrome: ChromeData;
  repair?: boolean;
}): Promise<BuiltHomepage | null> {
  const { brief, tokens, logoUrl, photos, chrome, repair = true } = args;

  const dna = layoutDnaFor(`${brief.leadSlug}|${brief.businessName}|${brief.industry}|${brief.city}`);
  console.log(`[build-homepage] DNA: hero=${dna.hero.id} about=${dna.about.id} footer=${dna.footer.id} chrome=${dna.chrome.id}`);

  const pool = await buildPhotoPool(brief, photos);
  const system = await generatePageSystem({ brief, dna, tokens, logoUrl, photos: pool });
  if (!system) {
    console.error("[build-homepage] the art direction pass returned nothing usable");
    return null;
  }
  console.log(`[build-homepage] "${system.systemName}" — ${system.sections.length} sections planned`);

  const systemCss = BASE_STYLESHEET;

  const [sections, footer, navigation] = await Promise.all([
    renderAllSections(system, dna, brief, logoUrl),
    renderFooter(system, dna, brief, logoUrl),
    renderChrome(system, dna, brief, logoUrl, chrome),
  ]);
  if (sections.length === 0) {
    console.error("[build-homepage] no section rendered");
    return null;
  }

  const fontHref = googleFontHref(system.typography.displayFamily, system.typography.bodyFamily);

  const compose = (list: RenderedSection[], foot: RenderedSection | null) =>
    composePage({ system, tokens, systemCss, sections: list, footer: foot, navigation });

  let composed = compose(sections, footer);
  let finalSections = sections;
  let finalFooter = footer;
  let notes: string[] = [];

  if (repair) {
    const result = await repairPage({
      system,
      sections,
      footer,
      css: composed.css,
      fullHtmlForRender: standalone(
        [navigation?.html ?? "", composed.html, footer?.html ?? ""].filter(Boolean).join("\n"),
        composed.css,
        fontHref
      ),
    });
    finalSections = result.sections;
    finalFooter = result.footer;
    notes = result.notes;
    composed = compose(finalSections, finalFooter);
  }

  return {
    html: composed.html,
    chromeHtml: navigation ? enforceChromeHrefs(navigation.html, chrome) : null,
    footerHtml: finalFooter?.html ?? null,
    css: composed.css,
    fontHref,
    sections: [
      ...(navigation ? [navigation] : []),
      ...finalSections,
      ...(finalFooter ? [finalFooter] : []),
    ].map((section) => ({
      id: section.id,
      kind: section.kind,
      label: section.label,
      html: section.html,
      locked: false,
    })),
    system,
    dna,
    rationale: `${system.systemName} — ${system.rationale} Layout DNA: ${dna.hero.name} hero, ${dna.about.name} about, ${dna.footer.name} footer, ${dna.chrome.name} chrome.`,
    notes,
  };
}
