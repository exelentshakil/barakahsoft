import type { VerticalProfile } from "@/lib/verticals/types";

/**
 * Macro-ICP — hair, beauty, nails, spa, barbers, gyms, yoga, studios.
 *
 * Appearance-led and appointment-driven. The gallery is not decoration here,
 * it is the product: nobody books a colourist they have not seen the work of.
 * Prices and stylist names are what the visitor actually came for, and both
 * are usually buried on the sites this replaces.
 */
export const salonWellness: VerticalProfile = {
  slug: "salon-wellness",
  label: "Salon, Spa & Fitness",
  origin: "curated",
  basedOn: "home-services",
  match: [
    "hair ?(salon|dresser|stylist|studio)|colourist|colorist|barber",
    "nail ?(salon|bar|tech)|lash|brow|waxing|threading|tanning",
    "beauty (salon|clinic|studio)|esthetic|aesthetic|facial|skin ?(clinic|care studio)",
    "spa |day spa|massage|reflexolog|holistic therap",
    "gym |fitness (studio|centre|center|club)|personal train|crossfit|bootcamp",
    "yoga|pilates|barre|martial arts|boxing gym|dance (studio|school)",
  ],

  nouns: {
    offering: "service",
    offeringPlural: "Services",
    offeringPath: "services",
    areaPlural: "Where We Are",
    areaPath: "areas",
    customer: "client",
    work: "appointment",
  },

  sections: [
    { id: "hero", enabled: true },
    { id: "trust", enabled: true, label: "Trust bar" },
    { id: "gallery", enabled: true, label: "Our work" },
    { id: "services", enabled: true, label: "Services & prices" },
    { id: "about", enabled: true, label: "The team" },
    { id: "reviews", enabled: true },
    { id: "cta-band", enabled: true, label: "Conversion band" },
    { id: "why-us", enabled: true, label: "Why clients stay" },
    { id: "process", enabled: true, label: "Your first visit" },
    { id: "faq", enabled: true, label: "FAQ" },
    { id: "guarantee", enabled: true, label: "Booking" },
    { id: "contact", enabled: true },
    // A salon has a chair, not a catchment.
    { id: "areas", enabled: false },
  ],

  lists: { offeringCount: 8, areaCount: 0, padOfferings: true, padAreas: false },

  cta: {
    intent: "book-appointment",
    primaryLabel: "Book now",
    secondaryIntent: "call-now",
    secondaryLabel: "Call the salon",
    guidance:
      "The visitor is judging on the work before they read a word, so the gallery has to be near the top and the images have to be the client's own. Prices belong on the page: a salon that hides them loses the booking to one that does not. Name the individual stylists or trainers — people book a person, not a premises. Booking is the primary action and it should take one tap on a phone.",
  },

  copy: {
    persona:
      "You are a copywriter for an independent salon or studio. You write warmly and specifically about how someone will look and feel, without beauty-industry cliché.",
    // What each slot MEANS here. Without this the model reads the slot
    // names literally and writes trade copy into every vertical.
    sectionBriefs: {
      "gallery":
        "The work itself on real clients, and the room they will sit in. Never stock beauty photography, and never 'recent projects' or 'recent work' - this is a chair or a gym floor, not a building site.",
      "services":
        "Treatments or classes, with what each includes and how long it takes. Prices where the facts supply them.",
      "guarantee":
        "Booking, the cancellation policy, and how to request a particular stylist or trainer.",
      "process":
        "What a first visit is like, including the consultation before anything starts.",
      "trust":
        "Years established, the Google rating, and qualifications where the facts state them.",
      "about":
        "The individual stylists, therapists or trainers by name, and what each specialises in.",
      "why-us":
        "Why clients keep coming back to these particular people. Never a promise about how someone will look.",
    },
    voiceRules: [
      "Name the individual stylists, therapists or trainers. People book a person.",
      "Be specific about what a service includes and how long it takes.",
      "Say what a first visit is like, including the consultation.",
    ],
    forbiddenSlop: [
      "pamper, indulge, me-time, treat yourself or unwind",
      "transform your look, or any promise about a result",
      "luxury, bespoke or exclusive unless the facts support it",
      "prices or qualifications not present in the supplied facts",
    ],
    faqSeeds: [
      "How much does it cost?",
      "How do I book, and how far ahead should I?",
      "How long will the appointment take?",
      "Can I request a particular stylist or therapist?",
      "Do you offer a consultation first?",
      "What is your cancellation policy?",
      "Where are you and is there parking?",
      "What are your opening hours?",
      "Do you take walk-ins?",
      "What products do you use?",
    ],
    trustSignals: [
      "Google rating and review count, when real",
      "Years established",
      "Named team members with their specialisms",
    ],
  },

  media: {
    heroQuery: "modern {industry} interior styling chair",
    proofQuery: "{industry} finished result client portrait",
    teamQuery: "{industry} stylist team portrait salon",
    offeringQuery: "{item} {industry}",
    heroSubject:
      "The interior of a modern independent {industry} in {city}, styling stations and warm lighting, calm and empty of people",
    aboutSubject:
      "A small {industry} team standing together in their own studio, relaxed and unposed, natural light",
    proofSubject:
      "A close, natural-light portrait of a happy client immediately after their appointment, real and unretouched",
    offeringSubject:
      "{item} being carried out in a modern {industry}, focused on the practitioner's hands and the work itself",
    forbiddenImagery: [
      "heavily retouched beauty stock models",
      "white-background product shots",
      "spa cliché: stacked stones, orchids, folded towels, candles",
    ],
  },

  artDirection: {
    sourceName: "House direction · Salon & wellness",
    mood: "light-editorial",
    palette: {
      primary: "#A21D5B",
      accent: "#F9A8D4",
      surface: "#FFFFFF",
      surfaceAlt: "#FDF2F8",
      ink: "#18181B",
      inkMuted: "#52525B",
      onPrimary: "#FFFFFF",
    },
    typography: {
      displayFamily: "Cormorant Garamond",
      bodyFamily: "Inter",
      displayWeight: "600",
      scale: "dramatic",
      headingCase: "sentence",
    },
    geometry: { radius: "pill", elevation: "flat", borderTreatment: "hairline" },
    layout: {
      heroTreatment: "full-bleed-image",
      sectionRhythm: "generous",
      imageDensity: "gallery-led",
      serviceLayout: "editorial-list",
      proofStyle: "review-carousel",
    },
    motifs: [
      "a large real-work gallery placed directly under the hero",
      "a price list set as an editorial column, not as cards",
      "team cards naming each stylist and what they specialise in",
    ],
    rationale:
      "Booking a salon is judging the work first and everything else second. Gallery-led, generous white space, a high-contrast editorial serif, and the two things visitors hunt for — who and how much — visible without a scroll.",
  },

  schema: { localBusinessType: "BeautySalon", offeringSchemaType: "Service" },
  glyphs: { offering: "award", why: ["award", "shield", "clock", "wrench"] },
  // Used only when the copy model fails. Without these the fallback was
  // forty tradesman strings, which is what a gym actually shipped with.
  fallback: {
    "heroHeadline":
      "{industry} in {city}",
    "heroSubhead":
      "Book with someone who takes the time to get it right. See the work, see the prices, then decide.",
    "formTitle":
      "Book an appointment",
    "formSubtitle":
      "We confirm every booking",
    "servicesEyebrow":
      "What we offer",
    "servicesHeadline":
      "Services and prices",
    "servicesIntro":
      "What each appointment includes and roughly how long it takes.",
    "offeringBlurb":
      "{item}.",
    "galleryEyebrow":
      "Our work",
    "galleryHeadline":
      "Recent work on real clients",
    "processHeadline":
      "Your first visit",
    "step1":
      "Book online or message us and tell us what you are after.",
    "step2":
      "We talk it through properly before we start.",
    "step3":
      "You leave happy, and we book the next one if you want to.",
    "guaranteeEyebrow":
      "Booking",
    "guaranteeHeadline":
      "Booking and cancellations",
    "guaranteeBody":
      "You can request a particular person when you book. Let us know as early as you can if you need to change an appointment.",
    "bandBody":
      "Book in, or message us if you are not sure what you need.",
  },
};
