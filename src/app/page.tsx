// Node (Fluid Compute), not edge.
//
// This route hit the 1 MB edge bundle ceiling and the DEPLOY failed — the
// build itself was fine, which is why the error was not in the build log.
// Edge is the wrong trade here anyway: Fluid Compute runs in the same regions
// at the same price, reuses instances so cold starts are comparable, and has
// no 1 MB wall to trip over as the tenant and vertical registries grow.
import { LeadEngineLanding } from "@/components/landing/LeadEngineLanding";
import { PartnerLanding } from "@/components/landing/PartnerLanding";
import { getTenant } from "@/lib/tenant";

// Rendered per request, because which brand this page belongs to is decided by
// the host it arrived on.
//
// It was ISR with `revalidate = 300`, which cannot survive tenancy in two
// separate ways. Next refuses to prerender a route that reads headers(), so the
// build failed outright — and even if it had not, a prerendered "/" is ONE
// cache entry shared by every host: the first visitor would have decided which
// brand every other visitor saw.
//
// The Design Quality Bar's freshness argument for ISR still holds; it is now
// served by the request itself rather than by a revalidation window.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const tenant = await getTenant();

  // The platform's landing page sells a specific thing — a managed lead engine
  // with ad spend and a monthly retainer. A partner selling websites at a fixed
  // price would be making claims that are not theirs, so they get a page built
  // entirely from their own tenant config rather than this one with the logo
  // swapped. See PartnerLanding.
  if (!tenant.isDefault) return <PartnerLanding tenant={tenant} />;

  return <LeadEngineLanding />;
}
