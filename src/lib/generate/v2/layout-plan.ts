import type { DesignDna } from "@/lib/design-dna";

// Which layout each section uses.
//
// The stylesheet has five real hero layouts, three about layouts and three
// variants of every other section — and which one a page got was decided by
// `variant(seed, salt)`, a hash of the lead's slug. So layout varied per lead
// but was completely disconnected from the reference site and from the design
// direction the operator chose in the Studio.
//
// Meanwhile `DesignDna.layout` has carried the reference's actual archetypes
// since the beginning — heroTreatment, serviceLayout, imageDensity, proofStyle
// — extracted from the live site, stored on the artifact, printed in the admin
// panel, and read by nothing that renders. This is the third place the same
// thing was true: the reference's sections were thrown away (fixed by the
// blueprint) and its computed tokens were thrown away (fixed by compiling one
// token set). This is its layout.
//
// So the reference decides every axis it actually has an opinion about, and
// the seed decides the rest. Two gyms with different references now differ in
// hero shape, service layout and image rhythm, not merely in which of three
// hashes came up.

export interface LayoutPlan {
  /** Hero archetype class: split-form, offset-slab, centered-editorial, … */
  hero: string;
  /** About archetype class. */
  about: string;
  heroVariant: string;
  aboutVariant: string;
  services: string;
  gallery: string;
  whyUs: string;
  process: string;
  areas: string;
  /** Header treatment: utility-bar, floating-glass, stacked-brand. */
  chrome: string;
  /** Footer treatment: cta-slab, map-anchored, big-type, split-panel. */
  footer: string;
  /** What pinned each axis, for the operator and for debugging. */
  source: string;
}

/** The seed fallback, unchanged: deterministic per lead, independent per section. */
function seeded(seed: number, salt: number): string {
  return `v${((seed + salt * 2654435761) % 3) + 1}`;
}

/**
 * A reference's hero treatment, expressed as one of the layouts we can build.
 *
 * Each pairing is a real correspondence, not a shuffle: "split-editorial" is
 * two columns with the form beside the promise, which is `split-form`;
 * "dark-utility-band" is a solid ink slab bleeding off one edge, which is
 * `offset-slab`. `diagonal-band` is deliberately absent — it is in the
 * archetype list but has no CSS, so mapping to it would silently render the
 * unstyled base.
 */
const HERO_FOR: Record<DesignDna["layout"]["heroTreatment"], string> = {
  "split-editorial": "split-form",
  "full-bleed-image": "centered-editorial",
  "dark-utility-band": "offset-slab",
  "gradient-statement": "card-stack",
};

/**
 * How the reference lays out what it sells.
 *
 * Four archetypes and three built variants, so two of them share: an editorial
 * list and numbered rows are both a single column of wide rows, which is what
 * v2 is. Sharing is stated rather than hidden — the alternative is inventing a
 * fourth variant that nobody has looked at.
 */
const SERVICES_FOR: Record<DesignDna["layout"]["serviceLayout"], string> = {
  "feature-grid": "v1",
  "editorial-list": "v2",
  "numbered-rows": "v2",
  "bento-grid": "v3",
};

const GALLERY_FOR: Record<DesignDna["layout"]["imageDensity"], string> = {
  "hero-led": "v1",
  balanced: "v2",
  "gallery-led": "v3",
};

/**
 * How the reference presents proof, applied to the why-us row.
 *
 * A stat band is three big numbers; quote cards and a carousel are text-led
 * blocks that want more room each. That is the axis v1/v2/v3 vary on, so the
 * mapping is about density rather than about the word "proof".
 */
const WHYUS_FOR: Record<DesignDna["layout"]["proofStyle"], string> = {
  "stat-band": "v1",
  "logo-strip": "v1",
  "quote-cards": "v2",
  "review-carousel": "v3",
};

/**
 * The about layout, taken from the reference's mood.
 *
 * Mood is the one signal that says how personal the page reads, and the three
 * about layouts differ in exactly that: a portrait with a pull-quote is a
 * person talking, an editorial column is a brand talking.
 */
const ABOUT_FOR: Partial<Record<DesignDna["mood"], string>> = {
  "light-editorial": "editorial-column",
  "warm-craft": "portrait-quote",
  "dark-premium": "overlap-card",
  "bold-utility": "overlap-card",
  "clinical-trust": "editorial-column",
};

/**
 * The header, from how the reference carries itself.
 *
 * A dark premium page floats its bar over the content; a utility brand pins a
 * flat one to the top edge; an editorial brand centres its name above the
 * links. These were three archetypes chosen by seed in layout-dna and never
 * rendered — `chrome.ts` emitted one fixed header for every site ever built.
 */
const CHROME_FOR: Record<DesignDna["mood"], string> = {
  "dark-premium": "floating-glass",
  "bold-utility": "utility-bar",
  "clinical-trust": "utility-bar",
  "light-editorial": "stacked-brand",
  "warm-craft": "stacked-brand",
};

/**
 * The footer, from the reference's rhythm — and from whether the business has
 * somewhere to send people.
 *
 * `map-anchored` is the one that depends on the client rather than the
 * reference: a footer built around an address is wrong for a business that
 * never gave one, which is the same rule the whole composer runs on.
 */
function footerFor(design: DesignDna, hasAddress: boolean, seed: number): string {
  if (hasAddress && design.layout.sectionRhythm !== "cinematic") return "map-anchored";
  if (design.typography.scale === "dramatic" || design.layout.sectionRhythm === "cinematic") return "big-type";
  if (design.mood === "bold-utility") return "cta-slab";
  return seed % 2 === 0 ? "split-panel" : "cta-slab";
}

export function layoutPlanFor(
  design: DesignDna | null,
  seed: number,
  seedAbout: string,
  hasAddress = false
): LayoutPlan {
  if (!design) {
    return {
      hero: "",
      about: seedAbout,
      heroVariant: seeded(seed, 1),
      aboutVariant: seeded(seed, 2),
      services: seeded(seed, 3),
      whyUs: seeded(seed, 4),
      process: seeded(seed, 5),
      gallery: seeded(seed, 6),
      areas: seeded(seed, 7),
      chrome: ["utility-bar", "floating-glass", "stacked-brand"][seed % 3],
      footer: ["cta-slab", "map-anchored", "big-type", "split-panel"][seed % 4],
      source: "seed (no design direction)",
    };
  }

  return {
    hero: HERO_FOR[design.layout.heroTreatment] ?? "",
    about: ABOUT_FOR[design.mood] ?? seedAbout,
    // The reference pins the shape; the seed still varies the trim, so two
    // leads sharing one reference are not byte-identical.
    heroVariant: seeded(seed, 1),
    aboutVariant: seeded(seed, 2),
    services: SERVICES_FOR[design.layout.serviceLayout] ?? seeded(seed, 3),
    whyUs: WHYUS_FOR[design.layout.proofStyle] ?? seeded(seed, 4),
    // The reference says nothing about how a process row looks or how service
    // areas are listed, so those stay on the seed rather than being invented.
    process: seeded(seed, 5),
    gallery: GALLERY_FOR[design.layout.imageDensity] ?? seeded(seed, 6),
    areas: seeded(seed, 7),
    chrome: CHROME_FOR[design.mood] ?? "utility-bar",
    footer: footerFor(design, hasAddress, seed),
    source: `${design.sourceName}: ${design.layout.heroTreatment} hero, ${design.layout.serviceLayout} services, ${design.layout.imageDensity} imagery, ${design.layout.proofStyle} proof, ${CHROME_FOR[design.mood] ?? "utility-bar"} header, ${footerFor(design, hasAddress, seed)} footer`,
  };
}
