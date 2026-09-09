/**
 * Every section the renderer can build.
 *
 * This lives on its own rather than in verticals/types because both sides of
 * the page decision need it and they cannot import each other:
 * `VerticalProfileSchema` embeds `DesignDnaSchema`, so design-dna.ts must not
 * reach back into verticals/types. A reference site's blueprint names the
 * nearest of these ids for each section it found, and the composer in
 * templates/index.ts resolves that name against the renderer registry.
 *
 * Adding a section kind means adding an id here, a renderer in
 * templates/index.ts, and a slot on PageCopySchema.
 */
export const SECTION_IDS = [
  "hero",
  "trust",
  "about",
  "services",
  "why-us",
  "process",
  "gallery",
  "cta-band",
  "reviews",
  "areas",
  "pricing",
  "people",
  "guarantee",
  "faq",
  "contact",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export function isSectionId(value: string): value is SectionId {
  return (SECTION_IDS as readonly string[]).includes(value);
}
