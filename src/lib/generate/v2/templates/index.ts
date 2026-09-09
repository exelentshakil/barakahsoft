import type { SectionId } from "@/lib/section-ids";
import { composePage } from "@/lib/generate/v2/compose";
import type { Entity } from "@/lib/extract-entities";
import { layoutDnaFor, type LayoutDna } from "@/lib/generate/v2/layout-dna";
import { derivePalette, rgbTriplet, readableOn, strongOn, contrastOn } from "@/lib/generate/v2/palette";
import type { DesignDna } from "@/lib/design-dna";
import type { MediaPlan } from "@/lib/media/plan-media";
import { generatePageCopy, type PageCopy } from "@/lib/generate/v2/page-copy";
import { navMarkup, footerMarkup } from "@/lib/generate/v2/templates/chrome";
import {
  heroSection,
  trustSection,
  aboutSection,
  servicesSection,
  whyUsSection,
  processSection,
  gallerySection,
  bandSection,
  reviewsSection,
  areasSection,
  guaranteeSection,
  faqSection,
  contactSection,
  type RenderContext,
} from "@/lib/generate/v2/templates/sections";
import type { SiteBrief } from "@/lib/generate-bespoke-site";

// One page, assembled from parts the application owns.
//
// The model contributes copy. Everything else — running order, markup,
// classes, palette, photography placement, links — is decided here, so a build
// cannot come back with a dead dropdown, an empty image frame, an invented
// href or a stylesheet that leaves half the page unstyled. Those were not bad
// prompts; they were the cost of asking a model to do a job that has a correct
// answer already known.

const TONES = [
  "Direct and plain-spoken. Short sentences. Sounds like the owner talking, not a brochure.",
  "Confident and premium. Calm authority, no hype, emphasis on craft and standards.",
  "Warm and local. Neighbourly, personal, emphasis on being reachable and accountable.",
  "Urgent and practical. Problem-first, speed and reliability foregrounded.",
];

export interface BuiltPage {
  chromeHtml: string;
  bodyHtml: string;
  footerHtml: string;
  sections: { id: string; kind: string; label: string; html: string; locked: boolean }[];
  copy: PageCopy;
  dna: LayoutDna;
  tokens: Record<string, string>;
  fontHref: string;
  rationale: string;
  /** Sections the reference asked for that this build could not or would not
   *  render, each with the reason. Written to qa_notes; this list is the
   *  roadmap for which renderer to build next. */
  notes: string[];
}

