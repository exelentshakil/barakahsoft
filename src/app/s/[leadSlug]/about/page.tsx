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
  if (!result || !result.payload.innerPagesBuilt || !result.payload.bespokePages.about) return {};
  return {
    title: `About | ${result.payload.businessName}`,
    description: result.payload.differentiator || undefined,
    alternates: { canonical: `/s/${leadSlug}/about` },
  };
}

export default async function AboutPage({ params, searchParams }: { params: Promise<{ leadSlug: string }>; searchParams: Promise<{ view?: string }> }) {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();
  if ((!result.payload.innerPagesBuilt || !result.payload.bespokePages.about) && !(await isAdminSession())) redirect(`/s/${leadSlug}#about`);

  const payload = { ...result.payload, ...(await sitePresentation((await searchParams).view)) };
  const breadcrumb = breadcrumbSchema(leadSlug, payload.businessName, [{ name: "About", path: "/about" }]);

  return (
    <div style={siteRootStyle(payload)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <BespokeSiteNav payload={payload} />
      {payload.bespokePages["about"] ? (
        <BespokePageBody html={payload.bespokePages["about"]} css={payload.bespokeCss} leadSlug={payload.leadSlug} />
      ) : (
        <AboutTemplate payload={payload} />
      )}
      <BespokeSiteFooter payload={payload} />
    </div>
  );
}
