import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MapPin, ArrowRight } from "lucide-react";
import { getSiteData } from "@/lib/get-site-data";
import { BespokeNav } from "@/components/site-shell/BespokeNav";
import { BespokeFooter } from "@/components/site-shell/BespokeFooter";
import { PageHeroBand } from "@/components/site-shell/pages/PageHeroBand";
import { siteRootStyle } from "@/components/site-shell/shell-style";
import { breadcrumbSchema } from "@/lib/seo/breadcrumb-schema";
import { isAdminSession } from "@/lib/is-admin-session";

// v4 -- rewritten. `payload.areas` entries are now real area *names*
// (extracted directly from scraped text, no AI generation), not
// standalone generated pages -- there's no per-area body_content to
// render on its own. Real content for an area comes from aggregating its
// matching location-service combo pages (slug format
// "<service-slug>--<area-slug>", built by enrich-expand.ts), so this page
// genuinely needs fullSiteBuilt, not just innerPagesBuilt: the area name
// itself is visible/linkable from the moment of the fast pass (Where We
// Work badges, footer), but real content here only exists once expansion
// has actually run.
export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string; slug: string }> }): Promise<Metadata> {
  const { leadSlug, slug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result || !result.payload.innerPagesBuilt || !result.payload.fullSiteBuilt) return {};
  const area = result.payload.areas.find((a) => a.slug === slug);
  if (!area) return {};
  return {
    title: `${area.h2} Roofing & Home Services | ${result.payload.businessName}`,
    description: `Real services ${result.payload.businessName} offers in ${area.h2}.`,
    alternates: { canonical: `/s/${leadSlug}/areas/${slug}` },
  };
}

export default async function AreaPage({ params }: { params: Promise<{ leadSlug: string; slug: string }> }) {
  const { leadSlug, slug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();
  const isAdmin = await isAdminSession();
  if ((!result.payload.innerPagesBuilt || !result.payload.fullSiteBuilt) && !isAdmin) redirect(`/s/${leadSlug}#${slug}`);

  const { payload } = result;
  const area = payload.areas.find((a) => a.slug === slug);
  if (!area) notFound();

  const matches = payload.locationServices.filter((ls) => ls.slug.endsWith(`--${slug}`));
  const breadcrumb = breadcrumbSchema(leadSlug, payload.businessName, [{ name: area.h2, path: `/areas/${slug}` }]);

  return (
    <div style={siteRootStyle(payload)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <BespokeNav payload={payload} spec={payload.chromeSpec} />
      <PageHeroBand
        eyebrow="Service area"
        title={`Serving ${area.h2}`}
        subhead={`Real services ${payload.businessName} offers in ${area.h2}.`}
      />
      <section className="mx-auto max-w-4xl px-6 py-16">
        {matches.length > 0 ? (
          <div className="divide-y divide-border rounded-xl border border-border shadow-card">
            {matches.map((m) => (
              <a
                key={m.slug}
                href={payload.innerPagesBuilt ? `/s/${payload.leadSlug}/locations/${m.slug}` : `#${m.slug}`}
                className="flex items-center justify-between gap-4 p-5 hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 shrink-0 text-primary" />
                  <span className="font-medium">{m.h2}</span>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            {payload.businessName} proudly serves {area.h2} — call {payload.nap.phone ?? "us"} for details on services available in your area.
          </p>
        )}
      </section>
      <BespokeFooter payload={payload} spec={payload.chromeSpec} />
    </div>
  );
}
