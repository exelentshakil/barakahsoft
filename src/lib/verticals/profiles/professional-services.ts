import type { VerticalProfile } from "@/lib/verticals/types";

/**
 * Macro-ICP 2 — solicitors, accountants, brokers, agencies, consultants.
 *
 * Also the landing place for creators, educators and creative professionals
 * (ICPs 4 and 8), which is honest rather than ideal: a coach and a
 * photographer both sell expertise to a considered buyer and convert on a
 * conversation, so this structure serves them well even though neither gets
 * the portfolio-first or newsletter-first page they would ideally have.
 *
 * The buyer here is risk-averse and comparing two or three firms. What decides
 * it is evidence of having handled this exact problem before, and knowing what
 * the first conversation will cost.
 */
export const professionalServices: VerticalProfile = {
  slug: "professional-services",
  label: "Professional & B2B Services",
  origin: "curated",
  basedOn: "home-services",
  match: [
    "law firm|solicitor|attorney|barrister|legal (services|practice)|conveyanc",
    "accountant|accountancy|cpa |bookkeep|tax (advisor|consultant|specialist)|payroll",
    "financial (advisor|planner|adviser)|mortgage (broker|advisor)|insurance (broker|agent)|wealth management",
    "estate agent|letting agent|real estate (agent|broker)|surveyor|property management",
    "architect|interior design|planning consultan|structural engineer",
    "consultan|recruit|staffing agency|hr services|it support|managed service provider",
    "marketing agency|advertising agency|creative agency|design studio|branding studio",
    "coach|coaching|keynote speaker|corporate train|tutor|tuition|driving school",
    "photograph|videograph|film ?maker|copywrit|illustrat",
  ],

  nouns: {
    offering: "service",
    offeringPlural: "Services",
    offeringPath: "services",
    areaPlural: "Who We Work With",
    areaPath: "areas",
    customer: "client",
    work: "matter",
  },

  sections: [
    { id: "hero", enabled: true },
    { id: "trust", enabled: true, label: "Trust bar" },
    { id: "services", enabled: true },
    { id: "why-us", enabled: true, label: "Why clients choose us" },
    { id: "about", enabled: true, label: "The team" },
    { id: "process", enabled: true, label: "How we work" },
    { id: "reviews", enabled: true },
    { id: "cta-band", enabled: true, label: "Conversion band" },
    { id: "gallery", enabled: true, label: "Case studies" },
    { id: "faq", enabled: true, label: "FAQ" },
    { id: "areas", enabled: true, label: "Areas served" },
    { id: "guarantee", enabled: true, label: "Getting started" },
    { id: "contact", enabled: true },
  ],

  lists: {
    offeringCount: 8,
    areaCount: 6,
    padOfferings: true,
    // A firm's stated coverage is a professional claim, sometimes a regulated
    // one. Inventing jurisdictions is not a UI balance problem.
    padAreas: false,
  },

  cta: {
    intent: "consultation",
    primaryLabel: "Book a consultation",
    secondaryIntent: "enquiry",
    secondaryLabel: "Send an enquiry",
    guidance:
      "The buyer is risk-averse, comparing two or three firms, and deciding on evidence rather than warmth. Lead with the specific problem they have and proof of having solved it before. Say plainly what the first conversation costs and whether it is free — ambiguity about that is the single biggest reason an enquiry is not sent. Credentials, regulator registration and years in practice belong high on the page. Do not use urgency; a considered professional purchase is not made under pressure.",
  },

  copy: {
    persona:
      "You are a copywriter for a professional services firm. You write with the precision of someone who understands the client's problem and the restraint of someone who knows overclaiming is a liability.",
    // What each slot MEANS here. Without this the model reads the slot
    // names literally and writes trade copy into every vertical.
    sectionBriefs: {
      "gallery":
        "Case studies written as problem, action, outcome. Never photographs of the office.",
      "services":
        "The matters they actually handle, in the language a client would use for their own problem.",
      "guarantee":
        "Fee structure, whether the first conversation is free, and what happens after someone gets in touch.",
      "process":
        "From first contact to instruction to resolution, naming who does what.",
      "trust":
        "Regulator registration, professional bodies, years in practice, the Google rating.",
      "about":
        "Who will actually handle the work, their qualifications, and how long they have practised.",
      "why-us":
        "Evidence of having solved this exact problem before. Never adjectives a competitor could also claim.",
    },
    voiceRules: [
      "Lead with the client's problem in their own words, not with the firm's history.",
      "Be concrete about outcomes without promising them.",
      "State fee structure and whether the first conversation is free.",
    ],
    forbiddenSlop: [
      "trusted partner, thought leader, bespoke solutions or holistic approach",
      "guaranteed outcomes, guaranteed savings or any promise of result",
      "credentials, regulator registrations or awards not present in the facts",
      "client names or case outcomes not present in the facts",
    ],
    faqSeeds: [
      "How much do you charge, and how are fees structured?",
      "Is the first consultation free?",
      "What happens after I get in touch?",
      "How long does a matter like mine usually take?",
      "What qualifications and registrations do you hold?",
      "Who will actually be handling my case?",
      "Do you work with businesses like mine?",
      "How do you keep me updated?",
      "What do you need from me to get started?",
      "Do you work remotely or only locally?",
    ],
    trustSignals: [
      "Regulator registration and professional body membership, when the facts state it",
      "Years in practice",
      "Google rating and review count, when real",
    ],
  },

  media: {
    heroQuery: "professional {industry} office meeting",
    proofQuery: "{industry} client consultation meeting room",
    teamQuery: "professional {industry} team portrait office",
    offeringQuery: "{item} {industry} professional",
    heroSubject:
      "A calm, modern professional office in {city} with natural light and a meeting table, architectural and unpeopled",
    aboutSubject:
      "A small professional team in an office, mid-conversation rather than posed, natural light, business dress appropriate to {industry}",
    proofSubject:
      "Two people in a real meeting room reviewing documents together across a table, documentary style, natural light",
    offeringSubject:
      "A professional working on {item} at a desk, focused on the work and the documents rather than the person",
    forbiddenImagery: [
      "stock businesspeople shaking hands",
      "suited figures pointing at a rising bar chart",
      "glass skyscrapers photographed from below",
      "gavels, scales of justice or other legal cliché",
    ],
  },

  artDirection: {
    sourceName: "House direction · Professional services",
    mood: "light-editorial",
    palette: {
      primary: "#1E3A8A",
      accent: "#60A5FA",
      surface: "#FFFFFF",
      surfaceAlt: "#F1F5F9",
      ink: "#0F172A",
      inkMuted: "#475569",
      onPrimary: "#FFFFFF",
    },
    typography: {
      displayFamily: "Source Serif 4",
      bodyFamily: "Inter",
      displayWeight: "700",
      scale: "balanced",
      headingCase: "sentence",
    },
    geometry: { radius: "sharp", elevation: "flat", borderTreatment: "hairline" },
    layout: {
      heroTreatment: "split-editorial",
      sectionRhythm: "generous",
      imageDensity: "hero-led",
      serviceLayout: "numbered-rows",
      proofStyle: "stat-band",
    },
    motifs: [
      "a credentials and registration band directly under the hero",
      "case studies written as problem, action, outcome",
      "a stated fee structure beside the primary action",
    ],
    rationale:
      "This buyer is comparing firms on evidence, not warmth. A serious navy, a serif that reads as established, sharp geometry and flat surfaces — authority rather than friendliness — with credentials and fee clarity placed where hesitation actually happens.",
  },

  schema: { localBusinessType: "ProfessionalService", offeringSchemaType: "Service" },
  glyphs: { offering: "shield", why: ["award", "shield", "clock", "wrench"] },
  // Used only when the copy model fails. Without these the fallback was
  // forty tradesman strings, which is what a gym actually shipped with.
  fallback: {
    "heroHeadline":
      "{industry} in {city}",
    "heroSubhead":
      "Clear advice, a fixed price agreed up front, and the person you meet is the person who does the work.",
    "formTitle":
      "Request a consultation",
    "formSubtitle":
      "No obligation",
    "servicesIntro":
      "The matters we handle, described the way clients describe them.",
    "offeringBlurb":
      "{item}, handled by the person you speak to.",
    "galleryEyebrow":
      "Our work",
    "galleryHeadline":
      "How we have helped",
    "processHeadline":
      "How working with us goes",
    "step1":
      "Tell us the situation. The first conversation costs nothing.",
    "step2":
      "We set out what we would do and what it costs, in writing.",
    "step3":
      "We get on with it, and keep you posted throughout.",
    "guaranteeEyebrow":
      "Getting started",
    "guaranteeHeadline":
      "What it costs, and when you know",
    "guaranteeBody":
      "You get a fixed price for a described piece of work before anything begins. If your budget will not stretch to it, we say so at the first conversation.",
    "bandBody":
      "Tell us the situation and we will tell you where you stand.",
  },
};
