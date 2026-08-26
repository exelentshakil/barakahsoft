import type { ScrapeResults } from "@/types/database";

// The business's own published phone and email.
//
// One resolver, because there were two and they disagreed. The generated
// page body took its number from the brief and the nav and footer took theirs
// from the payload, each with its own fallback chain — so a single page could
// print two different phone numbers, which is worse than printing none.
//
// Ordering is by how much a source can be trusted, not by how easy it is to
// read:
//
//   Google Places and the site's own schema.org block are single,
//   authoritative values that the business publishes about itself. Both were
//   already being fetched and neither was consulted.
//
//   The scraped nap arrays are noisy. One real lead's phones list held
//   Facebook pixel ids and a date beside the real number, and only resolved
//   correctly because the real one happened to sort first.
//
//   The lead's own phone and email come last. That is whoever filled in the
//   form — on an outreach prospect, us — which is how a client's delivered
//   site ends up printing our email address as their contact.

export interface BusinessContact {
  phone: string | null;
  email: string | null;
  address: string | null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** A phone-shaped string, rejecting the ids and dates that share the array. */
function plausiblePhone(candidate: string): boolean {
  const trimmed = candidate.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  // Seven is the shortest real local number; fifteen is the E.164 maximum.
  // A nineteen-digit pixel id fails both ends.
  // A 13-15 digit unbroken number is almost always a pixel ID or tracking token.
  // Standard US numbers are 10-11 digits. International are usually 11-12.
  if (digits.length > 12 && !candidate.includes('+')) return false;
  return digits.length >= 7 && digits.length <= 15;
}


function sanitizeEmail(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const strVal = typeof candidate === 'string' ? candidate : String(candidate);
  const match = strVal.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|co|io|us|uk|ca|au|biz|info|tv|app|dev|me|site|tech|agency|studio|services|construction|plumbing|roofing)/i);
  return match ? match[0].toLowerCase() : null;
}

function localBusinessSchema(facts: Record<string, unknown>): Record<string, unknown> {
  const entries = Array.isArray(facts.existing_schema) ? facts.existing_schema : [];
  for (const entry of entries) {
    const type = (entry as Record<string, unknown>)?.["@type"];
    if (typeof type === "string" && /LocalBusiness|Organization/i.test(type)) {
      return entry as Record<string, unknown>;
    }
  }
  return {};
}

export function resolveBusinessContact(
  scrapeResults: Pick<ScrapeResults, "facts" | "places_raw"> | null | undefined,
  fallback: { phone?: string | null; email?: string | null } = {},
  options: { forceFallback?: boolean } = {}
): BusinessContact {
  const facts = (scrapeResults?.facts ?? {}) as Record<string, unknown>;
  const places = (scrapeResults?.places_raw ?? {}) as Record<string, unknown>;
  const schema = localBusinessSchema(facts);
  const nap = (facts.nap as { phones?: string[]; emails?: string[]; address?: string } | undefined) ?? {};

  const phone = options.forceFallback
    ? str(fallback.phone) ?? str(places.phone) ?? str(schema.telephone) ?? nap.phones?.find(plausiblePhone) ?? null
    : str(places.phone) ?? str(schema.telephone) ?? nap.phones?.find(plausiblePhone) ?? str(fallback.phone) ?? null;

  const email = options.forceFallback
    ? sanitizeEmail(str(fallback.email)) ?? sanitizeEmail(str(schema.email)) ?? sanitizeEmail(nap.emails?.find((candidate) => candidate.includes("@"))) ?? null
    : sanitizeEmail(str(schema.email)) ?? sanitizeEmail(nap.emails?.find((candidate) => candidate.includes("@"))) ?? sanitizeEmail(str(fallback.email)) ?? null;

  return {
    phone,
    email,
    address: str(places.formatted_address) ?? str(nap.address) ?? null,
  };
}
