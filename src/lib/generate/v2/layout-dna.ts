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

/**
 * Treatment axes — the part the reference sites actually vary.
 *
 * The archetypes below move furniture: where the form sits, how the hero is
 * arranged. Every high-performing site in this market keeps that arrangement
 * identical — photo, copy left, form right, city in the headline — and earns
 * its identity from treatment instead: the palette, the shape of the nav, the
 * skin of the form, what the hero is a photograph OF.
 *
 * Which means the old spread was pointed at the wrong axis. Six hero
 * arrangements varied the one thing that should not vary, while the form, the
 * eyebrow and the proof badge were single hard-coded constants on every site
 * this system has ever built.
 */
export type HeaderBar = "plain" | "split" | "offer" | "striped" | "none";
export type NavEdge = "straight" | "wave" | "angled" | "plinth";
export type HeroSubject = "worksite" | "fleet" | "founder" | "before-after" | "certification" | "storm";
export type FormSkin = "solid-brand" | "white-header" | "offer-banner" | "dark-glass";
export type EyebrowMode = "category" | "slogan" | "welcome" | "region" | "none";
export type HeadlineCase = "title" | "caps";
export type ProofMode = "combined" | "two-pills" | "pills-stats";
export type DecorMotif = "none" | "slab" | "stripes" | "corner";
export type AboutSurface = "ink" | "white" | "tint";
export type FounderBadge = "overlap" | "below" | "none";
/**
 * The badge's material, independent of where it sits.
 *
 * `founderBadge` above decides placement; this decides finish. Two axes
 * because they are genuinely independent — an overlapped badge can be glass
 * or embossed, and so can one set below the picture — and because the badge
 * is the one element every page in this system shares in the same shape. Two
 * builds side by side were reading as the same template with a new colour,
 * which is the exact failure layout DNA exists to prevent.
 *
 * The structure never changes: a logo tile, then a name tile. Only the
 * material does.
 */
export type BadgeFinish = "plate" | "glass" | "emboss" | "outline" | "ribbon";
// Tones exclude rather than rank — a shorter list is how every other axis
// here says "not for this character". Frosted glass on a heritage roofer and
// a stitched ribbon on an industrial contractor are the two that read wrong.
export type StatBand = "fused" | "standalone" | "none";

export interface Treatment {
  headerBar: HeaderBar;
  navEdge: NavEdge;
  heroSubject: HeroSubject;
  formSkin: FormSkin;
  eyebrowMode: EyebrowMode;
  headlineCase: HeadlineCase;
  proofMode: ProofMode;
  decorMotif: DecorMotif;
  aboutSurface: AboutSurface;
  founderBadge: FounderBadge;
  badgeFinish: BadgeFinish;
  statBand: StatBand;
}

/**
 * Tones — coherent bundles rather than eleven independent rolls.
 *
 * Rolling every axis freely hands a burgundy heritage roofer neon stripes and
 * a mascot: each choice defensible alone, the set indefensible. A tone is
 * drawn first and weights what follows.
 *
 * It weights rather than forbids. A tone lists its values in preference order
 * and the seed takes one, so a lead reaches its tone's natural treatment most
 * of the time and something unexpected occasionally — but every value stays
 * reachable, because a combination nobody can reach is a page some lead should
 * have had and never got.
 */
export interface Tone {
  id: string;
  name: string;
  headerBar: HeaderBar[];
  navEdge: NavEdge[];
  heroSubject: HeroSubject[];
  formSkin: FormSkin[];
  eyebrowMode: EyebrowMode[];
  headlineCase: HeadlineCase[];
  proofMode: ProofMode[];
  decorMotif: DecorMotif[];
  aboutSurface: AboutSurface[];
  founderBadge: FounderBadge[];
  badgeFinish: BadgeFinish[];
  statBand: StatBand[];
}

