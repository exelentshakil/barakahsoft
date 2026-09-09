import { PERSONAS, type PersonaSlug } from "@/lib/personas";
import { healthWellness } from "@/lib/verticals/profiles/health-wellness";
import { homeServices } from "@/lib/verticals/profiles/home-services";
import { hospitalityFood } from "@/lib/verticals/profiles/hospitality-food";
import { localRetail } from "@/lib/verticals/profiles/local-retail";
import { professionalServices } from "@/lib/verticals/profiles/professional-services";
import { salonWellness } from "@/lib/verticals/profiles/salon-wellness";
import type { VerticalProfile } from "@/lib/verticals/types";

export * from "@/lib/verticals/types";
export { fill, fillVars, type FillVars } from "@/lib/verticals/fill";

/**
 * The curated profiles, most specific first.
 *
 * Order matters: resolveVertical takes the first regex hit, so a profile whose
 * match patterns are a superset of another's must come after it.
 *
 * These are TS modules rather than JSON or database rows for one hard reason:
 * /s/[leadSlug]/page.tsx runs on the edge and reads the profile's schema.org
 * type for its JSON-LD, where fs.readFileSync cannot run. The compile-time
 * checking of SectionId and SCHEMA_TYPES, and a profile change being reviewable
 * as a diff, are the reasons to be happy about it.
 */
export const PROFILES: VerticalProfile[] = [
  // Most specific first. home-services is last of the "native" set because its
  // patterns are the broadest; professional-services is last overall because it
  // is the catch-all for expertise businesses.
  healthWellness,
  hospitalityFood,
  salonWellness,
  localRetail,
  homeServices,
  professionalServices,
];

export const DEFAULT_PROFILE = homeServices;

export function getCuratedProfile(slug: string): VerticalProfile | null {
  return PROFILES.find((profile) => profile.slug === slug) ?? null;
}

/**
 * Intake personas map to verticals here, not in personas.ts.
 *
 * personas.ts is imported into the client bundle by the intake form; importing
 * the profile registry from it would pull every profile — and their art
 * direction, prompts and photo templates — into the browser for a dropdown of
 * eleven labels.
 *
 * All eleven are trades, so all eleven map to home-services. The map is written
 * out rather than hardcoded to a constant so that adding a non-trade persona
 * later is a compile error here instead of a silent mis-route.
 */
export const PERSONA_VERTICAL: Record<PersonaSlug, string> = Object.fromEntries(
  PERSONAS.map((persona) => [persona.slug, "home-services"])
) as Record<PersonaSlug, string>;
