// What this business's website is actually for.
//
// Every generated page used the same call to action — "Get a free quote" —
// regardless of trade. That is right for a roofer and wrong for almost
// everything else: a dentist takes bookings, a shop sells, an emergency
// plumber needs the phone answered above all. The action a visitor is meant
// to take is the single most important decision on the page, and it was a
// constant.
//
// The lead's own stated problems matter here too. They tick boxes on the
// intake form — "Visitors don't convert into calls", "Nobody finds us on
// Google" — and none of it reached generation. Those answers say what the
// rebuilt page has to fix, in the client's own words, and using them is
// what makes the result feel addressed to them rather than produced for
// them.

export type ConversionAction =
  | "call-now"
  | "quote-form"
  | "book-appointment"
  | "shop"
  | "consultation"
  | "enquiry";

export interface ConversionIntent {
  primary: ConversionAction;
  /** Button text for the primary action, in the customer's language. */
  primaryLabel: string;
  secondary: ConversionAction | null;
  secondaryLabel: string | null;
  /** How the page should be built around that action. */
  guidance: string;
}

interface Rule {
  match: RegExp;
  intent: (hasPhone: boolean) => ConversionIntent;
}

const RULES: Rule[] = [
  {
    // Trades a customer calls when something is already wrong. The phone is
    // the product; a form is a fallback for out-of-hours.
    match: /emergency|plumb|electric|hvac|heating|cooling|locksmith|restoration|water damage|towing|glazier|boiler|drain/i,
    intent: (hasPhone) => ({
      primary: hasPhone ? "call-now" : "quote-form",
      primaryLabel: hasPhone ? "Call now" : "Get an urgent callback",
      secondary: "quote-form",
      secondaryLabel: "Request a callback",
      guidance:
        "This customer has a problem RIGHT NOW. The phone number must be visible without scrolling, tappable on mobile, and repeated at every decision point. Response time matters more than credentials.",
    }),
  },
  {
    // Considered, quoted work. The customer is comparing and wants a number.
    match: /roof|siding|gutter|window|fenc|deck|paving|driveway|concrete|landscap|remodel|renovat|kitchen|bathroom|builder|contractor|paint|floor|solar|insulation|pest/i,
    intent: () => ({
      primary: "quote-form",
      primaryLabel: "Get a free quote",
      secondary: "call-now",
      secondaryLabel: "Or call us",
      guidance:
        "This is a considered purchase and the customer is collecting quotes. Make the estimate easy to ask for, show finished work prominently, and put proof near the form — this decision is about trust and price together.",
    }),
  },
  {
    match: /dent|doctor|medic|clinic|chiro|physio|therap|salon|spa|barber|aesthetic|vet|optician|counsel/i,
    intent: () => ({
      primary: "book-appointment",
      primaryLabel: "Book an appointment",
      secondary: "call-now",
      secondaryLabel: "Call the practice",
      guidance:
        "The visitor wants a time, not a conversation. Booking should be the most prominent action on every screen, with practitioner credentials and what to expect at the first visit close by.",
    }),
  },
  {
    match: /shop|store|ecommerce|e-commerce|retail|boutique|apparel|clothing|jewel|furniture|product/i,
    intent: () => ({
      primary: "shop",
      primaryLabel: "Shop now",
      secondary: null,
      secondaryLabel: null,
      guidance:
        "This is a shop. Products, prices and the path to buy come first; company story comes last. Delivery and returns are conversion information, not small print.",
    }),
  },
  {
    match: /law|legal|attorney|solicitor|account|financ|insur|consult|advis|agency|marketing|coach|architect|survey/i,
    intent: () => ({
      primary: "consultation",
      primaryLabel: "Book a free consultation",
      secondary: "enquiry",
      secondaryLabel: "Send an enquiry",
      guidance:
        "The visitor is assessing expertise before they will talk to anyone. Lead with the outcome they want, make the first conversation feel low-commitment and clearly free, and let specifics do the persuading.",
    }),
  },
];

const DEFAULT_INTENT = (hasPhone: boolean): ConversionIntent => ({
  primary: "enquiry",
  primaryLabel: "Get in touch",
  secondary: hasPhone ? "call-now" : null,
  secondaryLabel: hasPhone ? "Or call us" : null,
  guidance:
    "Make it obvious what happens when the visitor gets in touch, and how quickly. Ambiguity about the next step is what loses the enquiry.",
});

export function conversionIntentFor(industry: string | null | undefined, hasPhone: boolean): ConversionIntent {
  const trade = (industry ?? "").trim();
  if (!trade) return DEFAULT_INTENT(hasPhone);

  const rule = RULES.find((r) => r.match.test(trade));
  return rule ? rule.intent(hasPhone) : DEFAULT_INTENT(hasPhone);
}

// The intake options, mapped to what the rebuilt page must demonstrably fix.
// Phrased as instructions rather than restatements, because the page has to
// answer the complaint, not repeat it.
const PAIN_RESPONSE: { match: RegExp; instruction: string }[] = [
  {
    match: /not enough leads|enquir/i,
    instruction:
      "They are not getting enough enquiries. Every screen needs an obvious next step — no section may end without one.",
  },
  {
    match: /nobody finds|google|search/i,
    instruction:
      "They are invisible in local search. Name the places they serve in real headings and body copy, not a list in the footer.",
  },
  {
    match: /ai search/i,
    instruction:
      "They are absent from AI answers. Write plain, quotable answers to the questions a real customer asks — the FAQ is doing SEO work, not filling space.",
  },
  {
    match: /outdated|phones|mobile/i,
    instruction:
      "Their current site looks dated and breaks on phones. This design must look unmistakably more expensive than what they have, and read perfectly on a narrow screen.",
  },
  {
    match: /convert|calls/i,
    instruction:
      "Visitors arrive and leave without contacting them. Remove every reason to hesitate: state what happens next, how fast, and what it costs to ask.",
  },
];

/** Turn the lead's selected complaints into build instructions. */
export function painPointInstructions(painPoints: string[] | null | undefined): string[] {
  if (!painPoints?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];

  for (const pain of painPoints) {
    const rule = PAIN_RESPONSE.find((r) => r.match.test(pain));
    if (rule && !seen.has(rule.instruction)) {
      seen.add(rule.instruction);
      out.push(rule.instruction);
    }
  }
  return out;
}
