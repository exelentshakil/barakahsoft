import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { BespokeNav } from "@/components/site-shell/BespokeNav";
import { BespokeFooter } from "@/components/site-shell/BespokeFooter";
import { AboutTemplate } from "@/components/site-shell/pages/AboutTemplate";
import { siteRootStyle } from "@/components/site-shell/shell-style";
import { BespokePageBody } from "@/components/site-shell/BespokePage";
import { breadcrumbSchema } from "@/lib/seo/breadcrumb-schema";
import { isAdminSession } from "@/lib/is-admin-session";

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
  if (!result.payload.innerPagesBuilt && !(await isAdminSession())) redirect(`/s/${leadSlug}#expertise`);

  const { payload } = result;
  const breadcrumb = breadcrumbSchema(leadSlug, payload.businessName, [{ name: "About", path: "/about" }]);

  return (
    <div style={siteRootStyle(payload)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <BespokeNav payload={payload} spec={payload.chromeSpec} />
      {payload.bespokePages["about"] ? (
        <BespokePageBody html={payload.bespokePages["about"]} css={payload.bespokeCss} />
      ) : (
        <AboutTemplate payload={payload} />
      )}
      <BespokeFooter payload={payload} spec={payload.chromeSpec} />
    </div>
  );
}