export const TONES: Tone[] = [
  {
    id: "civic", name: "Civic",
    headerBar: ["split", "striped", "plain", "offer"],
    navEdge: ["straight", "angled", "plinth", "wave"],
    heroSubject: ["fleet", "worksite", "before-after", "certification"],
    formSkin: ["white-header", "solid-brand", "offer-banner", "dark-glass"],
    eyebrowMode: ["category", "none", "slogan"],
    headlineCase: ["caps", "title"],
    proofMode: ["pills-stats", "two-pills", "combined"],
    decorMotif: ["slab", "stripes", "corner", "none"],
    aboutSurface: ["ink", "white", "tint"],
    founderBadge: ["overlap", "below", "none"],
    badgeFinish: ["plate", "emboss", "outline", "ribbon", "glass"],
    statBand: ["standalone", "fused", "none"],
  },
  {
    id: "heritage", name: "Heritage",
    headerBar: ["plain", "none", "offer", "split"],
    navEdge: ["straight", "plinth", "wave", "angled"],
    heroSubject: ["founder", "worksite", "certification", "before-after"],
    formSkin: ["white-header", "offer-banner", "solid-brand", "dark-glass"],
    eyebrowMode: ["welcome", "region", "category"],
    headlineCase: ["title", "caps"],
    proofMode: ["combined", "two-pills", "pills-stats"],
    decorMotif: ["none", "corner", "slab"],
    aboutSurface: ["ink", "tint", "white"],
    founderBadge: ["overlap", "none", "below"],
    badgeFinish: ["emboss", "ribbon", "plate", "outline"],
    statBand: ["fused", "none", "standalone"],
  },
  {
    id: "industrial", name: "Industrial",
    headerBar: ["plain", "split", "striped", "none"],
    navEdge: ["straight", "angled", "plinth", "wave"],
    heroSubject: ["worksite", "fleet", "storm", "certification"],
    formSkin: ["dark-glass", "solid-brand", "white-header"],
    eyebrowMode: ["slogan", "category", "none"],
    headlineCase: ["caps", "title"],
    proofMode: ["two-pills", "combined", "pills-stats"],
    decorMotif: ["corner", "slab", "stripes", "none"],
    aboutSurface: ["ink", "tint"],
    founderBadge: ["below", "none", "overlap"],
    badgeFinish: ["emboss", "plate", "outline", "glass"],
    statBand: ["fused", "standalone", "none"],
  },
  {
    id: "corporate", name: "Clean corporate",
    headerBar: ["offer", "plain", "split", "none"],
    navEdge: ["wave", "plinth", "straight", "angled"],
    heroSubject: ["worksite", "certification", "founder", "before-after"],
    formSkin: ["solid-brand", "white-header", "offer-banner"],
    eyebrowMode: ["category", "welcome", "region"],
    headlineCase: ["title", "caps"],
    proofMode: ["combined", "pills-stats", "two-pills"],
    decorMotif: ["none", "corner", "slab"],
    aboutSurface: ["white", "tint", "ink"],
    founderBadge: ["below", "overlap", "none"],
    badgeFinish: ["glass", "outline", "plate", "emboss"],
    statBand: ["standalone", "fused", "none"],
  },
  {
    id: "local", name: "Local and friendly",
    headerBar: ["offer", "striped", "plain", "split"],
    navEdge: ["wave", "plinth", "straight", "angled"],
    heroSubject: ["founder", "fleet", "worksite", "before-after"],
    formSkin: ["solid-brand", "offer-banner", "white-header", "dark-glass"],
    eyebrowMode: ["region", "slogan", "welcome"],
    headlineCase: ["caps", "title"],
    proofMode: ["two-pills", "combined", "pills-stats"],
    decorMotif: ["stripes", "none", "corner", "slab"],
    aboutSurface: ["tint", "white", "ink"],
    founderBadge: ["overlap", "below", "none"],
    badgeFinish: ["ribbon", "plate", "glass", "emboss"],
    statBand: ["standalone", "fused", "none"],
  },
];

/**
 * What a pairing means when two choices would otherwise clash.
 *
 * Deleting the combination is the lazy fix and it costs some lead the best
 * page it could have had. Each rule here takes a pairing that would have
 * fought and changes how the second element is treated so both survive.
 */
export interface Resolutions {
  /** Dark band against a dark about reads as one slab with a seam. */
  statBandAccent: boolean;
  /** Numbers in the hero and the about, in one frame, read as padding. */
  heroStatsQualitative: boolean;
  /** The same discount twice above the fold reads desperate. */
  formOfferMuted: boolean;
  /** Two stripe treatments at one scale fight; at two scales they read as a system. */
  decorStripesFine: boolean;
  /** Glass loses its edges over a bright photograph. */
  formNeedsScrim: boolean;
  /** Caps eats a third more width than title case. */
  headlineTight: boolean;
}

