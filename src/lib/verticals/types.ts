import { z } from "zod";
import { DesignDnaSchema } from "@/lib/design-dna";

// What kind of business this is, expressed as everything the generator needs
// to know that is NOT a fact about this particular client.
//
// The generator used to answer that question with regexes on the trade name,
// scattered across eight files: which call to action, which stock photo query,
// which house palette, how many services to list, whether to have a service
// areas section at all. Each one worked for the trades and silently produced
// a worse page for anything else — a florist got "Get a free quote", a photo
// query for "florist crew at work", and a Service Areas section listing eight
// invented towns.
//
// A profile collects those decisions in one place, per vertical, as data. The
// renderer, the copy prompt, the media planner and the art direction all read
// from it, so adding a vertical is writing one file rather than editing eight.
//
// Deliberately NOT free-form prose. Everything the model is allowed to vary
// per business is a closed enum or a clamped number, because a generated
// profile (see resolve.ts) merges into this same shape and must not be able to
// reorder a page or invent a schema.org type.

/** Every section the renderer can build. Array order in a profile is page order. */
export const SECTION_IDS = [
  "hero",
  "trust",
  "about",
  "services",
  "why-us",
  "process",
  "gallery",
  "cta-band",
  "reviews",
  "areas",
  "guarantee",
  "faq",
  "contact",
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

/**
 * schema.org LocalBusiness subtypes, as a closed allowlist.
 *
 * This is an allowlist rather than a string because a generated profile picks
 * this value, and it lands in a client's live structured data. An invented
 * @type is not a cosmetic error — it is malformed markup on their site that
 * search engines read.
 */
export const SCHEMA_TYPES = [
  "LocalBusiness",
  // Home and trade services
  "Plumber",
  "Electrician",
  "RoofingContractor",
  "HVACBusiness",
  "GeneralContractor",
  "MovingCompany",
  "PestControlService",
  "HousePainter",
  "Locksmith",
  "HomeAndConstructionBusiness",
  // Food and hospitality
  "Restaurant",
  "CafeOrCoffeeShop",
  "BarOrPub",
  "Bakery",
  "FoodEstablishment",
  "Hotel",
  "LodgingBusiness",
  // Beauty and wellness
  "HairSalon",
  "BeautySalon",
  "DaySpa",
  "NailSalon",
  "HealthClub",
  "ExerciseGym",
  // Health practices
  "Dentist",
  "MedicalClinic",
  "Physician",
  "VeterinaryCare",
  "Optician",
  // Professional services
  "ProfessionalService",
  "LegalService",
  "Attorney",
  "AccountingService",
  "InsuranceAgency",
  "FinancialService",
  "RealEstateAgent",
  "Notary",
  // Retail
  "Store",
  "Florist",
  "ClothingStore",
  "JewelryStore",
  "PetStore",
  "HomeGoodsStore",
  "AutoRepair",
  // Creative, education and community
  "Photograph",
  "EntertainmentBusiness",
  "EducationalOrganization",
  "ChildCare",
  "NGO",
  "SportsActivityLocation",
  "AmusementPark",
] as const;
export type SchemaType = (typeof SCHEMA_TYPES)[number];

/** Reuses the generator's existing conversion vocabulary — see conversion-intent.ts. */
export const CTA_INTENTS = [
  "call-now",
  "quote-form",
  "book-appointment",
  "shop",
  "consultation",
  "enquiry",
] as const;

/**
 * How well this engine serves a given business.
 *
 * The engine is a local-business lead-generation site builder: it is fed by
 * Google Places (reviews, NAP, photos) and converts on a phone call or a form.
 * A business without a Google Business Profile, a phone and a location is not
 * a profile gap — the fact-gathering layer returns nothing for it, and the
 * honest answer is to decline rather than ship a weak page with an empty
 * reviews section and a Service Areas block.
 */
export const ICP_FITS = ["native", "adapted", "unsupported"] as const;
export type IcpFit = (typeof ICP_FITS)[number];

const short = (min: number, max: number) => z.string().min(min).max(max);

export const VerticalProfileSchema = z.object({
  slug: z.string().regex(/^[a-z0-9:-]+$/),
  label: short(2, 60),
  origin: z.enum(["curated", "generated"]).default("curated"),
  /** Curated only. Regex sources tested against industry + name + services. */
  match: z.array(z.string()).max(10).default([]),
  /** Generated profiles inherit structure and art direction from this curated base. */
  basedOn: z.string().default("home-services"),

  /**
   * What this business calls things. The single highest-leverage field: it is
   * why a restaurant's page says "menu" and a clinic's says "treatments"
   * without either needing its own renderer.
   */
  nouns: z.object({
    /** Singular, lowercase. "service" | "dish" | "treatment" | "class" */
    offering: short(2, 24),
    /** Title case, used in navigation. "Services" | "Menu" | "Treatments" */
    offeringPlural: short(2, 30),
    /** URL segment. /{offeringPath}/[slug] */
    offeringPath: z.string().regex(/^[a-z-]+$/).max(20),
    /** Title case, used in navigation. "Service Areas" | "Locations" */
    areaPlural: short(2, 30),
    areaPath: z.string().regex(/^[a-z-]+$/).max(20),
    /** "customer" | "guest" | "client" | "patient" */
    customer: short(2, 20),
    /** What a unit of work is called. "job" | "booking" | "appointment" | "order" */
    work: short(2, 20),
  }),

  /**
   * Which sections the page has, in order. Array order IS page order.
   * Structure is never model-writable — see resolve.ts.
   */
  sections: z
    .array(
      z.object({
        id: z.enum(SECTION_IDS),
        enabled: z.boolean().default(true),
        /** Studio panel label override. Not page text — headings come from the model. */
        label: z.string().max(30).optional(),
      })
    )
    .min(4),

  lists: z.object({
    offeringCount: z.number().int().min(0).max(12),
    /** 0 means this is not an area business: no areas section, no areas nav, no area pages. */
    areaCount: z.number().int().min(0).max(12),
    /** May the generator invent items to reach the count? See the note in resolve.ts. */
    padOfferings: z.boolean().default(false),
    padAreas: z.boolean().default(false),
  }),

  cta: z.object({
    intent: z.enum(CTA_INTENTS),
    primaryLabel: short(3, 30),
    secondaryIntent: z.enum(CTA_INTENTS).nullable().default(null),
    secondaryLabel: z.string().max(30).nullable().default(null),
    /** One paragraph. Goes verbatim into the copy prompt. */
    guidance: short(40, 800),
  }),

  copy: z.object({
    /** Replaces the "direct-response copywriter for local trade businesses" system line. */
    persona: short(30, 300),
    voiceRules: z.array(z.string().max(200)).max(8).default([]),
    /** Appended to the generator's own forbidden-word list. */
    forbiddenSlop: z.array(z.string().max(120)).max(14).default([]),
    faqSeeds: z.array(z.string().max(140)).min(4).max(14),
    trustSignals: z.array(z.string().max(200)).max(8).default([]),
  }),

  /**
   * Imagery. Placeholders {industry} {offering} {city} {business} are filled
   * by fill(). Stock photography is most of whether a page reads as premium
   * or as a template, and a query written for one vertical is actively wrong
   * for another.
   */
  media: z.object({
    heroQuery: short(4, 120),
    proofQuery: short(4, 120),
    teamQuery: short(4, 120),
    offeringQuery: short(4, 120),
    heroSubject: short(20, 400),
    aboutSubject: short(20, 400),
    proofSubject: short(20, 400),
    offeringSubject: short(20, 400),
    /** Stated in the image-generation prompt as things to avoid. */
    forbiddenImagery: z.array(z.string().max(120)).max(8).default([]),
  }),

  /**
   * The house visual direction for this vertical, as a complete DesignDna.
   *
   * Reusing DesignDna rather than inventing a parallel vocabulary means this
   * compiles to CSS custom properties through the existing design-tokens path
   * and can be overridden by per-lead research exactly as a preset can.
   * Never model-writable: a generated profile inherits its base's direction.
   */
  artDirection: DesignDnaSchema,

  schema: z.object({
    localBusinessType: z.enum(SCHEMA_TYPES),
    offeringSchemaType: z.enum(["Service", "Product", "MenuItem", "Course", "Event"]).default("Service"),
  }),

  /** Inline SVG glyph names from templates/sections.ts. */
  glyphs: z
    .object({
      offering: z.string().max(24).default("wrench"),
      why: z.array(z.string().max(24)).length(4).default(["shield", "award", "clock", "wrench"]),
    })
    .default({ offering: "wrench", why: ["shield", "award", "clock", "wrench"] }),

  /**
   * Overrides for the deterministic copy fallback, which fires only when the
   * model returns nothing or fails validation. Keys are documented in
   * page-copy.ts; anything absent keeps the generic local-business string,
   * which reads acceptably for any vertical.
   */
  fallback: z.record(z.string().max(600)).default({}),
});

export type VerticalProfile = z.infer<typeof VerticalProfileSchema>;

/** What resolveVertical() returns: the profile plus why it was chosen. */
export interface VerticalResolution {
  profile: VerticalProfile;
  /** One of the nine macro-ICPs, for coverage reporting. */
  icpCategory: string;
  fit: IcpFit;
  /** How the profile was arrived at, for the operator and for debugging. */
  source: "operator" | "persona" | "curated" | "cached" | "generated" | "fallback";
}
