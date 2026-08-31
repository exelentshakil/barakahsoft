// Per-lead layout DNA.
//
// Uniqueness is chosen here, deterministically, rather than left to the
// model to "be creative" — free-form invention is exactly what produced the
// broken build (a logo stretched full-bleed as the hero image, text clipped
// by its own container, a founder badge sitting on top of body copy).
//
// A lead always resolves to the same DNA, so a rebuild is a rebuild and not
// a different website. Two different leads in the same trade land on
// different archetypes because the hash of their identity differs.


/**
 * Page recipes — the part that was never varying.
 *
 * The archetypes above already spread across roughly 29,000 combinations, so
 * two roofers were never getting the same hero. They still felt like the same
 * website, because the *skeleton* was identical every time: thirteen sections,
 * ten of them unconditional, always in one order. People read sameness off
 * scroll rhythm long before they read it off which hero variant they got.
 *
 * A recipe fixes the spine — hero, trust and contact never move, because that
 * is the order a buyer's questions actually arrive in — and varies everything
 * between them: the order of the middle, and which optional blocks a page
 * carries at all. A real agency's sites differ this way; not every one of them
 * runs a process strip and a guarantee band.
 *
 * Curated rather than model-composed, for the reason at the top of this file:
 * every recipe here is an arrangement somebody has looked at.
 */
export interface PageRecipe {
  id: string;
  name: string;
  /** Middle sections in order. Anything omitted is not built for this lead. */
  middle: string[];
}

/** Sections the recipe may arrange. The spine is not in here — it cannot move. */
export const MIDDLE_SECTIONS = [
  "about",
  "services",
  "why-us",
  "process",
  "gallery",
  "emergency",
  "reviews",
  "areas",
  "guarantee",
  "faq",
] as const;

const RECIPES: PageRecipe[] = [
  {
    id: "proof-first",
    name: "Proof first",
    middle: ["reviews", "services", "about", "why-us", "gallery", "areas", "faq"],
  },
  {
    id: "services-led",
    name: "Services led",
    middle: ["services", "why-us", "gallery", "reviews", "process", "areas", "faq"],
  },
  {
    id: "story-led",
    name: "Owner story led",
    middle: ["about", "why-us", "services", "reviews", "guarantee", "areas", "faq"],
  },
  {
    id: "emergency-led",
    name: "Emergency response led",
    middle: ["emergency", "services", "reviews", "process", "why-us", "areas", "faq"],
  },
  {
    id: "showcase",
    name: "Work showcase",
    middle: ["gallery", "services", "reviews", "about", "guarantee", "areas", "faq"],
  },
  {
    id: "trust-heavy",
    name: "Trust heavy",
    middle: ["reviews", "guarantee", "about", "services", "why-us", "faq", "areas"],
  },
  {
    id: "method",
    name: "Method and process",
    middle: ["process", "services", "why-us", "gallery", "reviews", "faq", "areas"],
  },
  {
    id: "local-first",
    name: "Local first",
    middle: ["areas", "services", "reviews", "about", "why-us", "faq"],
  },
  {
    id: "lean-services",
    name: "Lean services",
    middle: ["services", "reviews", "about", "faq"],
  },
  {
    id: "lean-proof",
    name: "Lean proof",
    middle: ["reviews", "services", "gallery", "faq"],
  },
  {
    id: "editorial",
    name: "Editorial",
    middle: ["about", "gallery", "services", "reviews", "areas", "faq"],
  },
  {
    id: "guarantee-led",
    name: "Guarantee led",
    middle: ["guarantee", "services", "reviews", "why-us", "process", "areas", "faq"],
  },
  {
    id: "conversion-dense",
    name: "Conversion dense",
    middle: ["services", "reviews", "emergency", "why-us", "guarantee", "gallery", "areas", "faq"],
  },
  {
    id: "why-us-led",
    name: "Differentiator led",
    middle: ["why-us", "services", "reviews", "about", "gallery", "faq", "areas"],
  },
  {
    id: "full-depth",
    name: "Full depth",
    middle: ["about", "services", "why-us", "process", "gallery", "reviews", "guarantee", "areas", "faq"],
  },
  {
    id: "review-sandwich",
    name: "Review sandwich",
    middle: ["reviews", "services", "why-us", "about", "gallery", "reviews", "faq", "areas"],
  },
];

export interface LayoutDna {
  seed: number;
  recipe: PageRecipe;
  hero: HeroArchetype;
  about: AboutArchetype;
  footer: FooterArchetype;
  chrome: ChromeArchetype;
  rhythm: string;
  motif: string;
  cornerStyle: "sharp" | "soft" | "pill" | "mixed";
  contrastStrategy: string;
  /** Identifies this exact composition, for the no-two-leads-alike check. */
  fingerprint: string;
}

export interface Archetype {
  id: string;
  name: string;
  /** Written to the art director and to the section renderer verbatim. */
  spec: string;
}

type HeroArchetype = Archetype;
type AboutArchetype = Archetype;
type FooterArchetype = Archetype;
type ChromeArchetype = Archetype;

