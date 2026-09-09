import type { VerticalProfile } from "@/lib/verticals/types";

/**
 * Macro-ICP 7 — restaurants, cafés, takeaways, bakeries, pubs, small hotels.
 *
 * The vertical where the photography does most of the selling and the copy
 * does least. Three structural differences from a trade:
 *
 *   - There is one location, not a catchment. Areas is off. A restaurant with
 *     an invented list of eight nearby towns looks like a chain that isn't.
 *   - The conversion is a booking or a visit, not a quote. Address, opening
 *     hours and "can I just turn up" outrank everything else on the page.
 *   - The offerings are dishes. They are read, not researched — so the menu
 *     sits high and the process section explains booking rather than a job.
 */
export const hospitalityFood: VerticalProfile = {
  slug: "hospitality-food",
  label: "Restaurant & Hospitality",
  origin: "curated",
  basedOn: "home-services",
  match: [
    "restaurant|bistro|brasserie|trattoria|osteria|steakhouse|grill house",
    "café|cafe |coffee ?(shop|house|roaster)|tea ?room|patisserie|bakery|deli",
    "takeaway|take ?out|pizzeria|curry house|fish and chip|kebab|noodle bar",
    "pub |gastropub|bar |cocktail bar|wine bar|brewery|taproom|nightclub",
    "hotel|guest ?house|bed and breakfast|inn |lodge |boutique hotel",
    "caterer|catering|food truck|street food|supper club",
  ],

  nouns: {
    offering: "dish",
    offeringPlural: "Menu",
    offeringPath: "menu",
    areaPlural: "Find Us",
    areaPath: "areas",
    customer: "guest",
    work: "booking",
  },

  sections: [
    { id: "hero", enabled: true },
    { id: "trust", enabled: true, label: "Trust bar" },
    { id: "services", enabled: true, label: "The menu" },
    { id: "gallery", enabled: true, label: "The room & the food" },
    { id: "about", enabled: true, label: "Our story" },
    { id: "reviews", enabled: true },
    { id: "cta-band", enabled: true, label: "Conversion band" },
    { id: "why-us", enabled: true, label: "What makes it worth the trip" },
    { id: "process", enabled: true, label: "Booking & visiting" },
    { id: "faq", enabled: true, label: "FAQ" },
    { id: "contact", enabled: true, label: "Find us" },
    // One address, not a catchment.
    { id: "areas", enabled: false },
    // Nobody guarantees a meal. The booking block does this job better.
    { id: "guarantee", enabled: false },
  ],

  lists: {
    offeringCount: 8,
    // 0 removes the areas section, its nav item and its inner pages entirely.
    areaCount: 0,
    // A restaurant's menu is the one thing that must be exactly true. An
    // invented dish is a guest ordering something that does not exist.
    padOfferings: false,
    padAreas: false,
  },

  cta: {
    intent: "book-appointment",
    primaryLabel: "Book a table",
    secondaryIntent: "call-now",
    secondaryLabel: "Call us",
    guidance:
      "The visitor is deciding where to eat, usually within the hour, usually on a phone. Photography is the argument — put the best food and room images above the fold and let them run large. Address, opening hours and whether walk-ins are welcome must be answerable in one glance without scrolling. Booking is the primary action, phone the immediate alternative. Do not write about passion, journeys or craftsmanship: say what the food is, where it comes from, and what a table costs.",
  },

  copy: {
    persona:
      "You are a copywriter for an independent restaurant. You write about food the way a good menu does — concrete, appetising, specific about ingredients and origin, and never florid.",
    voiceRules: [
      "Name actual dishes and actual ingredients. 'Locally sourced produce' says nothing; 'Cornish crab, brown butter' sells a table.",
      "Say plainly whether walk-ins are welcome and what the busy times are.",
      "The room matters as much as the food. Describe what it is like to sit in.",
    ],
    forbiddenSlop: [
      "a culinary journey, a passion for food, or a labour of love",
      "elevated, curated, artisanal or hand-crafted",
      "dishes, prices or dietary claims not present in the supplied facts",
      "awards or accolades that were not supplied",
    ],
    faqSeeds: [
      "Do I need to book, or can I just turn up?",
      "What are your opening hours?",
      "Where exactly are you and where can I park?",
      "Do you cater for vegetarians, vegans and allergies?",
      "Is the menu suitable for children?",
      "Do you take large groups or private hire?",
      "Roughly what does a meal cost per head?",
      "Is the restaurant accessible?",
      "Do you do takeaway or delivery?",
      "Can I bring my own wine?",
    ],
    trustSignals: [
      "Google rating and review count, when real",
      "Years open, when the facts state it",
      "Named suppliers or producers, when the facts state them",
    ],
  },

  media: {
    heroQuery: "{industry} interior warm evening atmosphere",
    proofQuery: "plated food close up restaurant fine dining",
    teamQuery: "chef and staff in restaurant kitchen candid",
    offeringQuery: "{item} plated dish",
    heroSubject:
      "The interior of a warm, busy independent {industry} in {city} in early evening, low golden light, tables laid, atmosphere over detail",
    aboutSubject:
      "A chef and a small front-of-house team standing together in their own {industry}, unposed, working clothes, natural light",
    proofSubject:
      "A single beautifully plated dish photographed close and slightly overhead on a real table, natural window light, shallow depth of field",
    offeringSubject:
      "{item}, plated and photographed close on a real table with natural light, appetising and unstyled",
    forbiddenImagery: [
      "stock photography of generic burgers or pizza",
      "empty restaurants under flat fluorescent light",
      "people laughing exaggeratedly at a dinner table",
      "food styled with obvious props or glycerine sheen",
    ],
  },

  artDirection: {
    sourceName: "House direction · Hospitality",
    mood: "warm-craft",
    palette: {
      primary: "#9A3412",
      accent: "#F59E0B",
      surface: "#FFFBF5",
      surfaceAlt: "#F5EDE3",
      ink: "#1C1917",
      inkMuted: "#57534E",
      onPrimary: "#FFFFFF",
    },
    typography: {
      displayFamily: "Playfair Display",
      bodyFamily: "Inter",
      displayWeight: "700",
      scale: "dramatic",
      headingCase: "sentence",
    },
    geometry: { radius: "soft", elevation: "dramatic", borderTreatment: "none" },
    layout: {
      heroTreatment: "full-bleed-image",
      sectionRhythm: "cinematic",
      imageDensity: "gallery-led",
      serviceLayout: "editorial-list",
      proofStyle: "quote-cards",
    },
    motifs: [
      "a full-bleed hero photograph with the booking action laid over it",
      "the menu set as an editorial list with prices, not as cards",
      "opening hours and address pinned near the fold",
    ],
    rationale:
      "Someone choosing where to eat tonight decides on the photograph. Full-bleed imagery, cinematic spacing, a warm serif over an appetising terracotta, and the two practical facts — where and when — never more than a glance away.",
  },

  schema: { localBusinessType: "Restaurant", offeringSchemaType: "MenuItem" },
  glyphs: { offering: "award", why: ["award", "clock", "shield", "wrench"] },
  fallback: {},
};
