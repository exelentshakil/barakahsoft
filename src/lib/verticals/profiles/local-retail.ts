import type { VerticalProfile } from "@/lib/verticals/types";

/**
 * Macro-ICP 5 (the supported half) — a shop with a real premises.
 *
 * Florists, garden centres, jewellers, boutiques, pet shops, bike shops,
 * bakeries with a counter. Not DTC e-commerce: no catalogue, no cart, no
 * inventory. This engine builds the shop's presence, and the conversion is a
 * visit, a call or an order enquiry — which is what an independent shop with a
 * Google listing actually needs, and what they currently have nothing of.
 *
 * The whole page is the product photography and the address.
 */
export const localRetail: VerticalProfile = {
  slug: "local-retail",
  label: "Local Shop & Retail",
  origin: "curated",
  basedOn: "home-services",
  match: [
    "florist|flower ?(shop|studio)|garden cent|nursery (garden|plant)",
    "jewell?er|boutique|clothing store|dress shop|bridal (shop|boutique)",
    "gift shop|card shop|book ?shop|toy shop|antique|vintage shop",
    "pet (shop|store|groom)|aquatics|garden furniture",
    "furniture (shop|store)|home ?ware|interiors shop|lighting shop|hardware store",
    "farm shop|butcher|greengrocer|fishmonger|off licence|wine merchant|convenience store",
    "pharmacy|chemist|health food shop|bike (shop|store)|music shop|art supplies",
  ],

  nouns: {
    offering: "product",
    offeringPlural: "What We Sell",
    offeringPath: "products",
    areaPlural: "Delivery Areas",
    areaPath: "areas",
    customer: "customer",
    work: "order",
  },

  sections: [
    { id: "hero", enabled: true },
    { id: "trust", enabled: true, label: "Trust bar" },
    { id: "services", enabled: true, label: "What we sell" },
    { id: "gallery", enabled: true, label: "In the shop" },
    { id: "about", enabled: true, label: "Our story" },
    { id: "reviews", enabled: true },
    { id: "cta-band", enabled: true, label: "Conversion band" },
    { id: "why-us", enabled: true, label: "Why shop with us" },
    { id: "process", enabled: true, label: "Ordering & delivery" },
    { id: "faq", enabled: true, label: "FAQ" },
    { id: "areas", enabled: true, label: "Delivery areas" },
    { id: "contact", enabled: true, label: "Find us" },
    // A shop guarantees goods, not workmanship. Ordering covers this.
    { id: "guarantee", enabled: false },
  ],

  lists: {
    offeringCount: 8,
    // Many independents genuinely do deliver locally, so the section stays —
    // but only to places they actually name.
    areaCount: 6,
    padOfferings: true,
    padAreas: false,
  },

  cta: {
    intent: "enquiry",
    primaryLabel: "Order or enquire",
    secondaryIntent: "call-now",
    secondaryLabel: "Call the shop",
    guidance:
      "The visitor either wants to visit or wants to order something specific, usually today. Address, opening hours and whether you deliver must be answerable at a glance. Photography of the actual shop and the actual stock does the selling — this is a visual purchase. Make ordering by phone or message obvious, since an independent shop rarely has a checkout and pretending otherwise loses the sale. Say what makes the stock different from a supermarket's.",
  },

  copy: {
    persona:
      "You are a copywriter for an independent local shop. You write the way a good shopkeeper talks about their stock: specific, knowledgeable, proud of it, and never grand.",
    // What each slot MEANS here. Without this the model reads the slot
    // names literally and writes trade copy into every vertical.
    sectionBriefs: {
      "gallery":
        "The shop and the stock, photographed as it actually looks. Never white-background product cutouts.",
      "services":
        "What they sell, with real product names and makers where the facts supply them.",
      "guarantee":
        "Ordering, delivery areas and cut-off times, returns and exchanges.",
      "process":
        "How to order, how much notice is needed, and whether same-day is possible.",
      "trust":
        "Years trading, the Google rating, and named local growers, makers or suppliers.",
      "about":
        "The shopkeeper, why they stock what they stock, and what makes it different from a supermarket.",
    },
    voiceRules: [
      "Name actual products and actual makers or growers where the facts supply them.",
      "Say clearly whether you deliver, where to, and by when.",
      "Opening hours and the address are content, not footer material.",
    ],
    forbiddenSlop: [
      "curated collection, hand-picked selection or artisanal",
      "a shopping experience, or anything about a journey",
      "stock, prices or delivery areas not present in the supplied facts",
      "claims of being the best or the largest in the area",
    ],
    faqSeeds: [
      "Where are you and what are your opening hours?",
      "Do you deliver, and where to?",
      "How do I order?",
      "How much do things cost?",
      "Can you do something bespoke or made to order?",
      "How much notice do you need?",
      "Do you do same-day?",
      "Is there parking nearby?",
      "Do you take card, and do you do gift vouchers?",
      "Can I return or exchange something?",
    ],
    trustSignals: [
      "Google rating and review count, when real",
      "Years trading, when the facts state it",
      "Named local growers, makers or suppliers, when the facts state them",
    ],
  },

  media: {
    heroQuery: "independent {industry} shop front display",
    proofQuery: "{industry} shop interior display close up",
    teamQuery: "independent shop owner behind counter portrait",
    offeringQuery: "{item} {industry}",
    heroSubject:
      "The shopfront and window display of an independent {industry} in {city}, daylight, inviting and clearly a real high-street shop",
    aboutSubject:
      "The owner of an independent {industry} standing behind their own counter, unposed, warm natural light",
    proofSubject:
      "A close, natural-light photograph of a well-arranged display inside an independent {industry}, real stock rather than styled props",
    offeringSubject:
      "{item} photographed close in natural light on a real shop surface, unstyled and true to what a customer would receive",
    forbiddenImagery: [
      "white-background e-commerce product cutouts",
      "supermarket aisles or chain-store interiors",
      "shopping bags, trolleys or credit cards as generic retail symbols",
    ],
  },

  artDirection: {
    sourceName: "House direction · Local retail",
    mood: "warm-craft",
    palette: {
      primary: "#166534",
      accent: "#FBBF24",
      surface: "#FFFDF7",
      surfaceAlt: "#F2F7EF",
      ink: "#1C1917",
      inkMuted: "#57534E",
      onPrimary: "#FFFFFF",
    },
    typography: {
      displayFamily: "Fraunces",
      bodyFamily: "Inter",
      displayWeight: "700",
      scale: "balanced",
      headingCase: "sentence",
    },
    geometry: { radius: "rounded", elevation: "soft", borderTreatment: "hairline" },
    layout: {
      heroTreatment: "full-bleed-image",
      sectionRhythm: "generous",
      imageDensity: "gallery-led",
      serviceLayout: "bento-grid",
      proofStyle: "quote-cards",
    },
    motifs: [
      "opening hours and address pinned directly beneath the hero",
      "a bento grid of what they sell, photographed rather than listed",
      "a delivery-area block with a genuine cut-off time",
    ],
    rationale:
      "An independent shop competes on being real, local and better stocked than a chain. Warm off-white and a confident serif over gallery-led photography of the actual shop, with the two practical facts a visitor came for — when you are open and whether you deliver — placed before anything else.",
  },

  schema: { localBusinessType: "Store", offeringSchemaType: "Product" },
  glyphs: { offering: "award", why: ["award", "clock", "shield", "wrench"] },
  fallback: {},
};
