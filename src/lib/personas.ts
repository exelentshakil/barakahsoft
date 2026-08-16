// v4 Phase R — the 7 self-identification options on intake. Shared between
// the intake form, the API route's validation, and admin display so the
// slug/label pairing only lives in one place.
export const PERSONAS = [
  { slug: "local-business-owner", label: "Local business owner" },
  { slug: "solo-service-provider", label: "Solo service provider" },
  { slug: "contractor-tradesperson", label: "Contractor / tradesperson" },
  { slug: "salon-beauty", label: "Salon or beauty professional" },
  { slug: "home-service-business-owner", label: "Home service business owner" },
  { slug: "agency-freelancer", label: "Agency or freelancer" },
  { slug: "other", label: "Other" },
] as const;

export type PersonaSlug = (typeof PERSONAS)[number]["slug"];

export function isPersonaSlug(value: string): value is PersonaSlug {
  return PERSONAS.some((p) => p.slug === value);
}

export function personaLabel(slug: string | null): string | null {
  return PERSONAS.find((p) => p.slug === slug)?.label ?? null;
}
