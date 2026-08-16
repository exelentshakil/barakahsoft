// Post-launch pivot — narrowed from the original 7 generic personas to the
// 10 specific home-services trades the business now exclusively serves,
// matching how ferociousmedia.com structures its own "Trades We Serve"
// page. Shared between the intake form, the API route's validation, and
// admin display so the slug/label pairing only lives in one place.
export const PERSONAS = [
  { slug: "contractors", label: "Contractors" },
  { slug: "electricians", label: "Electricians" },
  { slug: "homebuilders", label: "Homebuilders" },
  { slug: "hvac", label: "HVAC" },
  { slug: "movers", label: "Movers" },
  { slug: "pest-control", label: "Pest Control" },
  { slug: "plumbers", label: "Plumbers" },
  { slug: "remodelers", label: "Remodelers" },
  { slug: "restoration", label: "Restoration" },
  { slug: "roofers", label: "Roofers" },
  { slug: "other-trade", label: "Other trade" },
] as const;

export type PersonaSlug = (typeof PERSONAS)[number]["slug"];

export function isPersonaSlug(value: string): value is PersonaSlug {
  return PERSONAS.some((p) => p.slug === value);
}

export function personaLabel(slug: string | null): string | null {
  return PERSONAS.find((p) => p.slug === slug)?.label ?? null;
}
