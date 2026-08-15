import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { FaqTemplate } from "@/components/site-shell/pages/FaqTemplate";
import { getShellStyle } from "@/components/site-shell/shell-style";

// Same §6 gate as contact/services/areas -- the same real FAQ content
// already generated for the homepage anchor section, as its own page.
export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string }> }): Promise<Metadata> {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result || !result.payload.innerPagesBuilt) return {};
  return {
    title: `FAQ | ${result.payload.businessName}`,
    alternates: { canonical: `/s/${leadSlug}/faq` },
  };
}

export default async function FaqPage({ params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();
  if (!result.payload.innerPagesBuilt) redirect(`/s/${leadSlug}#faq`);

  const { payload } = result;

  return (
    <div style={getShellStyle(payload)}>
      <MegaMenu payload={payload} />
      <FaqTemplate payload={payload} />
      <PremiumFooter payload={payload} />
    </div>
  );
}
