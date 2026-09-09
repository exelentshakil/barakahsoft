// Node (Fluid Compute), not edge.
//
// This route hit the 1 MB edge bundle ceiling and the DEPLOY failed — the
// build itself was fine, which is why the error was not in the build log.
// Edge is the wrong trade here anyway: Fluid Compute runs in the same regions
// at the same price, reuses instances so cold starts are comparable, and has
// no 1 MB wall to trip over as the tenant and vertical registries grow.
import { sitePresentation } from "@/lib/tenant";
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