const HEROES: HeroArchetype[] = [
  {
    id: "split-form",
    name: "Split promise + inline lead form",
    spec: `Full-bleed photographic background under a heavy dark scrim. Two columns. LEFT (~55%): a solid
accent-filled eyebrow chip in caps, then a MASSIVE display headline of three or four short lines with the
final line set in the brand colour, a two-line subhead, a trust strip (five star glyphs, the rating, the
review count, and the words Google and Facebook), and a click-to-call link. RIGHT (~42%): the lead-capture
form as a white elevated card with a solid brand-coloured header bar carrying a two-line hook, a small
downward triangle notch under the bar, five fields, a full-width brand-coloured submit button and one line
of reassurance under it. The card overlaps the section's bottom edge.`,
  },
  {
    id: "offset-slab",
    name: "Offset colour slab + form",
    spec: `Photographic right two-thirds. A solid ink slab bleeds off the left edge and overlaps the photo.
On the slab: an accent rule and eyebrow, an oversized display headline with one line in the brand colour, a
short proof line, and a rating strip. The lead-capture form sits as a white card floating over the photo on
the right, with a brand-coloured header bar. A horizontal proof bar of four credential items with small
icons is pinned across the full width of the hero's bottom edge.`,
  },
  {
    id: "centered-editorial",
    name: "Centred statement + wide form bar",
    spec: `Centred and confident over a darkened photograph. A small caps eyebrow chip, a very large centred
display headline with one word in the brand colour, a single-sentence subhead at a 60ch measure, and a
rating strip with star glyphs. Directly beneath, the lead-capture form is a wide horizontal white bar —
fields laid out in one row on desktop, stacked on mobile — with the submit button as the final cell in the
brand colour. Four credential chips sit under the bar.`,
  },
  {
    id: "diagonal-band",
    name: "Diagonal brand band + form card",
    spec: `Photo background with a diagonal clip-path brand-coloured band crossing the lower third. Copy sits
left in the upper two-thirds: eyebrow chip, heavy display headline with the last line in white on the brand
colour, subhead, rating strip. The lead-capture form is a white card on the right spanning from the upper
area down over the diagonal band, with a coloured header bar. The band itself carries the phone number as a
large click-to-call link and a guarantee line.`,
  },
  {
    id: "card-stack",
    name: "Framed hero card + form",
    spec: `Ink page background with a large rounded content card inset by 32px holding the photograph. Copy
overlays the card's left under a gradient scrim: eyebrow chip, huge display headline with one line in the
brand colour, subhead, rating strip. The lead-capture form is a white card overlapping the photo card's
right side, with a brand-coloured header bar. Beneath the card, three outcome tiles (icon, three-word title,
one line) half-overlap its bottom edge.`,
  },
  {
    id: "stat-anchored",
    name: "Promise, stat rail and form",
    spec: `Photograph on the right under a scrim; copy on the left over a deep ink panel. Eyebrow chip, huge
display headline with one line in the brand colour, subhead, then a vertical rail of three stats (big
brand-coloured number, label, hairline between). The lead-capture form is a white card overlapping the
photograph, with a brand-coloured header bar and a compact five-field layout.`,
  },
];

const ABOUTS: AboutArchetype[] = [
  {
    id: "overlap-card",
    name: "Overlapping founder card",
    spec: `A white surface card lifted into the previous section by a negative top margin, holding a 4:3 owner/crew photograph on the left and the story on the right. A two-part founder badge (logo tile + name plate with a slanted inner edge) sits on the photo's lower-left corner, fully inside the photo bounds and never over text. Below the card, a full-width ink band of four stats with accent-coloured numbers.`,
  },
  {
    id: "editorial-column",
    name: "Editorial two-column story",
    spec: `Left column: a stacked pair of photographs, the lower one offset right and overlapping the upper by ~48px, with a small caption. Right column: eyebrow pill, a three-line headline, two paragraphs of real story at a 62ch measure, a signature line (founder name in a script or italic face) and one primary action. A quiet quarter-tone background separates it from its neighbours.`,
  },
  {
    id: "portrait-quote",
    name: "Portrait with pull-quote",
    spec: `Full-height portrait on one side bleeding to the page edge; on the other, a large pull-quote from the owner set in the display face with an oversized quotation mark motif, attributed by name and role, followed by two short paragraphs and three credential chips in a row.`,
  },
  {
    id: "timeline-story",
    name: "Story with milestone rail",
    spec: `A wide photograph across the top of the section with the headline overlapping its bottom-left on a solid plate. Beneath, a three or four step horizontal milestone rail (year or stage, short title, one line) joined by a hairline with accent dots. Story copy sits left of the rail in a narrow column.`,
  },
  {
    id: "collage-grid",
    name: "Work collage beside the story",
    spec: `An asymmetric collage of three real photographs (one tall, two short, 8px gutters, no rounded corners on the tall one) fills 55% of the width. The story occupies the rest: eyebrow, headline, two paragraphs, a badge row (licensed, insured, warranty) and two actions. A founder chip with a small round portrait and name sits at the base of the copy column.`,
  },
];

