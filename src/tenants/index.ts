import { barakahsoft } from "@/tenants/barakahsoft";
import { smilecreative } from "@/tenants/smilecreative";
import type { Tenant } from "@/tenants/types";

export * from "@/tenants/types";

/**
 * Every tenant this deployment serves.
 *
 * Adding a partner is: create src/tenants/<slug>/index.ts, add it here, add
 * their domain to the Vercel project, insert their accounts row. Removing one
 * is deleting those two things.
 *
 * Jonas and Jim are scaffolded in src/tenants/{jonas,jim}/ but deliberately
 * not registered — a tenant with a placeholder host would claim a hostname
 * nobody owns and shadow the default fallback.
 */
export const TENANTS: Tenant[] = [barakahsoft, smilecreative];

export const DEFAULT_TENANT: Tenant =
  TENANTS.find((tenant) => tenant.isDefault) ?? barakahsoft;

/** host (no port) -> tenant, built once at module load. */
const BY_HOST = new Map<string, Tenant>();
for (const tenant of TENANTS) {
  for (const host of [tenant.primaryHost, ...tenant.extraHosts]) {
    BY_HOST.set(host.toLowerCase(), tenant);
  }
}

// Every tenant's own configured origins, registered to that tenant.
//
// A tenant declares siteBaseUrl and portalBaseUrl and it is easy to assume
// those are covered by primaryHost and extraHosts. They are not: Smile
// Creative's portalBaseUrl is portal.smilecreative.agency and that host was in
// neither list, so every proposal served from it resolved to the DEFAULT
// tenant and a partner's client read the platform's brand, icon and metadata
// on the page they had been sent to buy from.
//
// Deriving the hosts from the origins a tenant already declares means the two
// can never disagree — there is nothing to keep in sync by hand.
for (const tenant of TENANTS) {
  for (const url of [tenant.siteBaseUrl, tenant.portalBaseUrl]) {
    try {
      const { hostname } = new URL(url);
      // An explicit primaryHost or extraHosts entry wins: those are declared
      // deliberately, and a shared staging origin should not steal a host from
      // the tenant that actually named it.
      if (!BY_HOST.has(hostname)) BY_HOST.set(hostname, tenant);
    } catch {
      // A malformed origin is not worth failing module load over.
    }
  }
}

const BY_SLUG = new Map(TENANTS.map((tenant) => [tenant.slug, tenant]));

/**
 * Which brand is this request for?
 *
 * An unrecognised host resolves to the default rather than 404ing, because
 * every Vercel preview deployment arrives on a hostname no tenant declares,
 * and 404ing those would make preview testing impossible. A client's own
 * custom domain is not a tenant host — it resolves through the lead that owns
 * it, so the site renders under whichever brand sold it.
 */
export function resolveTenantByHost(host: string | null | undefined): Tenant {
  if (!host) return DEFAULT_TENANT;
  const clean = host.split(":")[0].trim().toLowerCase();
  return BY_HOST.get(clean) ?? DEFAULT_TENANT;
}

export function tenantBySlug(slug: string | null | undefined): Tenant {
  if (!slug) return DEFAULT_TENANT;
  return BY_SLUG.get(slug) ?? DEFAULT_TENANT;
}

/** True when the host belongs to this deployment rather than to a client site. */
export function isAppHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return BY_HOST.has(host.split(":")[0].trim().toLowerCase());
}
