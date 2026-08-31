import { derivePalette } from "@/lib/generate/v2/palette";
import type { PageSystem, SectionSpec } from "@/lib/generate/v2/design-system";
import type { LayoutDna } from "@/lib/generate/v2/layout-dna";
import type { PoolPhoto } from "@/lib/generate/v2/photo-pool";
import type { SiteBrief } from "@/lib/generate-bespoke-site";

// The page structure, decided in code.
//
// A Pro call used to spend two minutes inventing which sections a local
// service business homepage should have. The answer is not actually in doubt —
// every reference site in this market runs the same argument in the same
// order, because it is the order in which a buyer's questions arrive. What
// varies between two clients is the composition, the palette, the photography
// and the copy, and all four of those still vary here.
//
// Removing that call takes two minutes off every build and removes the
// failure mode where a manifest came back with twelve dark sections, no trust
// bar, and a photograph assigned to a section that had none.

interface Candidate extends Omit<SectionSpec, "imageUrl"> {
  /** Skipped when the supporting facts do not exist. */
  include: boolean;
  /** Sections that carry a photograph get one from the pool, best first. */
  wantsPhoto: boolean;
}

const TYPE_PAIRS = [
  { displayFamily: "Archivo Black", bodyFamily: "Inter" },
  { displayFamily: "Anton", bodyFamily: "Inter" },
  { displayFamily: "Bebas Neue", bodyFamily: "Source Sans 3" },
  { displayFamily: "Oswald", bodyFamily: "Inter" },
  { displayFamily: "Barlow Condensed", bodyFamily: "Barlow" },
  { displayFamily: "Poppins", bodyFamily: "Inter" },
  { displayFamily: "Manrope", bodyFamily: "Inter" },
] as const;