export function resolveTreatment(t: Treatment): Resolutions {
  return {
    statBandAccent: t.aboutSurface === "ink" && t.statBand === "standalone",
    heroStatsQualitative: t.proofMode === "pills-stats" && t.statBand !== "none",
    formOfferMuted: t.headerBar === "offer" && t.formSkin === "offer-banner",
    decorStripesFine: t.headerBar === "striped" && t.decorMotif === "stripes",
    formNeedsScrim: t.formSkin === "dark-glass",
    headlineTight: t.headlineCase === "caps",
  };
}

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
  tone: Tone;
  treatment: Treatment;
  resolutions: Resolutions;
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
  /**
   * The fold alone.
   *
   * Two leads can differ only below the fold and still be identical in the
   * launch post, which shows the hero and the about and nothing else. Cold
   * outreach is judged on that image, so the fold gets its own uniqueness
   * check rather than riding on a recipe difference nobody in the inbox sees.
   */
  heroFingerprint: string;
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
 * pick(), decorrelated.
 *
 * pick() offsets the seed by a CONSTANT (salt * 7919), so two axes whose
 * lists are the same length move in lockstep: `(seed + a) % n` and
 * `(seed + b) % n` differ by a fixed rotation for every lead alive. With
 * five tones and five badge finishes that made the pairing a bijection —
 * measured across 400 synthetic leads, three finishes ever appeared and 5
 * of the 25 tone/finish combinations were reachable. Every Civic page in
 * the world would have carried the same badge material.
 *
 * Mixing the salt into the seed instead gives 5/5 finishes and 25/25 pairs
 * on the same sample, and stays deterministic.
 *
 * Only badgeFinish uses this. The same flaw couples the existing
 * three-value axes to each other — aboutSurface, founderBadge, proofMode
 * and statBand are all length 3 — and moving them onto this picker would
 * re-roll the layout of every lead on its next build, which is a decision
 * to take deliberately rather than as a side effect of adding a badge.
 */
function pickIndependent<T>(list: T[], seed: number, salt: number): T {
  let value = (seed ^ Math.imul(salt + 1, 2654435761)) >>> 0;
  value = Math.imul(value ^ (value >>> 15), 2246822507) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 3266489909) >>> 0;
  return list[((value ^ (value >>> 16)) >>> 0) % list.length];
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

  const tone = pick(TONES, seed, 20);

  // Drawn from the tone's own preference order, so a lead lands on its
  // natural treatment most of the time without any value being unreachable.
  const treatment: Treatment = {
    headerBar: pick(tone.headerBar, seed, 21),
    navEdge: pick(tone.navEdge, seed, 22),
    heroSubject: pick(tone.heroSubject, seed, 23),
    formSkin: pick(tone.formSkin, seed, 24),
    eyebrowMode: pick(tone.eyebrowMode, seed, 25),
    headlineCase: pick(tone.headlineCase, seed, 26),
    proofMode: pick(tone.proofMode, seed, 27),
    decorMotif: pick(tone.decorMotif, seed, 28),
    aboutSurface: pick(tone.aboutSurface, seed, 29),
    founderBadge: pick(tone.founderBadge, seed, 30),
    badgeFinish: pickIndependent(tone.badgeFinish, seed, 31),
    statBand: pick(tone.statBand, seed, 31),
  };

  const recipe = pick(RECIPES, seed, 0);
  const hero = pick(HEROES, seed, 1);
  // Salted off the hero rather than independently. These were picked with
  // separate salts, so a bold slab hero could draw a soft editorial about —
  // invisible while nobody views the two together, and glaring in a showcase
  // post where they sit inches apart in one frame.
  const about = pick(ABOUTS, seed + HEROES.indexOf(hero) * 31, 2);
  const footer = pick(FOOTERS, seed, 3);
  const chrome = pick(CHROMES, seed, 4);
  const rhythm = pick(RHYTHMS, seed, 5);
  const motif = pick(MOTIFS, seed, 6);
  const cornerStyle = pick(corners, seed, 8);
  const contrastStrategy = pick(CONTRAST, seed, 9);

  return {
    seed,
    tone,
    treatment,
    resolutions: resolveTreatment(treatment),
    recipe,
    hero,
    about,
    footer,
    chrome,
    rhythm,
    motif,
    cornerStyle,
    contrastStrategy,
    heroFingerprint: [
      tone.id,
      treatment.headerBar,
      treatment.navEdge,
      treatment.heroSubject,
      treatment.formSkin,
      treatment.eyebrowMode,
      treatment.headlineCase,
      treatment.proofMode,
      treatment.decorMotif,
      hero.id,
    ].join("|"),
    fingerprint: [
      tone.id,
      treatment.headerBar,
      treatment.navEdge,
      treatment.heroSubject,
      treatment.formSkin,
      treatment.eyebrowMode,
      treatment.headlineCase,
      treatment.proofMode,
      treatment.decorMotif,
      treatment.aboutSurface,
      treatment.founderBadge,
      treatment.badgeFinish,
      treatment.statBand,
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
