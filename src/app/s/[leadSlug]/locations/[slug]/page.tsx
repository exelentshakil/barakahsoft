import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { LocationServiceTemplate } from "@/components/site-shell/pages/LocationServiceTemplate";
import { getShellStyle } from "@/components/site-shell/shell-style";

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
  if (!result.payload.innerPagesBuilt || !result.payload.fullSiteBuilt) redirect(`/s/${leadSlug}`);

  const { payload } = result;
  const section = payload.locationServices.find((s) => s.slug === slug);
  if (!section) notFound();

  return (
    <div style={getShellStyle(payload)}>
      <MegaMenu payload={payload} />
      <LocationServiceTemplate payload={payload} section={section} />
      <PremiumFooter payload={payload} />
    </div>
  );
}