export function buildPageSystem(args: {
  brief: SiteBrief;
  dna: LayoutDna;
  photos: PoolPhoto[];
  brandHex: string | null;
}): PageSystem {
  const { brief, dna, photos, brandHex } = args;
  const palette = derivePalette(brandHex, dna.seed);
  const type = TYPE_PAIRS[dna.seed % TYPE_PAIRS.length];

  const city = brief.city;
  const trade = brief.industry.toLowerCase();
  const action = brief.intent.primaryLabel;
  const services = brief.services.slice(0, 8);
  const hasReviews = brief.reviews.length > 0;
  const hasAreas = brief.areas.length > 1;
  const pains = brief.painInstructions;

  const candidates: Candidate[] = [
    {
      id: "hero",
      kind: "hero",
      label: "Hero",
      background: "photo",
      archetype: dna.hero.spec,
      intent: `Make it unmistakable within one screen that this is a ${trade} serving ${city}, show the proof, and capture the enquiry without a second click.`,
      copyPoints: [
        `The outcome the customer wants, not the service name`,
        `${city} and the surrounding areas`,
        brief.rating && brief.reviewCount ? `${brief.rating} stars from ${brief.reviewCount} reviews` : "",
        brief.licensedInsured ? "Licensed, bonded and insured" : "",
      ].filter(Boolean),
      include: true,
      wantsPhoto: true,
    },
    {
      id: "trust",
      kind: "proof",
      label: "Trust bar",
      background: "tint",
      archetype: `A slim .bs-trustbar directly under the hero: the star rating and review count, two or three supported numbers as .bs-stat, and the credential badges as .bs-badge. One line tall on desktop. No headline, no paragraph.`,
      intent: "Answer 'are these people legitimate' before the visitor has to scroll for it.",
      copyPoints: [
        brief.rating && brief.reviewCount ? `${brief.rating} from ${brief.reviewCount} reviews` : "",
        brief.licensedInsured ? "Licensed, bonded and insured" : "",
        "Free, no-obligation quotes",
      ].filter(Boolean),
      include: true,
      wantsPhoto: false,
    },
    {
      id: "about",
      kind: "about",
      label: "About",
      background: "surface",
      archetype: dna.about.spec,
      intent: "Turn a company into people the visitor can picture doing the work, and attach the guarantee to a named person.",
      copyPoints: [brief.founder ? `The founder is ${brief.founder}` : "Locally owned and operated", "The real story from the source material", "Four supported numbers as a stat band"].filter(Boolean),
      include: true,
      wantsPhoto: true,
    },
    {
      id: "services",
      kind: "services",
      label: "Services",
      background: "tint",
      archetype: `A .bs-grid-3 of .bs-card--photo — every card leads with a photograph, then an h3, then one sentence of what the customer gets, then a text action. One card per service, in the order supplied.`,
      intent: "Let the visitor find their exact job in under five seconds and see what it looks like done.",
      copyPoints: services,
      include: services.length > 0,
      wantsPhoto: true,
    },
    {
      id: "why-us",
      kind: "proof",
      label: "Why choose us",
      background: "ink",
      archetype: `A .bs-split: a photograph one side, and on the other four differentiators as a .bs-stack, each an inline SVG glyph, a short bold line and one sentence. Ends with a primary action and a call link.`,
      intent: `Separate this business from the cheapest quote and from out-of-area operators.`,
      copyPoints: [
        pains.length ? `Directly answer: ${pains.slice(0, 3).join("; ")}` : "",
        brief.licensedInsured ? "Licensed, bonded and insured" : "",
        "Local, accountable, reachable",
      ].filter(Boolean),
      include: true,
      wantsPhoto: true,
    },
    {
      id: "process",
      kind: "process",
      label: "How it works",
      background: "surface",
      archetype: `Three or four steps as a .bs-grid-3 of .bs-card--flat, each opening with a .bs-marker number, a short title and two lines. A primary action underneath, centred.`,
      intent: "Remove the fear of an unknown, messy, open-ended process.",
      copyPoints: [`Step one is ${action.toLowerCase()}`, "What happens on site", "What the customer receives and when"],
      include: true,
      wantsPhoto: false,
    },
    {
      id: "gallery",
      kind: "proof",
      label: "Recent work",
      background: "tint",
      archetype: `A .bs-gallery of four to eight square photographs with a short heading above it and one line of context. Nothing else — the photographs are the argument.`,
      intent: "Show the standard of finish rather than claim it.",
      copyPoints: ["Real completed work", `Projects around ${city}`],
      include: photos.length >= 8,
      wantsPhoto: true,
    },
    {
      id: "emergency",
      kind: "cta",
      label: "Mid-page conversion band",
      background: "brand",
      archetype: `A solid brand-colour band: a two-line headline, one sentence, then a .bs-btn--light and a .bs-link-call side by side. Centred, generous, nothing else in it.`,
      intent: "Catch the visitor who is already convinced, halfway down the page.",
      copyPoints: [brief.phone ? `Call ${brief.phone}` : "", action].filter(Boolean),
      include: true,
      wantsPhoto: false,
    },
    {
      id: "reviews",
      kind: "reviews",
      label: "Reviews",
      background: "surface",
      archetype: `A .bs-grid-3 of .bs-review cards, each with the star row, the review text and a .bs-review__author with a .bs-review__avatar showing the reviewer's initial. Above them, a heading and the aggregate rating.`,
      intent: "Let other customers do the persuading in their own words.",
      copyPoints: brief.reviews.slice(0, 6).map((review) => `${review.author}: ${review.text.slice(0, 260)}`),
      include: hasReviews,
      wantsPhoto: false,
    },
    {
      id: "areas",
      kind: "areas",
      label: "Service areas",
      background: "tint",
      archetype: `A .bs-split: a short heading and paragraph one side, and on the other the areas as a wrapped set of .bs-chip with a map-pin glyph each. No photographs of towns.`,
      intent: "Confirm this business actually covers the visitor's town.",
      copyPoints: brief.areas.slice(0, 12),
      include: hasAreas,
      wantsPhoto: false,
    },
    {
      id: "guarantee",
      kind: "proof",
      label: "Guarantee",
      background: "photo",
      archetype: `A full-bleed photographic band: its first child is the .bs-media holding the image, then a .bs-container--narrow with a centred heading, one paragraph and one action.`,
      intent: "Remove the last risk in the visitor's mind before the FAQ.",
      copyPoints: [brief.licensedInsured ? "Licensed, bonded and insured" : "", "What is promised, in plain terms"].filter(Boolean),
      include: true,
      wantsPhoto: true,
    },
    {
      id: "faq",
      kind: "faq",
      label: "FAQ",
      background: "surface",
      archetype: `Six questions in a .bs-container--narrow using data-accordion / data-accordion-item / data-accordion-trigger, the first open. Real questions this trade is asked about price, timing, mess, insurance and warranty.`,
      intent: "Answer the objections that otherwise become an unanswered email.",
      copyPoints: ["Cost and how quotes work", "How long the work takes", "Insurance and licensing", "Warranty"],
      include: true,
      wantsPhoto: false,
    },
    {
      id: "contact",
      kind: "contact",
      label: "Contact",
      background: "ink",
      archetype: `A .bs-split: left is a heading, a reassuring paragraph, the phone as a large .bs-link-call, the email and the service area; right is the second lead-capture form as a .bs-form with its coloured header bar.`,
      intent: "Close. Every visitor who reaches the bottom must have somewhere to go.",
      copyPoints: [brief.phone ?? "", brief.email ?? "", action].filter(Boolean),
      include: true,
      wantsPhoto: false,
    },
  ];

  // The recipe decides the middle: which of the optional blocks this lead
  // carries, and in what order. The spine does not move — hero and trust open
  // every page and contact closes it, because that is the order a buyer's
  // questions arrive in and it is the part that converts.
  //
  // `include` still has the last word. A recipe asking for reviews on a lead
  // with no reviews gets no reviews section; it decides arrangement, never
  // whether there is anything real to put in one.
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const spineOpen = ["hero", "trust"];
  const spineClose = ["contact"];

  const arranged = [
    ...spineOpen,
    ...dna.recipe.middle,
    ...spineClose,
  ]
    .map((id) => byId.get(id))
    .filter((candidate): candidate is Candidate => Boolean(candidate) && candidate!.include);

  // A recipe may name a section twice (the review sandwich does, on purpose).
  // Dedupe by identity so the same block is never built twice.
  const seen = new Set<Candidate>();
  const included = arranged.filter((candidate) => {
    if (seen.has(candidate)) return false;
    seen.add(candidate);
    return true;
  });

  // Photographs go to the sections that asked for them, best first — the
  // client's own photos lead the pool, so the hero and about get real work.
  const available = [...photos];
  const sections: SectionSpec[] = included.map((candidate) => {
    const { include: _include, wantsPhoto, ...spec } = candidate;
    const photo = wantsPhoto ? available.shift() : undefined;
    return { ...spec, imageUrl: photo?.url ?? null };
  });

  // The services section needs one image per service, and the gallery needs
  // several, so what is left over is handed to them explicitly rather than
  // being lost.
  const extras = available.slice(0, 10).map((photo) => photo.url);
  const servicesSection = sections.find((section) => section.id === "services");
  if (servicesSection) {
    servicesSection.copyPoints = [
      ...servicesSection.copyPoints,
      `PHOTOGRAPHS for the cards, in order, one per card: ${extras.slice(0, services.length).join(" | ") || "none — use icon-led cards without image frames"}`,
    ];
  }
  const gallerySection = sections.find((section) => section.id === "gallery");
  if (gallerySection) {
    gallerySection.copyPoints = [
      ...gallerySection.copyPoints,
      `PHOTOGRAPHS for the gallery: ${extras.slice(services.length).join(" | ") || extras.join(" | ")}`,
    ];
  }

  return {
    systemName: `${brief.businessName} — ${dna.hero.name}`,
    rationale: `${palette.scheme} harmony derived from the client's own brand colour, ${type.displayFamily} over ${type.bodyFamily}, ${dna.rhythm}. Composed on the "${dna.recipe.name}" recipe: ${sections.length} sections for a ${trade} in ${city}.`,
    palette: {
      primary: palette.primary,
      accent: palette.accent,
      ink: palette.ink,
      surface: palette.surface,
      surfaceAlt: palette.surfaceAlt,
    },
    typography: {
      displayFamily: type.displayFamily,
      bodyFamily: type.bodyFamily,
      displayWeight: "900",
      headingCase: dna.seed % 3 === 0 ? "upper" : "title",
    },
    sections,
  };
}
