export const runtime = "edge";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { BespokeNav } from "@/components/site-shell/BespokeNav";
import { BespokeFooter } from "@/components/site-shell/BespokeFooter";
import { BespokePageBody } from "@/components/site-shell/BespokePage";
import { siteRootStyle } from "@/components/site-shell/shell-style";
import { breadcrumbSchema } from "@/lib/seo/breadcrumb-schema";
import { isAdminSession } from "@/lib/is-admin-session";

export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string; slug: string }> }): Promise<Metadata> {
  const { leadSlug, slug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result || !result.payload.innerPagesBuilt || !result.payload.bespokePages[`areas/${slug}`]) return {};
  const area = result.payload.areas.find((a) => a.slug === slug);
  if (!area) return {};
  return {
    title: `${area.h2} Service Area | ${result.payload.businessName}`,
    description: `${result.payload.businessName} serves customers in ${area.h2}. Explore verified services and request the next step.`,
    alternates: { canonical: `/s/${leadSlug}/areas/${slug}` },
  };
}

export default async function AreaPage({ params, searchParams }: { params: Promise<{ leadSlug: string; slug: string }>; searchParams: Promise<{ view?: string }> }) {
  const { leadSlug, slug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();
  const isAdmin = await isAdminSession();
  const pageHtml = result.payload.bespokePages[`areas/${slug}`];
  if ((!result.payload.innerPagesBuilt || !pageHtml) && !isAdmin) redirect(`/s/${leadSlug}#areas`);

  const payload = { ...result.payload, previewMode: (await searchParams).view === "preview" };
  const area = payload.areas.find((a) => a.slug === slug);
  if (!area) notFound();

  const breadcrumb = breadcrumbSchema(leadSlug, payload.businessName, [{ name: area.h2, path: `/areas/${slug}` }]);

  return (
    <div style={siteRootStyle(payload)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <BespokeNav payload={payload} spec={payload.chromeSpec} />
      {pageHtml ? <BespokePageBody html={pageHtml} css={payload.bespokeCss} leadSlug={payload.leadSlug} /> : null}
      <BespokeFooter payload={payload} spec={payload.chromeSpec} />
    </div>
  );
}
