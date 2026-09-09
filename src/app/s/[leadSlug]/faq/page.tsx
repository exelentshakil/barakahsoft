import { sitePresentation } from "@/lib/tenant";
export const runtime = "edge";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { BespokeSiteNav, BespokeSiteFooter } from "@/components/site-shell/BespokeChrome";
import { FaqTemplate } from "@/components/site-shell/pages/FaqTemplate";
import { siteRootStyle } from "@/components/site-shell/shell-style";
import { BespokePageBody } from "@/components/site-shell/BespokePage";
import { breadcrumbSchema } from "@/lib/seo/breadcrumb-schema";
import { isAdminSession } from "@/lib/is-admin-session";

// Same §6 gate as contact/services/areas -- the same real FAQ content
// already generated for the homepage anchor section, as its own page.
export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string }> }): Promise<Metadata> {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result || !result.payload.innerPagesBuilt || !result.payload.bespokePages.faq) return {};
  return {
    title: `FAQ | ${result.payload.businessName}`,
    alternates: { canonical: `/s/${leadSlug}/faq` },
  };
}

export default async function FaqPage({ params, searchParams }: { params: Promise<{ leadSlug: string }>; searchParams: Promise<{ view?: string }> }) {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();
  if ((!result.payload.innerPagesBuilt || !result.payload.bespokePages.faq) && !(await isAdminSession())) redirect(`/s/${leadSlug}#faq`);

  const payload = { ...result.payload, ...(await sitePresentation((await searchParams).view)) };
  const breadcrumb = breadcrumbSchema(leadSlug, payload.businessName, [{ name: "FAQ", path: "/faq" }]);

  return (
    <div style={siteRootStyle(payload)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <BespokeSiteNav payload={payload} />
      {payload.bespokePages["faq"] ? (
        <BespokePageBody html={payload.bespokePages["faq"]} css={payload.bespokeCss} leadSlug={payload.leadSlug} />
      ) : (
        <FaqTemplate payload={payload} />
      )}
      <BespokeSiteFooter payload={payload} />
    </div>
  );
}
