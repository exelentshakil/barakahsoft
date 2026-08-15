import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { AboutTemplate } from "@/components/site-shell/pages/AboutTemplate";
import { getShellStyle } from "@/components/site-shell/shell-style";

// Same §6 gate as contact/services/areas -- built from content the fast
// homepage pass already generates, so this doesn't need full-site expansion.
export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string }> }): Promise<Metadata> {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result || !result.payload.innerPagesBuilt) return {};
  return {
    title: `About | ${result.payload.businessName}`,
    description: result.payload.differentiator || undefined,
    alternates: { canonical: `/s/${leadSlug}/about` },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();
  if (!result.payload.innerPagesBuilt) redirect(`/s/${leadSlug}#expertise`);

  const { payload } = result;

  return (
    <div style={getShellStyle(payload)}>
      <MegaMenu payload={payload} />
      <AboutTemplate payload={payload} />
      <PremiumFooter payload={payload} />
    </div>
  );
}
