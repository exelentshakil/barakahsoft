import { layoutDnaFor, type LayoutDna } from "@/lib/generate/v2/layout-dna";
import { derivePalette, rgbTriplet, readableOn } from "@/lib/generate/v2/palette";
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
  bookingSection,
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

export async function buildPage(args: {
  brief: SiteBrief;
  logoUrl: string | null;
  photos: string[];
  brandHex: string | null;
  innerPagesBuilt: boolean;
}): Promise<BuiltPage> {
  const { brief, logoUrl, photos, brandHex, innerPagesBuilt } = args;

  const dna = layoutDnaFor(`${brief.leadSlug}|${brief.businessName}|${brief.industry}|${brief.city}`);
  const palette = derivePalette(brandHex, dna.seed);
  const type = TYPE_PAIRS[dna.seed % TYPE_PAIRS.length];
  const copy = await generatePageCopy(brief, TONES[dna.seed % TONES.length]);

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

  const ctx: RenderContext = {
    brief,
    copy,
    dna,
    logoUrl,
    photos,
    href,
    primaryHref: href("/contact"),
  };

  const built: { id: string; kind: string; label: string; html: string }[] = [
    { id: "hero", kind: "hero", label: "Hero", html: heroSection(ctx) },
    { id: "trust", kind: "proof", label: "Trust bar", html: trustSection(ctx) },
    { id: "about", kind: "about", label: "About", html: aboutSection(ctx) },
    { id: "services", kind: "services", label: "Services", html: servicesSection(ctx) },
    { id: "why-us", kind: "proof", label: "Why choose us", html: whyUsSection(ctx) },
    { id: "process", kind: "process", label: "How it works", html: processSection(ctx) },
    { id: "gallery", kind: "proof", label: "Recent work", html: gallerySection(ctx) },
    { id: "cta-band", kind: "cta", label: "Conversion band", html: bandSection(ctx) },
    { id: "reviews", kind: "reviews", label: "Reviews", html: reviewsSection(ctx) },
    { id: "areas", kind: "areas", label: "Service areas", html: areasSection(ctx) },
    { id: "booking", kind: "contact", label: "Book a visit", html: bookingSection(ctx) },
    { id: "faq", kind: "faq", label: "FAQ", html: faqSection(ctx) },
    { id: "contact", kind: "contact", label: "Contact", html: contactSection(ctx) },
  ].filter((section) => section.html.trim().length > 0);

  const tokens: Record<string, string> = {
    "--bs-primary": palette.primary,
    "--bs-primary-rgb": rgbTriplet(palette.primary),
    "--bs-on-primary": readableOn(palette.primary),
    "--bs-accent": palette.accent,
    "--bs-accent-rgb": rgbTriplet(palette.accent),
    "--bs-on-accent": readableOn(palette.accent),
    "--bs-ink": palette.ink,
    "--bs-ink-rgb": rgbTriplet(palette.ink),
    "--bs-surface": palette.surface,
    "--bs-surface-alt": palette.surfaceAlt,
    "--bs-font-display": `"${type.display}", ui-sans-serif, system-ui, sans-serif`,
    "--bs-font-body": `"${type.body}", ui-sans-serif, system-ui, sans-serif`,
    "--bs-display-weight": "900",
  };

  return {
    chromeHtml: navMarkup(ctx),
    bodyHtml: built.map((section) => section.html).join("\n"),
    footerHtml: footerMarkup(ctx),
    sections: built.map((section) => ({ ...section, locked: false })),
    copy,
    dna,
    tokens,
    fontHref: fontHrefFor(type.display, type.body),
    rationale: `${dna.hero.name} hero, ${dna.about.name} about, ${dna.chrome.name} chrome. ${palette.scheme} palette derived from the client's brand colour, ${type.display} over ${type.body}. ${built.length} sections, markup owned by the application, copy written for this business.`,
  };
}
