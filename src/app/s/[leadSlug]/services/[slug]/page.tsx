import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { SectionRenderer } from "@/components/site-shell/SectionRenderer";
import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { getShellStyle } from "@/components/site-shell/shell-style";

// Generic route — one file handles every service slug via params.slug.
// The only thing payment changes (plan §6): this route 404s pre-payment
// so there's no indexable URL to leak, even though the same content is
// already visible as a homepage anchor. inner_pages_built flips this open;
// no content is regenerated, it's the exact same funnel_pages entry.
export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string; slug: string }> }): Promise<Metadata> {
  const { leadSlug, slug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result || !result.payload.innerPagesBuilt) return {};
  const service = result.payload.services.find((s) => s.slug === slug);
  if (!service) return {};
  return {
    title: `${service.h2} | ${result.payload.businessName}`,
    description: service.body_content.slice(0, 155),
    alternates: { canonical: `/s/${leadSlug}/services/${slug}` },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ leadSlug: string; slug: string }> }) {
  const { leadSlug, slug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();
  if (!result.payload.innerPagesBuilt) redirect(`/s/${leadSlug}#${slug}`);

  const { payload } = result;
  const service = payload.services.find((s) => s.slug === slug);
  if (!service) notFound();

  return (
    <div style={getShellStyle(payload)}>
      <MegaMenu payload={payload} />
      <SectionRenderer section={service} standalone />
      <PremiumFooter payload={payload} />
    </div>
  );
}
