import type { VerticalProfile } from "@/lib/verticals/types";

/**
 * Macro-ICP 1 — local trade and home services.
 *
 * This profile is a faithful transcription of what the generator did before
 * profiles existed. Every value here is the constant it replaces:
 *
 *   sections        the literal array in templates/index.ts, same order
 *   lists           MAX_SERVICE_PAGES / MAX_AREAS, both padded
 *   copy.faqSeeds   the ten topics named in the page-copy prompt
 *   media.*         the queries in photo-pool.ts and the subjects in plan-media.ts
 *   cta             the "considered trades" rule in conversion-intent.ts
 *   artDirection    the Plumbing & HVAC house preset
 *
 * The last two are fallbacks in practice, not overrides. conversionIntentFor
 * and presetFor still test their own trade regexes first, so a roofer keeps
 * getting the roofing direction and an emergency plumber keeps getting "Call
 * now". The profile answers only the case those regexes miss — which for this
 * vertical is rare, and for every other vertical was the generic default that
 * made non-trade pages look like a template.
 */
export const homeServices: VerticalProfile = {
  slug: "home-services",
  label: "Home & Trade Services",
  origin: "curated",
  basedOn: "home-services",
  match: [
    "plumb|electric|hvac|heating|cooling|air condition|boiler|drain|furnace",
    "roof|siding|gutter|window|fenc|deck|paving|driveway|concrete|render",
    "landscap|lawn|garden|tree surgeon|arborist|pool|patio",
    "remodel|renovat|kitchen fitter|bathroom fitter|builder|contractor|carpent|joiner",
    "restoration|water damage|fire damage|mould|asbestos",
    "pest control|exterminator|locksmith|handyman|glazier|lock fitting",
    "mover|moving compan|removal|junk removal|waste clearance",
    "painter|decorator|plaster|tiler|flooring|insulation|solar|ev charger",
  ],

  nouns: {
    offering: "service",
    offeringPlural: "Services",
    offeringPath: "services",
    areaPlural: "Service Areas",
    areaPath: "areas",
    customer: "customer",
    work: "job",
  },

  // The literal section array from templates/index.ts, in the same order.
  sections: [
    { id: "hero", enabled: true },
    { id: "trust", enabled: true, label: "Trust bar" },
    { id: "about", enabled: true },
    { id: "services", enabled: true },
    { id: "why-us", enabled: true, label: "Why choose us" },
    { id: "process", enabled: true, label: "How it works" },
    { id: "gallery", enabled: true, label: "Recent work" },
    { id: "cta-band", enabled: true, label: "Conversion band" },
    { id: "reviews", enabled: true },
    { id: "areas", enabled: true, label: "Service areas" },
    { id: "guarantee", enabled: true, label: "Guarantee & booking" },
    { id: "faq", enabled: true, label: "FAQ" },
    { id: "contact", enabled: true },
  ],

  lists: {
    offeringCount: 8,
    areaCount: 8,
    // The only profile that pads. A trade genuinely does adjacent work it has
    // not listed, and its customers genuinely do come from the next town over.
    // Everywhere else padding writes a factual claim onto a client's live site,
    // so it defaults off — see the note on padAreas in resolve.ts.
    padOfferings: true,
    padAreas: true,
  },

  cta: {
    intent: "quote-form",
    primaryLabel: "Get a free quote",
    secondaryIntent: "call-now",
    secondaryLabel: "Call now",
    guidance:
      "This is a considered purchase the customer is choosing at leisure, not an emergency. Lead with the quote form and keep the phone number visible in the header and footer as the impatient alternative. Show the work: real photographs of finished jobs sell this trade better than any adjective. Make the service area explicit and early — a visitor's first question is whether this business covers where they live.",
  },

  copy: {
    persona:
      "You are a direct-response copywriter for local trade businesses. You write the way a good tradesperson talks: plainly, about the job, without adjectives they would never use out loud.",
    // What each slot MEANS here. Without this the model reads the slot
    // names literally and writes trade copy into every vertical.
    sectionBriefs: {
      "gallery":
        "Photographs of finished jobs at real properties. Before-and-after where it exists.",
      "guarantee":
        "Workmanship: what happens if something fails after they have paid, and the warranty on it.",
      "process":
        "From the first call to the job being finished and the site left tidy.",
      "trust":
        "Licensing, insurance, years trading, the Google rating.",
      "about":
        "Who runs this firm, how long they have been at it, why they started.",
    },
    voiceRules: [
      "Name the trade in the hero headline. A visitor who landed from a search must recognise the page in one glance.",
      "Talk about the customer's property and the outcome, not about craftsmanship in the abstract.",
    ],
    forbiddenSlop: [
      "invented service-area towns not present in the facts",
      "claims of being licensed, insured or accredited unless the facts state it",
      "years in business that were not supplied",
    ],
    faqSeeds: [
      "How much does it cost?",
      "How long will the work take?",
      "What does the process look like from first call to finished job?",
      "How much mess and disruption should I expect?",
      "Are you insured and licensed?",
      "What warranty or guarantee comes with the work?",
      "What materials do you use?",
      "How and when do I pay?",
      "What happens if something goes wrong afterwards?",
      "How do I get started?",
    ],
    trustSignals: [
      "Google rating and review count, when real",
      "Years established, when the facts state it",
      "Named service areas the business genuinely covers",
    ],
  },

  media: {
    heroQuery: "{industry} crew at work",
    proofQuery: "{industry} finished project home exterior",
    teamQuery: "professional {industry} team portrait",
    offeringQuery: "{item} {industry}",
    heroSubject:
      "A {industry} professional at work on a real job site in {city}, seen mid-task with real tools and equipment, wide establishing shot",
    aboutSubject:
      "A small {industry} team beside their work van outside a local business premises, natural and unposed",
    proofSubject:
      "A finished, high-quality {industry} installation, clean and professionally completed, detail shot",
    offeringSubject:
      "{item} being carried out by a {industry} professional, close documentary shot showing the actual work and equipment involved",
    forbiddenImagery: [
      "stock businesspeople shaking hands",
      "generic office interiors",
      "models in clean clothes pretending to work",
    ],
  },

  // The Plumbing & HVAC house preset. Reached only when presetFor's own trade
  // regexes miss, which for this vertical is the unusual case.
  artDirection: {
    sourceName: "House direction · Home services",
    mood: "clinical-trust",
    palette: {
      primary: "#0E5A8A",
      accent: "#38BDF8",
      surface: "#FFFFFF",
      surfaceAlt: "#F1F5F9",
      ink: "#111827",
      inkMuted: "#4B5563",
      onPrimary: "#FFFFFF",
    },
    typography: {
      displayFamily: "Manrope",
      bodyFamily: "Inter",
      displayWeight: "700",
      scale: "balanced",
      headingCase: "sentence",
    },
    geometry: { radius: "rounded", elevation: "soft", borderTreatment: "hairline" },
    layout: {
      heroTreatment: "split-editorial",
      sectionRhythm: "generous",
      imageDensity: "balanced",
      serviceLayout: "feature-grid",
      proofStyle: "quote-cards",
    },
    motifs: [
      "numbered what-happens-next process row",
      "service-area pin list beside a map",
      "review cards carrying the real Google rating",
    ],
    rationale:
      "Trade buyers are deciding whether to let a stranger into their home. Calm, high-legibility, evidence-forward: rating, area covered, and what happens next, in that order.",
  },

  schema: {
    localBusinessType: "HomeAndConstructionBusiness",
    offeringSchemaType: "Service",
  },

  glyphs: {
    offering: "wrench",
    why: ["shield", "award", "clock", "wrench"],
  },

  fallback: {},
};
