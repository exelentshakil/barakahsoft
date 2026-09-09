import { cache } from "react";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_TENANT, resolveTenantByHost, tenantBySlug, type Tenant } from "@/tenants";

// Getting the current tenant, from any of the three places code runs.
//
// Middleware stamps x-tenant on every request it handles, which is the fast
// path. It is deliberately not the only path: middleware does not run for
// every rendering context, a route handler may be reached directly, and an
// Inngest function has no request at all. Each of those resolves on its own
// rather than silently rendering the default brand — which, on a partner's
// domain, means BarakahSoft's logo and phone number on their prospect's screen.

export const TENANT_HEADER = "x-tenant";

/**
 * The tenant for the current request.
 *
 * Cached per render pass, so a layout, a page and three components asking for
 * it cost one resolution.
 */
export const getTenant = cache(async (): Promise<Tenant> => {
  const store = await headers();

  const stamped = store.get(TENANT_HEADER);
  if (stamped) return tenantBySlug(stamped);

  // Middleware did not run for this context. The host still knows.
  return resolveTenantByHost(store.get("host"));
});

/**
 * The tenant that owns a lead.
 *
 * For background work, which has no request: an Inngest function sending a
 * proposal has to sign it from whoever sold it, not from whoever happens to be
 * the default.
 */
export async function getTenantForLead(leadId: string): Promise<Tenant> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("leads")
    .select("tenant_slug")
    .eq("id", leadId)
    .maybeSingle<{ tenant_slug: string | null }>();
  return tenantBySlug(data?.tenant_slug);
}

export { DEFAULT_TENANT, resolveTenantByHost, tenantBySlug };
export type { Tenant };
