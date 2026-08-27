export const runtime = "edge";
import { redirect } from "next/navigation";

// Legacy Cartesian service-area URLs are consolidated into the real service
// area section. New builds do not manufacture these thin combinations.
export default async function LegacyLocationPage({ params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  redirect(`/s/${leadSlug}#areas`);
}
