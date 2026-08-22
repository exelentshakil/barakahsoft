import type { DesignDna } from "@/lib/design-dna";

// Per-lead header and footer design.
//
// Until now every delivered site shared one mega menu and one footer, so
// however bespoke the body was, the frame around it announced a production
// line. This makes the chrome part of the design system.
//
// It is a SPEC, not generated markup, and that distinction is deliberate.
// Navigation carries real routing, real click tracking and the quote modal;
// markup written by a model is how a site ends up with a beautiful nav
// linking to four pages that were never built. The spec picks archetype,
// density and treatment; reviewed React renders it.
//
// The archetype is also chosen from how much site there actually IS. A mega
// menu fronting three links is worse than no mega menu — it reads as a
// template with the content missing, which is precisely the "blank header
// with bad whitespace" failure this replaces.

export type NavArchetype =
  /** Multi-column dropdown panels. Earns its place only with real depth. */
  | "mega"
  /** Links left, contact and CTA right. The workhorse. */
  | "split"
  /** Logo centered, links either side. Editorial, low link counts. */
  | "centered"
  /** Logo and one CTA. For sites with very few pages. */
  | "minimal";

export type FooterArchetype =
  /** Full sitemap in columns. Needs real link volume to look right. */
  | "columns"
  /** A statement line, contact block, thin legal row. */
  | "editorial"
  /** Oversized call to action above a compact link row. */
  | "bold-cta"
  /** Single row: identity, contact, legal. */
  | "compact";

export interface ChromeSpec {
  nav: {
    archetype: NavArchetype;
    /** Thin bar above the nav carrying phone, rating and hours. */
    utilityBar: boolean;
    sticky: boolean;
    /** How the primary nav CTA is treated. */
    ctaStyle: "solid" | "accent" | "ghost";
    /** Show the phone number as its own click-to-call element in the nav. */
    showPhone: boolean;
    /** Show a rating badge in the chrome. Only when a real rating exists. */
    showRating: boolean;
    /** Whether services get a dropdown at all, or render as a single link. */
    servicesDropdown: boolean;
    areasDropdown: boolean;
  };
  footer: {
    archetype: FooterArchetype;
    /** Repeat the primary call to action prominently in the footer. */
    ctaBand: boolean;
    showAreas: boolean;
    showServices: boolean;
  };
}

export interface ChromeInputs {
  services: string[];
  areas: string[];
  hasPhone: boolean;
  hasReviews: boolean;
}

function navArchetypeFor(dna: DesignDna, inputs: ChromeInputs): NavArchetype {
  const linkVolume = inputs.services.length + inputs.areas.length;

  // Depth first: a mega menu is a solution to having a lot of pages, not a
  // style choice. Below real depth it looks like an empty template.
  if (linkVolume >= 10) return "mega";
  if (linkVolume <= 2) return "minimal";

  // Within the workable middle, let the design direction decide.
  if (dna.mood === "light-editorial" || dna.typography.scale === "dramatic") return "centered";
  return "split";
}

function footerArchetypeFor(dna: DesignDna, inputs: ChromeInputs): FooterArchetype {
  const linkVolume = inputs.services.length + inputs.areas.length;

  if (linkVolume >= 10) return "columns";
  if (linkVolume <= 3) return "compact";
  return dna.mood === "bold-utility" || dna.mood === "dark-premium" ? "bold-cta" : "editorial";
}

export function buildChromeSpec(dna: DesignDna, inputs: ChromeInputs): ChromeSpec {
  const archetype = navArchetypeFor(dna, inputs);

  return {
    nav: {
      archetype,
      // Always off. A thin bar above the navigation carrying a phone number
      // is a convention from cheap contractor templates, and with nothing to
      // announce it is pure clutter above the one screen that has to sell.
      // The phone already appears in the navigation and in the hero.
      utilityBar: false,
      sticky: true,
      ctaStyle: dna.mood === "bold-utility" ? "accent" : "solid",
      showPhone: inputs.hasPhone,
      showRating: inputs.hasReviews,
      // A dropdown holding one item is worse than a plain link.
      servicesDropdown: inputs.services.length >= 3,
      areasDropdown: inputs.areas.length >= 3,
    },
    footer: {
      archetype: footerArchetypeFor(dna, inputs),
      ctaBand: dna.mood !== "clinical-trust",
      showAreas: inputs.areas.length > 0,
      showServices: inputs.services.length > 0,
    },
  };
}

/** Used for leads generated before chrome was part of the design system. */
export const DEFAULT_CHROME: ChromeSpec = {
  nav: {
    archetype: "split",
    utilityBar: false,
    sticky: true,
    ctaStyle: "solid",
    showPhone: true,
    showRating: false,
    servicesDropdown: true,
    areasDropdown: false,
  },
  footer: { archetype: "editorial", ctaBand: true, showAreas: false, showServices: true },
};
