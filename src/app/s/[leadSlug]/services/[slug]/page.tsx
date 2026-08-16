import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { ServiceDetailTemplate } from "@/components/site-shell/pages/ServiceDetailTemplate";
import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { getShellStyle } from "@/components/site-shell/shell-style";
import { breadcrumbSchema, serviceSchema } from "@/lib/seo/breadcrumb-schema";

// Generic route — one file handles every service slug via params.slug.
// The only thing payment changes (plan §6): this route 404s pre-payment
// so there's no indexable URL to leak, even though the same content is
// already visible as a homepage anchor. inner_pages_built flips this open;
// no content is regenerated, it's the exact same funnel_pages entry —
// though it may since v3 gain long_body_content once enrich-expand.ts has
// run (ServiceDetailTemplate falls back to the short body_content when not).
export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string; slug: string }> }): Promise<Metadata> {
  const { leadSlug, slug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result || !result.payload.innerPagesBuilt) return {};
  const service = result.payload.services.find((s) => s.slug === slug);
  if (!service) return {};
  return {
    title: `${service.h2} | ${result.payload.businessName}`,
    description: (service.long_body_content ?? service.body_content).slice(0, 155),
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

  const breadcrumb = breadcrumbSchema(leadSlug, payload.businessName, [{ name: service.h2, path: `/services/${slug}` }]);
  const service_schema = serviceSchema({
    serviceName: service.h2,
    businessName: payload.businessName,
    phone: payload.nap.phone,
    address: payload.nap.address,
  });

  return (
    <div style={getShellStyle(payload)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(service_schema) }} />
      <MegaMenu payload={payload} />
      <ServiceDetailTemplate payload={payload} service={service} />
      <PremiumFooter payload={payload} />
    </div>
  );
}
