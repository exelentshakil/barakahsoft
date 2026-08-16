import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { LegalPageTemplate } from "@/components/site-shell/pages/LegalPageTemplate";
import { getShellStyle } from "@/components/site-shell/shell-style";
import { isAdminSession } from "@/lib/is-admin-session";

// Same §6 gate as every other inner page -- see privacy/page.tsx and
// LegalPageTemplate for why static boilerplate is the right call here.
export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string }> }): Promise<Metadata> {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result || !result.payload.innerPagesBuilt) return {};
  return {
    title: `Terms of Service | ${result.payload.businessName}`,
    alternates: { canonical: `/s/${leadSlug}/terms` },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();
  if (!result.payload.innerPagesBuilt && !(await isAdminSession())) redirect(`/s/${leadSlug}`);

  const { payload } = result;

  return (
    <div style={getShellStyle(payload)}>
      <MegaMenu payload={payload} />
      <LegalPageTemplate payload={payload} kind="terms" />
      <PremiumFooter payload={payload} />
    </div>
  );
}
