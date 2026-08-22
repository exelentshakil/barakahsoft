import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { PremiumLeadHomepage } from "@/components/site-shell/PremiumLeadHomepage";
import { LiveClientProposal } from "@/components/portal/LiveClientProposal";
import { isAdminSession } from "@/lib/is-admin-session";
import { verifyPortalToken } from "@/lib/portal-token";

// THE homepage — one crawlable document. Every service/area gets a #slug
// mega-menu anchor here pre-payment; title/meta/canonical/FAQPage/
// LocalBusiness JSON-LD all point at this one URL, exactly per plan §6's
// "Google indexes one document" requirement. Hash fragments are never
// canonicalized as separate pages.
export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string }> }): Promise<Metadata> {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) return {};

  const { payload } = result;
  const town = payload.nap.address?.split(",").slice(-3, -2)[0]?.trim();
  const title = town ? `${payload.headline} | ${payload.businessName}` : payload.businessName;

  return {
    title,
    description: payload.subhead || payload.differentiator || undefined,
    alternates: { canonical: `/s/${leadSlug}` },
  };
}

export default async function LeadSitePage({
  params,
  searchParams,
}: {
  params: Promise<{ leadSlug: string }>;
  searchParams?: Promise<{ view?: string; auth?: string }>;
}) {
  const { leadSlug } = await params;
  const sParams = searchParams ? await searchParams : {};
  const result = await getSiteData(leadSlug);
  if (!result) notFound();

  const { payload, lead, scrapeResults, artifact } = result;
  const operator = await isAdminSession();
  const authorized = operator || verifyPortalToken(sParams.auth, lead.id);

  if (!authorized && sParams.view !== "preview") {
    return notFound();
  }

  // If viewing the direct website preview
  if (sParams.view === "preview") {
    if (!operator && !authorized && lead.status !== "paid" && lead.status !== "live" && lead.status !== "qa_approved" && lead.status !== "delivered") {
      return notFound();
    }
    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: payload.businessName,
      telephone: payload.nap.phone ?? undefined,
      email: payload.nap.email ?? undefined,
      address: payload.nap.address ?? undefined,
      sameAs: payload.socialUrls.length > 0 ? payload.socialUrls : undefined,
      aggregateRating:
        payload.proof.rating && payload.proof.reviewCount
          ? { "@type": "AggregateRating", ratingValue: payload.proof.rating, reviewCount: payload.proof.reviewCount }
          : undefined,
    };

    const faqSchema =
      payload.faq.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: payload.faq.map((f) => ({
              "@type": "Question",
              name: f.h2,
              acceptedAnswer: { "@type": "Answer", text: f.body_content },
            })),
          }
        : null;

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
        {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
        <PremiumLeadHomepage payload={payload} />
      </>
    );
  }

  // By default, render the full interactive Master Proposal & Website X-Ray!
  return (
    <LiveClientProposal
      lead={lead}
      payload={payload}
      scrapeResults={scrapeResults}
      artifact={artifact}
    />
  );
}
