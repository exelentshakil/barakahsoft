import { z } from "zod";
import { SECTION_IDS } from "@/lib/section-ids";

// How this particular page is put together.
//
// The engine's variation used to be a fixed vocabulary: five hero archetypes,
// three about archetypes and three numbered variants of everything else,
// picked by hash. That is roughly 400 arrangements shared across every site
// ever built, so two gyms collide often and — worse — every page carries the
// same handful of shapes, which is what makes them read as one template no
// matter whose facts are in them.
//
// So the model designs the page instead, one section at a time, out of
// PRIMITIVES rather than named layouts. Nine axes per section, multiplied
// across a dozen sections, is a space nothing repeats inside.
//
// The thing that makes handing a model this much freedom safe is that none of
// these axes is a colour, a pixel value or a piece of markup. `ground` is a
// ROLE — surface, alt, ink, brand — and the text colour on it is computed from
// the palette by the token compiler. A model cannot author an unreadable pair
// here, because it is not authoring colours at all. Same for spacing, radius
// and type: it picks a role and the system resolves it.
//
// This replaces layout-plan.ts's archetype mapping, which was a real
// improvement over the hash but still chose from a list of five.

/** Where the section's media sits relative to its words. */
export const MEDIA_POSITIONS = ["left", "right", "top", "bottom", "background", "inset", "none"] as const;

/** The overall shape of a section's content. */
export const LAYOUT_FAMILIES = [
  /** Two columns, words one side, media the other. */
  "split",
  /** One centred column. */
  "stack",
  /** Equal cards in a grid. */
  "grid",
  /** Wide rows, one per item. */
  "rows",
  /** A horizontal rail that scrolls on small screens. */
  "rail",
  /** Content card lifted over the section boundary. */
  "overlap",
  /** Full-bleed band, edge to edge. */
  "band",
  /** One large item with smaller ones beside it. */
  "feature",
  /** Uneven grid, deliberately irregular. */
  "mosaic",
] as const;

/**
 * The background this section sits on, as a role.
 *
 * Never a colour. `ink` means the page's dark band, `brand` the primary fill;
 * both resolve through the token compiler, which guarantees the text on them
 * clears 4.5:1 whatever the client's palette turns out to be.
 */
export const GROUNDS = ["surface", "alt", "ink", "brand", "image"] as const;

export const SectionDesignSchema = z.object({
  /** Which renderer family builds it. */
  id: z.enum(SECTION_IDS),
  /** This industry's own word for the section: "membership-tiers", "menu-by-course". */
  kind: z.string().max(40),
  layout: z.enum(LAYOUT_FAMILIES),
  media: z.enum(MEDIA_POSITIONS),
  /** 1–4. Ignored by layouts that do not take columns. */
  columns: z.number().int().min(1).max(4).default(3),
  align: z.enum(["left", "center"]).default("left"),
  ground: z.enum(GROUNDS).default("surface"),
  density: z.enum(["tight", "regular", "airy"]).default("regular"),
  /** How this section separates from the one above it. */
  divider: z.enum(["none", "rule", "diagonal", "curve", "notch"]).default("none"),
  /** One structural device. Numbering only where the content is a sequence. */
  emphasis: z.enum(["none", "numbered", "oversized-index", "accent-rule", "eyebrow-slab"]).default("none"),
  /** Media aspect where the section shows any. */
  mediaShape: z.enum(["wide", "square", "portrait", "arch", "circle", "bleed"]).default("wide"),
});

export type SectionDesign = z.infer<typeof SectionDesignSchema>;

export const PageDesignSchema = z.object({
  sections: z.array(SectionDesignSchema).min(5).max(14),
  chrome: z.object({
    /** How the header carries itself. */
    style: z.enum(["utility-bar", "floating-glass", "stacked-brand", "side-rail", "minimal"]),
    ground: z.enum(["ink", "surface", "brand", "transparent"]).default("ink"),
    /** Where the primary action sits in the bar. */
    action: z.enum(["button", "phone", "both", "none"]).default("button"),
  }),
  footer: z.object({
    style: z.enum(["cta-slab", "map-anchored", "big-type", "split-panel", "columns"]),
    ground: z.enum(["ink", "surface", "brand"]).default("ink"),
  }),
  /** One sentence on why this page is shaped this way. Shown to the operator. */
  rationale: z.string().max(400).default(""),
});

export type PageDesign = z.infer<typeof PageDesignSchema>;

/**
 * Every axis, as CSS classes.
 *
 * One class per axis rather than one class per named archetype, so the
 * stylesheet implements nine small orthogonal things instead of forty
 * combinations it has to anticipate.
 */
export function sectionClasses(design: SectionDesign): string {
  return [
    `bs-s`,
    `bs-s--${design.layout}`,
    `bs-s--media-${design.media}`,
    `bs-s--cols-${design.columns}`,
    `bs-s--${design.align}`,
    `bs-s--on-${design.ground}`,
    `bs-s--${design.density}`,
    design.divider !== "none" ? `bs-s--div-${design.divider}` : "",
    design.emphasis !== "none" ? `bs-s--em-${design.emphasis}` : "",
    `bs-s--shape-${design.mediaShape}`,
  ]
    .filter(Boolean)
    .join(" ");
}
