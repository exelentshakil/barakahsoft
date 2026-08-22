import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { BespokeNav } from "@/components/site-shell/BespokeNav";
import { BespokeFooter } from "@/components/site-shell/BespokeFooter";
import { LocationServiceTemplate } from "@/components/site-shell/pages/LocationServiceTemplate";
import { siteRootStyle } from "@/components/site-shell/shell-style";
import { breadcrumbSchema, serviceSchema } from "@/lib/seo/breadcrumb-schema";
import { isAdminSession } from "@/lib/is-admin-session";

// A real service x real area combination page (slug format
// "<service-slug>--<area-slug>", matching enrich-expand.ts's funnel_pages
// entry). Needs the same inner_pages_built payment gate as every other
// inner page, PLUS fullSiteBuilt -- this content only exists once
// enrich-expand.ts has actually run and found real extractable area names.
export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string; slug: string }> }): Promise<Metadata> {
  const { leadSlug, slug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result || !result.payload.innerPagesBuilt || !result.payload.fullSiteBuilt) return {};
  const section = result.payload.locationServices.find((s) => s.slug === slug);
  if (!section) return {};
  return {
    title: `${section.h2} | ${result.payload.businessName}`,
    description: (section.long_body_content ?? section.body_content).slice(0, 155),
    alternates: { canonical: `/s/${leadSlug}/locations/${slug}` },
  };
}

export default async function LocationServicePage({ params }: { params: Promise<{ leadSlug: string; slug: string }> }) {
  const { leadSlug, slug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();
  if ((!result.payload.innerPagesBuilt || !result.payload.fullSiteBuilt) && !(await isAdminSession())) redirect(`/s/${leadSlug}`);

  const { payload } = result;
  const section = payload.locationServices.find((s) => s.slug === slug);
  if (!section) notFound();

  const breadcrumb = breadcrumbSchema(leadSlug, payload.businessName, [{ name: section.h2, path: `/locations/${slug}` }]);
  const service_schema = serviceSchema({
    serviceName: section.h2,
    businessName: payload.businessName,
    phone: payload.nap.phone,
    address: payload.nap.address,
  });

  return (
    <div style={siteRootStyle(payload)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(service_schema) }} />
      <BespokeNav payload={payload} spec={payload.chromeSpec} />
      <LocationServiceTemplate payload={payload} section={section} />
      <BespokeFooter payload={payload} spec={payload.chromeSpec} />
    </div>
  );
}
