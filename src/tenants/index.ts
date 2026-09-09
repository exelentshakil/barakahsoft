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

// The deployment's own configured origins, registered to the default tenant.
//
// A safety net for an environment whose NEXT_PUBLIC_SITE_URL or _PORTAL_URL
// points somewhere no tenant module declares — a staging origin, a renamed
// domain. Without it that host is not an app host, and the custom-domain
// rewrite would treat the deployment's own front door as a client's website.
for (const url of [DEFAULT_TENANT.siteBaseUrl, DEFAULT_TENANT.portalBaseUrl]) {
  try {
    const { hostname } = new URL(url);
    if (!BY_HOST.has(hostname)) BY_HOST.set(hostname, DEFAULT_TENANT);
  } catch {
    // A malformed origin is not worth failing module load over.
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