function fontHrefFor(display: string, body: string): string {
  const families = [...new Set([display, body])]
    .map((family) => `family=${encodeURIComponent(family.trim()).replace(/%20/g, "+")}:wght@400;500;600;700;800;900`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

const TYPE_PAIRS = [
  { display: "Archivo Black", body: "Inter" },
  { display: "Anton", body: "Inter" },
  { display: "Bebas Neue", body: "Source Sans 3" },
  { display: "Oswald", body: "Inter" },
  { display: "Barlow Condensed", body: "Barlow" },
  { display: "Poppins", body: "Inter" },
  { display: "Manrope", body: "Inter" },
];

/**
 * Every section the engine can build, by id.
 *
 * A profile's `sections` array is a list of these ids in page order; adding a
 * section kind means adding one entry here, one renderer, and one slot on
 * PageCopySchema.
 */
const RENDERERS: Record<
  SectionId,
  { kind: string; label: string; render: (ctx: RenderContext) => string }
> = {
  hero: { kind: "hero", label: "Hero", render: heroSection },
  trust: { kind: "proof", label: "Trust bar", render: trustSection },
  about: { kind: "about", label: "About", render: aboutSection },
  services: { kind: "services", label: "Services", render: servicesSection },
  "why-us": { kind: "proof", label: "Why choose us", render: whyUsSection },
  process: { kind: "process", label: "How it works", render: processSection },
  gallery: { kind: "proof", label: "Recent work", render: gallerySection },
  "cta-band": { kind: "cta", label: "Conversion band", render: bandSection },
  reviews: { kind: "reviews", label: "Reviews", render: reviewsSection },
  areas: { kind: "areas", label: "Service areas", render: areasSection },
  guarantee: { kind: "contact", label: "Guarantee & booking", render: guaranteeSection },
  faq: { kind: "faq", label: "FAQ", render: faqSection },
  contact: { kind: "contact", label: "Contact", render: contactSection },
};

export async function buildPage(args: {
  brief: SiteBrief;
  logoUrl: string | null;
  /** Slot-matched client photography, in plan order. Always used first. */
  media: MediaPlan;
  /** Stock top-up, used only where the plan has no real photo. */
  photos: string[];
  /** The client's OWN photographs, including anything uploaded since the last
   *  build. Only these may appear under "our recent work". */
  clientPhotos: string[];
  brandHex: string | null;
  /** The operator's design direction from the brief screen. */
  design: DesignDna | null;
  /** Verified facts from the client's own site. Decides which of the
   *  reference's sections this business can actually fill. */
  entities?: Entity[];
  innerPagesBuilt: boolean;
}): Promise<BuiltPage> {
  const { brief, logoUrl, media, photos, clientPhotos, brandHex, design, innerPagesBuilt } = args;
  const entities = args.entities ?? [];

  const dna = layoutDnaFor(`${brief.leadSlug}|${brief.businessName}|${brief.industry}|${brief.city}`, brief.layoutSalt ?? 0);

  // The operator picked a design direction on the brief screen — palette,
  // typefaces, geometry. Deriving our own from a scraped hex ignored that and
  // produced a yellow page for a business whose brief said #F37A1F. The brief
  // wins; the derived harmony only fills in what it does not specify.
  const derived = derivePalette(design?.palette.primary ?? brandHex, dna.seed);
  const palette = {
    primary: design?.palette.primary ?? derived.primary,
    accent: design?.palette.accent ?? derived.accent,
    ink: design?.palette.ink ?? derived.ink,
    surface: design?.palette.surface ?? derived.surface,
    surfaceAlt: design?.palette.surfaceAlt ?? derived.surfaceAlt,
    inkMuted: design?.palette.inkMuted ?? null,
    onPrimary: design?.palette.onPrimary ?? null,
    scheme: design ? "from the operator's design direction" : derived.scheme,
  };
  const type = design?.typography.displayFamily
    ? { display: design.typography.displayFamily, body: design.typography.bodyFamily || design.typography.displayFamily }
    : TYPE_PAIRS[dna.seed % TYPE_PAIRS.length];
  const composition = composePage({
    vertical: brief.vertical,
    design,
    capability: {
      entities,
      hasReviews: Boolean(brief.rating || brief.reviewCount),
      hasPhotos: clientPhotos.length > 0,
      areaCount: brief.areas.length,
      serviceCount: brief.services.length,
    },
  });
  console.log(
    `[build-page] ${composition.sections.length} sections from the ${composition.source}` +
      `${composition.notes.length ? `, ${composition.notes.length} dropped` : ""}: ` +
      composition.sections.map((section) => section.kind).join(" → ")
  );


  const copy = await generatePageCopy(brief, TONES[dna.seed % TONES.length], composition.sections);

  // Before phase 2 the inner routes genuinely do not exist, so linking at them
  // would ship a nav full of 404s on the impression that decides the sale.
  const href = (path: string) => {
    if (innerPagesBuilt) return path;
    if (path === "/") return "#hero";
    if (path.startsWith("/services")) return "#services";
    if (path.startsWith("/areas")) return "#areas";
    if (path === "/about") return "#about";
    if (path === "/faq") return "#faq";
    if (path === "/contact") return "#contact";
    return "#hero";
  };

  // Photography comes from the plan the operator can see and edit on the brief
  // screen — hero, about, proof, then one per service — before any stock is
  // considered. The previous build ignored all nine of a client's own photos
  // and shipped stock instead, which is the fastest way to lose the sale.
  const bySlot = new Map(media.map((item) => [item.slot, item.url]));
  const ordered = [
    bySlot.get("hero"),
    bySlot.get("about"),
    bySlot.get("proof"),
    ...media.filter((item) => item.slot.startsWith("service-")).map((item) => item.url),
    ...media.map((item) => item.url),
    ...photos,
  ].filter((url): url is string => Boolean(url));
  const resolvedPhotos = [...new Set(ordered)];

  // The gallery is the client's OWN work or it is nothing. Stock in a section
  // headed "our recent work" is a lie, and the logo appearing among the photos
  // is what made that grid look cluttered and unfinished.
  // Work photography only: the service and proof slots. The hero shot is
  // already the first thing on the page, and the about slot is the founders'
  // portrait — a family photo under the heading "recent projects" is wrong.
  const planned = media.filter((item) => item.origin === "real");
  const spentElsewhere = new Set([bySlot.get("hero"), bySlot.get("about")].filter(Boolean) as string[]);

  const realPhotos = [
    ...new Set([
      // The plan's work slots first, in plan order.
      ...planned.filter((item) => item.slot.startsWith("service-") || item.slot === "proof").map((item) => item.url),
      // Then the client's own photographs the plan did not place. The media
      // plan is reused between builds so operator choices stick, which meant a
      // photo uploaded after the first build was never slotted and so never
      // reached the gallery — uploading two images to balance the grid did
      // nothing at all. Stock is deliberately excluded: a stock photo under
      // "our recent work" is a lie about who did the work.
      ...clientPhotos.filter((url) => !spentElsewhere.has(url)),
    ]),
  ].filter((url) => url !== logoUrl && !/logo|badge|icon|favicon/i.test(url) && !spentElsewhere.has(url));
  console.log(`[build-page] ${media.length} planned photo(s) from the brief, ${resolvedPhotos.length} usable in total`);

  const ctx: RenderContext = {
    brief,
    copy,
    dna,
    logoUrl,
    photos: resolvedPhotos,
    galleryPhotos: realPhotos,
    href,
    primaryHref: href("/contact"),
  };

  // The unified render engine: one renderer per section, and the reference
  // site's own structure decides which of them run and in what order.
  //
  // This was a literal array — which is why a restaurant got a Service Areas
  // section and a single-location florist got eight invented towns — and then
  // a per-vertical list, which fixed those two cases and left every business
  // in a vertical with the same page. Now a best-in-class site in the lead's
  // industry supplies the sequence and the client's own verified facts decide
  // which of it they can fill. See compose.ts.
  //
  // `label` is the studio panel name, never page text — every heading a
  // visitor reads is written by the model into `copy`, which is why a menu and
  // a service list can share one renderer.
  const labelFor = new Map(brief.vertical.sections.map((section) => [section.id, section.label]));
  const built = composition.sections
    .map((section) => {
      const renderer = RENDERERS[section.id];
      return {
        id: section.id as string,
        kind: renderer.kind,
        label: labelFor.get(section.id) ?? renderer.label,
        html: renderer.render(ctx),
      };
    })
    .filter((section) => section.html.trim().length > 0);

  const radius = { sharp: "2px", soft: "12px", rounded: "20px", pill: "999px" }[design?.geometry.radius ?? "soft"];
  const rhythm = { tight: "68px", generous: "104px", cinematic: "132px" }[design?.layout.sectionRhythm ?? "generous"];

  const tokens: Record<string, string> = {
    "--bs-primary": palette.primary,
    "--bs-primary-rgb": rgbTriplet(palette.primary),
    "--bs-on-primary": readableOn(strongOn(palette.primary)),
    // Buttons and filled chips use the strengthened colour so their text is
    // always readable; everything decorative keeps the client's exact hue.
    "--bs-primary-strong": strongOn(palette.primary),
    "--bs-accent-strong": strongOn(palette.accent),
    "--bs-accent": palette.accent,
    "--bs-accent-rgb": rgbTriplet(palette.accent),
    "--bs-on-accent": readableOn(strongOn(palette.accent)),
    "--bs-ink": palette.ink,
    "--bs-ink-rgb": rgbTriplet(palette.ink),
    // The accent, resolved against the two dark bands it actually lands on.
    //
    // A single --bs-accent was used on both, which is only safe when the band
    // is neutral charcoal. .bs-about--surface-ink is filled with the brand
    // colour, so a red client got a red eyebrow on a red band at 1.2:1 —
    // legible in the mockup only because the designer's brand happened to be
    // dark. These are solved per band instead of assumed.
    "--bs-on-brand-accent": contrastOn(palette.accent, strongOn(palette.primary)),
    "--bs-on-ink-accent": contrastOn(palette.accent, palette.ink),
    "--bs-surface": palette.surface,
    "--bs-surface-rgb": rgbTriplet(palette.surface),
    "--bs-surface-alt": palette.surfaceAlt,
    // The names sanitize-css.ts rewrites literal colours into. They were
    // never emitted here, so `color: var(--bs-primary-on-surface)` resolved
    // to nothing, the declaration was dropped as invalid, and the text
    // inherited its parent's colour — white on white on a light card. There
    // is a zero-specificity fallback for these in src/app/bespoke.css that
    // repairs already-built sites; these are the real, palette-derived values.
    //
    // primary-on-surface is the STRENGTHENED primary, not the raw one: the
    // raw brand hue is chosen to look right as a fill and routinely fails
    // 4.5:1 as text on white.
    "--bs-primary-on-surface": contrastOn(palette.primary, palette.surfaceAlt),
    "--bs-accent-on-surface": contrastOn(palette.accent, palette.surfaceAlt),
    "--bs-ink-muted": palette.inkMuted ?? `rgb(${rgbTriplet(palette.ink)} / 0.66)`,
    // Dark bands stay inside the scheme: ink is the brand hue at near-black.
    "--bs-invert-surface": palette.ink,
    "--bs-invert-ink": readableOn(palette.ink),
    "--bs-font-display": `"${type.display}", ui-sans-serif, system-ui, sans-serif`,
    "--bs-font-body": `"${type.body}", ui-sans-serif, system-ui, sans-serif`,
    "--bs-display-weight": design?.typography.displayWeight ?? "900",
    "--bs-heading-transform": design?.typography.headingCase === "upper" ? "uppercase" : "none",
    "--bs-r": radius,
    "--bs-r-lg": design?.geometry.radius === "sharp" ? "4px" : "20px",
    "--bs-section-y": rhythm,
    ...(palette.inkMuted ? { "--bs-muted": palette.inkMuted } : {}),
    ...(palette.onPrimary ? { "--bs-on-primary": palette.onPrimary } : {}),
  };

  return {
    chromeHtml: navMarkup(ctx),
    bodyHtml: built.map((section) => section.html).join("\n"),
    footerHtml: footerMarkup(ctx),
    sections: built.map((section) => ({ ...section, locked: false })),
    notes: composition.notes,
    copy,
    dna,
    tokens,
    fontHref: fontHrefFor(type.display, type.body),
    rationale: `${dna.hero.name} hero, ${dna.about.name} about, ${dna.chrome.name} chrome. ${palette.scheme} palette, ${type.display} over ${type.body}. ${built.length} sections, markup owned by the application, copy written for this business.`,
  };
}
