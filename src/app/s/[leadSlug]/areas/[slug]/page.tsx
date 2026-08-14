import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { SectionRenderer } from "@/components/site-shell/SectionRenderer";
import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";

// Same mechanism as services/[slug] — see that file's comment for why
// payment only flips a boolean gate rather than regenerating content.
export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string; slug: string }> }): Promise<Metadata> {
  const { leadSlug, slug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result || !result.payload.innerPagesBuilt) return {};
  const area = result.payload.areas.find((a) => a.slug === slug);
  if (!area) return {};
  return {
    title: `${area.h2} | ${result.payload.businessName}`,
    description: area.body_content.slice(0, 155),
    alternates: { canonical: `/s/${leadSlug}/areas/${slug}` },
  };
}

export default async function AreaPage({ params }: { params: Promise<{ leadSlug: string; slug: string }> }) {
  const { leadSlug, slug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();
  if (!result.payload.innerPagesBuilt) redirect(`/s/${leadSlug}#${slug}`);

  const { payload } = result;
  const area = payload.areas.find((a) => a.slug === slug);
  if (!area) notFound();

  return (
    <>
      <MegaMenu payload={payload} />
      <SectionRenderer section={area} standalone />
      <PremiumFooter payload={payload} />
    </>
  );
}
