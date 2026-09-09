// Node (Fluid Compute), not edge.
//
// This route hit the 1 MB edge bundle ceiling and the DEPLOY failed — the
// build itself was fine, which is why the error was not in the build log.
// Edge is the wrong trade here anyway: Fluid Compute runs in the same regions
// at the same price, reuses instances so cold starts are comparable, and has
// no 1 MB wall to trip over as the tenant and vertical registries grow.
import { redirect } from "next/navigation";

// Legacy Cartesian service-area URLs are consolidated into the real service
// area section. New builds do not manufacture these thin combinations.
export default async function LegacyLocationPage({ params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  redirect(`/s/${leadSlug}#areas`);
}
