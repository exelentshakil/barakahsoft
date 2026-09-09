export const runtime = "edge";
import { LeadEngineLanding } from "@/components/landing/LeadEngineLanding";
import { PartnerLanding } from "@/components/landing/PartnerLanding";
import { getTenant } from "@/lib/tenant";

// The Design Quality Bar reads approved showcases from the database, so a
// fully static page would freeze whatever was approved at build time and
// never show another one. The approve endpoint also revalidates this path
// directly, making that the fast path and this the safety net.
export const revalidate = 300;

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