const FOOTERS: FooterArchetype[] = [
  {
    id: "cta-slab",
    name: "Conversion slab over deep footer",
    spec: `A primary-coloured conversion slab sits half-overlapping the footer's top edge: a two-line headline, one line of copy, a primary button and a call link. Under it, an ink footer in four columns (identity + short blurb + trust chips, services, areas, useful links) above a hairline bar with copyright, legal links and social glyphs.`,
  },
  {
    id: "map-anchored",
    name: "Map-anchored contact footer",
    spec: `Two-thirds ink footer content on the left in three columns; the right third is a bordered map or service-radius panel with the address, hours and phone stacked beneath it. A full-width bottom bar carries legal links.`,
  },
  {
    id: "big-type",
    name: "Oversized wordmark footer",
    spec: `The business name set enormous across the footer as a low-contrast display element, with the real footer columns arranged above it. Contact details are a single prominent block with the phone number set at heading size as a click-to-call link.`,
  },
  {
    id: "split-panel",
    name: "Split action panel footer",
    spec: `Two panels: a primary-coloured left panel with a "get a quote" headline, phone and button; an ink right panel with the link columns. Below both, a slim bar with the logo, copyright and social glyphs.`,
  },
];

const CHROMES: ChromeArchetype[] = [
  {
    id: "utility-bar",
    name: "Utility bar over solid nav",
    spec: `A slim utility bar (credential line left, service area and email right) above a solid nav: logo left at a strict max height of 52px, centred link row with dropdown affordances, phone link and one primary button on the right.`,
  },
  {
    id: "floating-glass",
    name: "Floating rounded nav",
    spec: `A floating rounded nav bar inset from the page edges by 20px, sitting over the hero with a translucent dark backdrop and a hairline border. Logo left (max height 48px), links centred, one primary pill button right.`,
  },
  {
    id: "stacked-brand",
    name: "Centred brand, split links",
    spec: `Logo centred at a strict max height of 60px with navigation links split evenly to its left and right, over a solid surface bar; the phone number and primary action sit in a slim bar above.`,
  },
];

const RHYTHMS = [
  "surface, surface, ink, surface, tint, surface, ink — colour arrives roughly every third section and never in an alternating stripe",
  "tint-led: a quiet tinted band opens and closes the page with white through the middle and exactly one full ink section for the proof block",
  "photo-led: two full-bleed photographic sections act as chapter breaks; everything between them is white with hairline separation",
];

const MOTIFS = [
  "a short accent rule that prefixes every eyebrow",
  "a numbered marker set in the display face at the corner of every focal block",
  "a single diagonal cut repeated at three different scales",
  "a hairline grid that shows through tinted bands only",
  "an oversized outlined glyph bled off the edge of focal sections",
];

const CONTRAST = [
  "one dominant brand colour at ~10% of surface area, everything else ink on white",
  "ink-dominant page with the brand colour reserved exclusively for actions and numbers",
  "warm neutral surfaces with the brand colour carrying headings' emphasis word and all actions",
];

function hash(input: string): number {
  let value = 2166136261;
  for (let index = 0; index < input.length; index++) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619) >>> 0;
  }
  return value;
}

function pick<T>(list: T[], seed: number, salt: number): T {
  return list[(seed + salt * 7919) % list.length];
}

/**
 * @param salt advances the whole composition to the next one. Zero for almost
 *   every lead; raised only by the collision check, so that a lead whose hash
 *   happens to land on a composition already in use moves off it instead of
 *   shipping a second copy of somebody else's page.
 */
export function layoutDnaFor(identity: string, salt = 0): LayoutDna {
  const seed = (hash(identity) + salt * 2654435761) >>> 0;
  const corners: LayoutDna["cornerStyle"][] = ["sharp", "soft", "pill", "mixed"];

  const recipe = pick(RECIPES, seed, 0);
  const hero = pick(HEROES, seed, 1);
  const about = pick(ABOUTS, seed, 2);
  const footer = pick(FOOTERS, seed, 3);
  const chrome = pick(CHROMES, seed, 4);
  const rhythm = pick(RHYTHMS, seed, 5);
  const motif = pick(MOTIFS, seed, 6);
  const cornerStyle = pick(corners, seed, 8);
  const contrastStrategy = pick(CONTRAST, seed, 9);

  return {
    seed,
    recipe,
    hero,
    about,
    footer,
    chrome,
    rhythm,
    motif,
    cornerStyle,
    contrastStrategy,
    fingerprint: [
      recipe.id,
      hero.id,
      about.id,
      footer.id,
      chrome.id,
      RHYTHMS.indexOf(rhythm),
      MOTIFS.indexOf(motif),
      CONTRAST.indexOf(contrastStrategy),
      cornerStyle,
    ].join("|"),
  };
}

/** The recipe alone, for the stronger same-trade-same-town rule. */
export function recipeIdFor(identity: string, salt = 0): string {
  return layoutDnaFor(identity, salt).recipe.id;
}
