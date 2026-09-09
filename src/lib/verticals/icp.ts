import type { IcpFit } from "@/lib/verticals/types";

// Which businesses this engine can actually serve well.
//
// The engine is a local-business lead-generation site builder. It is fed by
// Firecrawl and Google Places — reviews, NAP, opening hours, photos — and it
// converts on a phone call or a form. Everything it does well follows from
// that: real reviews as proof, a named service area, a phone number in the
// header, a quote form above the fold.
//
// Classifying a business is not the same as covering it. A router that
// confidently classifies a SaaS startup will confidently build it a page with
// a Service Areas section, an empty reviews block and a "Get a free quote"
// button. Declining that lead is a better outcome than shipping it, and it is
// the only way "always premium" is a guarantee rather than a hope.
//
// The nine categories are the macro-ICPs the business sells against. The `fit`
// is the honest answer about each.

export interface IcpCategory {
  slug: string;
  label: string;
  /** The vertical profile a business in this category resolves to. */
  vertical: string;
  fit: IcpFit;
  match: RegExp;
  /** Shown to the operator when fit is "unsupported". */
  why?: string;
}

/**
 * Ordered most specific first — the first match wins.
 *
 * The unsupported categories come FIRST on purpose. "SaaS platform for
 * plumbers" must be read as software, not as plumbing, and a generic local
 * pattern would otherwise claim it.
 */
export const ICP_CATEGORIES: IcpCategory[] = [
  {
    slug: "tech-saas",
    label: "Tech, Startups & SaaS",
    vertical: "professional-services",
    fit: "unsupported",
    match:
      /\b(saas|software as a service|software (company|platform|product)|app developer|mobile app|web3|crypto|blockchain|fintech platform|ai (tool|startup|platform)|developer tool|api platform|venture capital|angel invest|startup accelerator)\b/i,
    why: "No Google Business Profile, no service area and no phone-first conversion, so the reviews, areas and call-to-action this engine is built around have nothing real behind them. Needs feature blocks, pricing tiers and product screenshots instead — a different product.",
  },
  {
    slug: "ecommerce-dtc",
    label: "E-commerce & DTC brands",
    vertical: "local-retail",
    fit: "unsupported",
    match:
      /\b(dtc brand|direct[- ]to[- ]consumer|online (store|shop|boutique)|e-?commerce (brand|store)|shopify store|dropship)\b/i,
    why: "Needs a product catalogue, a cart and inventory, which this engine does not build. A shop with a real premises and a Google listing is a different case and is supported.",
  },
  {
    slug: "local-services",
    label: "Local & Home Services",
    vertical: "home-services",
    fit: "native",
    match:
      /\b(plumb|electric|hvac|heating|cooling|boiler|drain|roof|siding|gutter|contractor|builder|carpent|joiner|landscap|lawn|garden|tree surgeon|pest control|exterminator|locksmith|handyman|glazier|mover|removal|junk removal|cleaner|cleaning (company|service)|painter|decorator|plaster|tiler|flooring|insulation|solar|ev charger|paving|driveway|fenc|deck|remodel|renovat|restoration|water damage|auto repair|garage|mechanic|mot)\b/i,
  },
  {
    slug: "health-wellness",
    label: "Medical, Health & Wellness",
    vertical: "health-wellness",
    fit: "native",
    match:
      /\b(dentist|dental|orthodont|doctor|gp surgery|medical (clinic|practice)|chiropract|physio|physical therap|osteopath|podiatr|optician|optometr|veterinar|vet (clinic|practice)|therapist|counsell?or|psycholog|med ?spa|dermatolog|fertility|audiolog)\b/i,
  },
  {
    slug: "beauty-fitness",
    label: "Beauty, Salons & Fitness",
    vertical: "salon-wellness",
    fit: "native",
    match:
      /\b(hair ?(salon|dresser|stylist)|barber|nail ?(salon|bar|tech)|beauty (salon|clinic)|esthetic|aesthetic clinic|lash|brow|waxing|tanning|massage|spa\b|day spa|gym\b|fitness (studio|centre|center)|personal train|yoga|pilates|crossfit|martial arts|dance (studio|school))\b/i,
  },
  {
    slug: "hospitality-food",
    label: "Hospitality, Food & Entertainment",
    vertical: "hospitality-food",
    fit: "native",
    match:
      /\b(restaurant|bistro|brasserie|café|cafe\b|coffee ?(shop|house)|takeaway|take ?out|pizzeria|bakery|patisserie|deli\b|butcher|caterer|catering|pub\b|bar\b|nightclub|brewery|hotel|guest ?house|bed and breakfast|b&b|airbnb|event venue|wedding (venue|planner)|tour (guide|operator))\b/i,
  },
  {
    slug: "professional-services",
    label: "Professional & B2B Services",
    vertical: "professional-services",
    fit: "native",
    match:
      /\b(law firm|solicitor|attorney|barrister|legal (services|practice)|accountant|accountancy|cpa\b|bookkeep|tax (advisor|consultant)|financial (advisor|planner)|mortgage (broker|advisor)|insurance (broker|agent)|estate agent|real estate (agent|broker)|letting agent|surveyor|architect|interior design|consultan|recruit|staffing agency|marketing agency|advertising agency|it support|managed services)\b/i,
  },
  {
    slug: "local-retail",
    label: "Retail with a premises",
    vertical: "local-retail",
    fit: "native",
    match:
      /\b(florist|flower shop|garden cent|jewell?er|boutique|gift shop|book ?shop|pet (shop|store|groom)|furniture (shop|store)|home ?ware|hardware store|farm shop|off licence|convenience store|pharmacy|chemist|bike shop|music shop|toy shop|antique)\b/i,
  },
  {
    slug: "creators-educators",
    label: "Creators, Experts & Educators",
    vertical: "professional-services",
    fit: "adapted",
    match:
      /\b(coach|coaching|keynote speaker|author\b|podcast|course creator|online course|coaching program|corporate train|tutor|tuition|driving (school|instructor)|music (teacher|lessons)|language school)\b/i,
  },
  {
    slug: "creative-portfolio",
    label: "Creative Professionals",
    vertical: "professional-services",
    fit: "adapted",
    match:
      /\b(photograph|videograph|film ?maker|graphic design|ux design|ui design|illustrat|artist\b|fashion design|copywrit|creative director|branding studio|design studio)\b/i,
  },
  {
    slug: "nonprofit-community",
    label: "Non-Profits, Communities & Institutions",
    vertical: "professional-services",
    fit: "adapted",
    match:
      /\b(charity|charities|non-?profit|ngo\b|foundation\b|community (centre|center|trust)|church|mosque|synagogue|temple\b|religious|private school|nursery|day ?care|childcare|preschool|association|society\b)\b/i,
  },
];

