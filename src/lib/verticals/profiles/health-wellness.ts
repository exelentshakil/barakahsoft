import type { VerticalProfile } from "@/lib/verticals/types";

/**
 * Macro-ICP 3 — dentists, clinics, physios, chiropractors, vets, opticians.
 *
 * The closest vertical to home services and the easiest win: same Google
 * listing, same reviews, same local intent. What changes is the verb. Nobody
 * asks a dentist for a quote — they book. And the anxiety is different: a
 * trade buyer worries about cost and mess, a patient worries about pain,
 * whether it will hurt, and whether they will be judged for leaving it.
 */
export const healthWellness: VerticalProfile = {
  slug: "health-wellness",
  label: "Health & Medical Practice",
  origin: "curated",
  basedOn: "home-services",
  match: [
    "dentist|dental|orthodont|endodont|periodont|implant",
    "doctor|gp surgery|medical (clinic|practice|centre|center)|physician|walk-in clinic",
    "chiropract|physio|physical therap|osteopath|podiatr|sports (injury|therapy)",
    "optician|optometr|eye (clinic|care)|audiolog|hearing (clinic|aid)",
    "veterinar|vet (clinic|practice|surgery)|animal hospital",
    "fertility|dermatolog|cosmetic (clinic|surgery)|aesthetics clinic",
  ],

  nouns: {
    offering: "treatment",
    offeringPlural: "Treatments",
    offeringPath: "treatments",
    areaPlural: "Areas We Serve",
    areaPath: "areas",
    customer: "patient",
    work: "appointment",
  },

  sectionBand: [9, 14],

  lists: {
    offeringCount: 8,
    areaCount: 6,
    // A practice does offer adjacent standard treatments it has not listed.
    padOfferings: true,
    // It does not serve towns it has never named. A patient chooses a practice
    // they can physically reach, so an invented catchment is a wasted page and
    // a false claim.
    padAreas: false,
  },

  cta: {
    intent: "book-appointment",
    primaryLabel: "Book an appointment",
    secondaryIntent: "call-now",
    secondaryLabel: "Call the practice",
    guidance:
      "The visitor is choosing who to trust with their body, often while anxious and often after putting it off. Lead with reassurance and ease of booking, not with technology or credentials. Name what a first visit actually involves, step by step, because not knowing is what stops people booking. Make new-patient status, availability and any nervous-patient care explicit. Do not use urgency or scarcity — pressure reads as a sales tactic here and destroys trust faster than it converts.",
  },

  copy: {
    persona:
      "You are a copywriter for a local healthcare practice. You write calmly and plainly, the way a good clinician explains something to a nervous patient: no jargon, no hard sell, no claims about outcomes.",
    // What each slot MEANS here. Without this the model reads the slot
    // names literally and writes trade copy into every vertical.
    sectionBriefs: {
      "gallery":
        "The practice itself: the waiting room, the treatment rooms, the equipment. Never a procedure, never a patient's face.",
      "guarantee":
        "Booking, cancellation, and what happens if something goes wrong. Never a promise about a clinical outcome.",
      "process":
        "What a first appointment actually involves, step by step, because not knowing is what stops people booking.",
      "trust":
        "Registrations, professional bodies, years the practice has been open, the Google rating.",
      "about":
        "The clinicians, their training, and why a nervous patient would be comfortable here.",
      "why-us":
        "What a patient cares about: waiting times, new-patient availability, how they are treated when anxious.",
    },
    voiceRules: [
      "Address the worry before the treatment. People delay care out of fear, cost and embarrassment, in that order.",
      "Say what happens at a first appointment concretely — what is examined, how long it takes, what it costs.",
      "Write about the patient's experience, not the practice's equipment.",
    ],
    forbiddenSlop: [
      "guaranteed results, or any promise about a clinical outcome",
      "urgency, countdowns or scarcity of appointments",
      "specific clinical claims not present in the supplied facts",
      "the words painless or pain-free unless the facts state it",
    ],
    faqSeeds: [
      "Are you taking new patients?",
      "How much does a first appointment cost?",
      "Do you take insurance, and which plans?",
      "What happens at a first visit?",
      "How quickly can I be seen, and do you take emergencies?",
      "I am nervous about this — how do you help with that?",
      "Where are you, and is there parking?",
      "What are your opening hours?",
      "Do you treat children?",
      "How do I book?",
    ],
    trustSignals: [
      "Registration and professional body membership, when the facts state it",
      "Years the practice has been open",
      "Google rating and review count, when real",
    ],
  },

  media: {
    heroQuery: "modern {industry} practice interior welcoming",
    proofQuery: "{industry} clinician with patient consultation",
    teamQuery: "friendly {industry} clinical team portrait",
    offeringQuery: "{item} {industry} clinic",
    heroSubject:
      "The bright, calm reception area of a modern {industry} practice in {city}, warm daylight, plants, no people in frame",
    aboutSubject:
      "A small {industry} clinical team in scrubs or professional dress standing together in their practice, relaxed and approachable, natural light",
    proofSubject:
      "A clinician in a modern treatment room speaking with a seated patient, both at ease, documentary style, no procedure visible",
    offeringSubject:
      "A clean, modern {industry} treatment room prepared for {item}, equipment tidy and unintimidating, warm lighting",
    forbiddenImagery: [
      "close-up surgical or dental procedures",
      "blood, needles, or anything clinically graphic",
      "stock models with unnaturally perfect teeth or skin",
      "elderly patients looking distressed",
    ],
  },

  artDirection: {
    sourceName: "House direction · Health practice",
    mood: "clinical-trust",
    palette: {
      primary: "#0F766E",
      accent: "#5EEAD4",
      surface: "#FFFFFF",
      surfaceAlt: "#F0FDFA",
      ink: "#0F172A",
      inkMuted: "#475569",
      onPrimary: "#FFFFFF",
    },
    typography: {
      displayFamily: "Fraunces",
      bodyFamily: "Inter",
      displayWeight: "600",
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
      "a first-visit timeline with what happens at each step",
      "an availability and new-patient status block near the fold",
      "practitioner cards with real names and registration numbers",
    ],
    rationale:
      "A patient is deciding whether to trust a stranger with their body while anxious. Calm teal over generous white space, a serif that reads as established rather than clinical, and the two facts that actually decide it — are you taking patients, and what happens first — placed early.",
  },

  schema: { localBusinessType: "MedicalClinic", offeringSchemaType: "Service" },
  glyphs: { offering: "shield", why: ["shield", "clock", "award", "wrench"] },
  // Used only when the copy model fails. Without these the fallback was
  // forty tradesman strings, which is what a gym actually shipped with.
  fallback: {
    "heroHeadline":
      "{industry} in {city}, taking new patients",
    "heroSubhead":
      "Careful, unhurried treatment from a practice that explains what it is doing and why. Book online or call the practice.",
    "formTitle":
      "Request an appointment",
    "formSubtitle":
      "We confirm every booking",
    "servicesEyebrow":
      "Treatments",
    "servicesIntro":
      "What we treat, and what a first visit involves.",
    "offeringBlurb":
      "{item}, explained fully before anything begins.",
    "galleryEyebrow":
      "The practice",
    "galleryHeadline":
      "Where you will be treated",
    "processHeadline":
      "What your first visit looks like",
    "step1":
      "Book online or call. Tell us briefly what is bothering you.",
    "step2":
      "We examine properly and explain what we find, in plain language.",
    "step3":
      "We agree a plan together, with the cost known before anything starts.",
    "guaranteeEyebrow":
      "Booking",
    "guaranteeHeadline":
      "Booking, changing and cancelling",
    "guaranteeBody":
      "Appointments can be moved or cancelled by phone. We will tell you what a visit costs before you attend.",
    "bandBody":
      "If something has been bothering you, get it looked at.",
  },
};
