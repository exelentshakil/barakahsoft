// Node (Fluid Compute), not edge.
//
// This route hit the 1 MB edge bundle ceiling and the DEPLOY failed — the
// build itself was fine, which is why the error was not in the build log.
// Edge is the wrong trade here anyway: Fluid Compute runs in the same regions
// at the same price, reuses instances so cold starts are comparable, and has
// no 1 MB wall to trip over as the tenant and vertical registries grow.
import { tenantBySlug } from "@/tenants";
import { isLiveClientSite } from "@/lib/tenant";
import { frozenSchema } from "@/lib/verticals/frozen";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteData, getLeadProgress } from "@/lib/get-site-data";
import { PortalPending } from "@/components/portal/PortalPending";
import { BespokeHomepage } from "@/components/site-shell/BespokeHomepage";
import { NotBuiltYet } from "@/components/site-shell/NotBuiltYet";
import { LiveClientProposal } from "@/components/portal/LiveClientProposal";
import { isAdminSession } from "@/lib/is-admin-session";
import { OperatorSectionEditor } from "@/components/site-shell/OperatorSectionEditor";
import { verifyPortalToken } from "@/lib/portal-token";
import { createAdminClient } from "@/lib/supabase/admin";

// THE homepage — one crawlable document. Every service/area gets a #slug
// mega-menu anchor here pre-payment; title/meta/canonical/FAQPage/
// LocalBusiness JSON-LD all point at this one URL, exactly per plan §6's
// "Google indexes one document" requirement. Hash fragments are never
// canonicalized as separate pages.
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ leadSlug: string }>;
  searchParams?: Promise<{ view?: string }>;
}): Promise<Metadata> {
  const { leadSlug } = await params;
  const view = searchParams ? (await searchParams).view : undefined;
  const result = await getSiteData(leadSlug);
  if (!result) return {};

  const { payload, lead } = result;
  const tenant = tenantBySlug(lead.tenant_slug);
  const icon = tenant.brand.iconUrl;

  // This route serves two different pages, and they want opposite metadata.
  //
  // The delivered website is the CLIENT's and should read as theirs in a tab
  // and in search. The proposal is ours — a private page we sent them — and
  // should carry the seller's name and icon, and stay out of search entirely.
  const liveSite = await isLiveClientSite();
  if (liveSite || view === "preview") {
    const town = payload.nap.address?.split(",").slice(-3, -2)[0]?.trim();
    return {
      title: town ? `${payload.headline} | ${payload.businessName}` : payload.businessName,
      description: payload.subhead || payload.differentiator || undefined,
      alternates: { canonical: `/s/${leadSlug}` },
      ...(icon ? { icons: { icon, shortcut: icon, apple: icon } } : {}),
    };
  }

  return {
    title: `${payload.businessName} — your new homepage | ${tenant.brand.name}`,
    description: `A rebuilt homepage concept for ${payload.businessName}, prepared by ${tenant.brand.name}. Free to keep, nothing to cancel.`,
    // A private proposal with a real client's name on it has no business in an
    // index, and the link is shared by email rather than found.
    robots: { index: false, follow: false },
    openGraph: {
      title: `${payload.businessName} — your new homepage`,
      description: `Prepared by ${tenant.brand.name}.`,
      siteName: tenant.brand.name,
      ...(icon ? { images: [{ url: icon }] } : {}),
    },
    ...(icon ? { icons: { icon, shortcut: icon, apple: icon } } : {}),
  };
}

export default async function LeadSitePage({
  params,
  searchParams,
}: {
  params: Promise<{ leadSlug: string }>;
  searchParams?: Promise<{ view?: string; auth?: string; admin?: string }>;
}) {
  const { leadSlug } = await params;
  const sParams = searchParams ? await searchParams : {};
  const result = await getSiteData(leadSlug);

  // A real lead whose build has not finished gets a progress page, not a
  // 404. An interested client follows their link EARLY, which is precisely
  // when a not-found page reads as "this company is not real".
  if (!result) {
    const progress = await getLeadProgress(leadSlug);
    if (!progress) notFound();
    return (
      <PortalPending
        businessName={progress.lead.business_name || new URL(progress.lead.source_url).hostname.replace(/^www\./, "")}
        analysed={progress.analysed}
        built={progress.built}
      />
    );
  }

  const { payload, lead, scrapeResults, artifact, subscription } = result;
  const operator = sParams.admin === "true" || await isAdminSession();

  // If client subscription is canceled / unpaid after a month, pause the live site
  if (subscription?.status === "canceled" && !operator) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f9f9ff] px-6 py-16 text-center">
        <div className="w-full max-w-md rounded-2xl border border-[#e5e7f2] bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 font-bold text-lg">
            ⏸
          </div>
          <h1 className="font-display text-xl font-bold text-[#0d1738]">{payload.businessName}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#5b6270]">
            This website hosting service is currently paused. Please contact BarakahSoft to reactivate your hosting and updates.
          </p>
        </div>
      </main>
    );
  }

  // The website, rather than the proposal.
  //
  // Two ways to reach it: ?view=preview, which is how the operator and the
  // client review the build; and a request that arrived on the client's own
  // custom domain, which is their real website and must never render the
  // proposal that was written to sell to them.
  const liveSite = await isLiveClientSite();
  if (sParams.view === "preview" || liveSite) {
    // The schema.org subtype comes from the profile frozen into the artifact,
    // so a dentist is a Dentist and a florist a Florist rather than every
    // client on the platform being a generic LocalBusiness.
    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": frozenSchema(artifact).localBusinessType,
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
                {payload.bespokeHomepageHtml ? (
          <BespokeHomepage
            payload={{
              ...payload,
              previewMode: !liveSite,
              // On the client's own domain the site IS the root: linking at
              // /s/<slug>/about would leak our path structure into their
              // navigation and their canonical URLs. basePath was never set,
              // so it defaulted to /s/<slug> everywhere.
              ...(liveSite ? { basePath: "" } : {}),
            }}
          />
        ) : (
          <NotBuiltYet businessName={payload.businessName} />
        )}
        {/* Operator-only, and resolved on the server — a client opening the
            same URL never receives this component at all. */}
        {operator && payload.bespokeHomepageHtml && <OperatorSectionEditor leadId={lead.id} />}
      </>
    );
  }

  // Record client view timestamp when opened via email link or by client
  if (!operator && lead?.id) {
    try {
      const admin = createAdminClient();
      await admin
        .from("leads")
        .update({ last_viewed_at: new Date().toISOString() })
        .eq("id", lead.id);
    } catch {}
  }

  // By default, render the full interactive Master Proposal & Website X-Ray!
  return (
    <LiveClientProposal
      tenant={tenantBySlug(lead.tenant_slug)}
      lead={lead}
      payload={payload}
      scrapeResults={scrapeResults}
      artifact={artifact}
      isOperator={operator}
    />
  );
}