const UNCLASSIFIED: IcpCategory = {
  slug: "unclassified",
  label: "Unclassified local business",
  vertical: "home-services",
  // Not "native": we do not know that it is. Adapted says the page will be
  // built on the safest general structure and is worth an operator's eye.
  fit: "adapted",
  match: /$^/,
};

/**
 * Which macro-ICP is this, and can we serve it?
 *
 * Tested against the industry, the business name and its own service names —
 * "Bloom & Stem" plus "bridal bouquets" identifies a florist more reliably
 * than an industry string that came back "retail".
 */
export function classifyIcp(input: {
  industry?: string | null;
  businessName?: string | null;
  services?: string[];
  /** From classifyBusiness. A business serving no geographic area is a signal. */
  isLocal?: boolean;
  /** Real proof this engine can use. Their absence is what makes a page thin. */
  hasPhone?: boolean;
  hasReviews?: boolean;
}): { category: IcpCategory; fit: IcpFit; reason: string | null } {
  const haystack = [input.industry ?? "", input.businessName ?? "", ...(input.services ?? [])].join(" ");
  const category = ICP_CATEGORIES.find((entry) => entry.match.test(haystack)) ?? UNCLASSIFIED;

  if (category.fit === "unsupported") {
    return { category, fit: "unsupported", reason: category.why ?? null };
  }

  // A category can be native and the individual business still not be. The
  // engine's proof and conversion both assume a real local presence; without a
  // phone number there is nothing for the primary action to do, and that is a
  // thin page however good the category fit.
  if (input.isLocal === false && input.hasPhone === false) {
    return {
      category,
      fit: "unsupported",
      reason:
        "No phone number and no local service area were found, so the call-to-action has nothing to dial and the local-search work has nowhere to point. Add a phone number on the brief screen to proceed.",
    };
  }

  if (input.hasPhone === false || input.hasReviews === false) {
    return {
      category,
      fit: "adapted",
      reason:
        input.hasPhone === false
          ? "No phone number found — the page will lead with the form instead."
          : "No Google reviews found — the proof section will rely on the client's own material.",
    };
  }

  return { category, fit: category.fit, reason: null };
}
