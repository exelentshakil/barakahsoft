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
 * Set by the custom-domain rewrite: this request is for a client's own live
 * website, not for the proposal we sold them with.
 *
 * /s/[leadSlug] serves both from one route, so something has to say which. A
 * visitor on the client's domain must never see the sales pitch written to
 * persuade that client, and the site's structured data belongs on the page
 * that has to rank.
 */
export const LIVE_SITE_HEADER = "x-live-site";

/** True when this request arrived on a client's own custom domain. */
export async function isLiveClientSite(): Promise<boolean> {
  return (await headers()).get(LIVE_SITE_HEADER) === "1";
}

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

/**
 * How a delivered page should present itself, given where the request came from.
 *
 * On a client's own custom domain the site IS the root: internal links must not
 * carry ?view=preview and must not be prefixed with /s/<slug>, or our path
 * structure leaks into their navigation and their canonical URLs. Everywhere
 * else, ?view=preview is what distinguishes reviewing the build from reading
 * the proposal.
 */
export async function sitePresentation(viewParam?: string): Promise<{
  liveSite: boolean;
  previewMode: boolean;
  basePath?: string;
}> {
  const liveSite = await isLiveClientSite();
  if (liveSite) return { liveSite, previewMode: false, basePath: "" };
  return { liveSite, previewMode: viewParam === "preview" };
}
