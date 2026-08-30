export const runtime = "edge";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { BespokeSiteNav, BespokeSiteFooter } from "@/components/site-shell/BespokeChrome";
import { LegalPageTemplate } from "@/components/site-shell/pages/LegalPageTemplate";
import { siteRootStyle } from "@/components/site-shell/shell-style";
import { isAdminSession } from "@/lib/is-admin-session";

// Same §6 gate as every other inner page, for consistency -- though the
// content itself is static boilerplate + real business identity, not
// AI-generated (see LegalPageTemplate's comment on why that's fine here).
export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string }> }): Promise<Metadata> {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result || !result.payload.innerPagesBuilt) return {};
  return {
    title: `Privacy Policy | ${result.payload.businessName}`,
    alternates: { canonical: `/s/${leadSlug}/privacy` },
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();
  if (!result.payload.innerPagesBuilt && !(await isAdminSession())) redirect(`/s/${leadSlug}`);

  const { payload } = result;

  return (
    <div style={siteRootStyle(payload)}>
      <BespokeSiteNav payload={payload} />
      <LegalPageTemplate payload={payload} kind="privacy" />
      <BespokeSiteFooter payload={payload} />
    </div>
  );
}
