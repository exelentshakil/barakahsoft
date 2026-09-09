import type { Tenant } from "@/tenants/types";
"use client";

import { useState, useEffect } from "react";
import type { SitePayload } from "@/components/site-shell/types";
import type { Lead, Artifact, ScrapeResults } from "@/types/database";
import { ProposalHeader } from "@/components/portal/sections/ProposalHeader";
import { ProposalProcessingSkeleton } from "@/components/portal/sections/ProposalProcessingSkeleton";
import { ProposalHero } from "@/components/portal/sections/ProposalHero";
import { ReportAudit } from "@/components/portal/sections/ReportAudit";
import { ReportVisibility } from "@/components/portal/sections/ReportVisibility";
import { ReportCompetitors } from "@/components/portal/sections/ReportCompetitors";
import { buildReportModules } from "@/lib/report-modules";
import { ProposalPricingSection } from "@/components/portal/sections/ProposalPricingSection";
import { ProposalDecisionBox } from "@/components/portal/sections/ProposalDecisionBox";
import { ProposalCheckoutModal } from "@/components/portal/sections/ProposalCheckoutModal";
import { ProposalFooter } from "@/components/portal/sections/ProposalFooter";
import { ProposalAbout } from "@/components/portal/sections/ProposalAbout";
import { ProposalWebsitePreview } from "@/components/portal/sections/ProposalWebsitePreview";
import { ReportBrandIdentity } from "@/components/portal/sections/ReportBrandIdentity";
import { SocialLaunchMockup } from "@/components/mockup/SocialLaunchMockup";
import { extractMockupData } from "@/lib/mockup-data";
import { buildOfferOptions, type OfferOption } from "@/lib/audit/lead-value";
import { CrispChat } from "@/components/CrispChat";
import { trackPixelEvent } from "@/lib/meta-pixel";

interface LiveClientProposalProps {
  lead: Lead;
  payload: SitePayload;
  scrapeResults: ScrapeResults | null;
  artifact: Artifact | null;
  /** True only for an allowlisted operator session; gates internal controls. */
  isOperator?: boolean;
  /**
   * Whose proposal this is.
   *
   * Resolved on the server and passed down rather than looked up here: the
   * tenant registry reads server-only environment variables, which would be
   * undefined in a client bundle and silently fall back to the platform's
   * defaults — a partner's prospect reading BarakahSoft's address.
   */
  tenant: Tenant;
}

export function LiveClientProposal({
  lead,
  payload,
  scrapeResults,
  artifact,
  isOperator = false,
  tenant,
}: LiveClientProposalProps) {
  useEffect(() => {
    if (isOperator) return;

    // A prospect opening their own rebuilt homepage is the warmest audience
    // this business can assemble, and until now Meta never heard about it.
    // The root layout fires a bare PageView here, which is indistinguishable
    // from marketing-site traffic and cannot be built into an audience worth
    // having. ViewContent names the lead, and the same id goes to the server
    // so the Pixel and CAPI copies dedupe into one event.
    const eventId = crypto.randomUUID();
    trackPixelEvent("ViewContent", eventId, {
      content_name: lead.slug,
      content_category: "proposal_view",
    });

    fetch(`/api/s/${lead.slug}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "proposal_view", path: window.location.pathname, event_id: eventId }),
    }).catch(() => {});
  }, [isOperator, lead.slug]);

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const businessName = lead.business_name || payload.businessName || "Your Business";
  const facts = (scrapeResults?.facts ?? {}) as Record<string, unknown>;
  // No invented fallbacks. A placeholder phone number or rating shown to a
  // client as their own is worse than showing nothing — the previous
  // defaults put a stranger's phone number and a made-up review count on
  // every proposal where the real ones were missing.
  const phone = payload.nap.phone || lead.phone || null;
  const address = payload.nap.address || null;
  const rating = payload.proof.rating ? String(payload.proof.rating) : null;
  const reviewCount = payload.proof.reviewCount ? `${payload.proof.reviewCount}` : null;

  // Modules render only where real measurements exist.
  const report = buildReportModules(lead, scrapeResults);

  const isPaid = Boolean(lead.paid_at) || lead.status === "paid" || lead.status === "live";

  // "ready" was on this list and must never be: scrape-run sets it the
  // moment analysis finishes, where it means "ready for the operator to
  // build", not "reviewed and fit to send". So the instant a lead was
  // scraped its portal unblurred and showed the client a full proposal --
  // pricing, report and all -- around a site nobody had built or checked.
  //
  // Approval is the human gate. Only qa_approved and the states after it
  // count, plus the artifact's own qa_status.
  const isApproved =
    artifact?.qa_status === "approved" ||
    ["qa_approved", "delivered", "paid", "live"].includes(lead.status);

  // Dynamic Pricing from Admin Configuration
  const pricingData = (artifact?.extracted_assets?.pricing as any) ?? {};
  const leadValue = (facts.lead_value as { offers?: OfferOption[]; suggested?: { offerId?: OfferOption["id"] } } | undefined) ?? null;
  const servicePageCount = artifact?.funnel_pages.filter((page) => page.kind === "service").length ?? 0;
  const corePageCount = Math.max(5, Math.min(20, 1 + servicePageCount));
  const offers: OfferOption[] = Array.isArray(pricingData.offerOptions) && pricingData.offerOptions.length > 0
    ? pricingData.offerOptions
    : leadValue?.offers ?? buildOfferOptions(corePageCount, businessName);
  const recommendedOfferId = (pricingData.offerId as OfferOption["id"] | undefined) ?? leadValue?.suggested?.offerId ?? "growth";
  const recommendedOffer = offers.find((offer) => offer.id === recommendedOfferId) ?? offers[1];
  const pricingIsConfigured = typeof pricingData.offerId === "string" || (Array.isArray(pricingData.offerOptions) && pricingData.offerOptions.length > 0);
  const [selectedOfferId, setSelectedOfferId] = useState<OfferOption["id"]>(recommendedOfferId);
  const selectedOffer = offers.find((offer) => offer.id === selectedOfferId) ?? recommendedOffer;
  const setupPrice = selectedOffer.setupPrice;
  const monthlyPrice = selectedOffer.monthlyPrice;
  const priceFormattedLabel =
    setupPrice === 0 && monthlyPrice > 0
      ? `$0 Setup · $${monthlyPrice}/mo`
      : setupPrice > 0 && monthlyPrice > 0
      ? `$${setupPrice} setup · $${monthlyPrice}/mo`
      : `$${setupPrice}`;
  const scopeItems = selectedOffer.scopeItems;
  const diagnosedGaps = report.audit?.findings.slice(0, 3).map((finding) => finding.title).join(", ") || "the measured website and visibility gaps";
  const offerSummary = offers.map((offer) => `${offer.label}: $${offer.setupPrice}${offer.monthlyPrice > 0 ? ` + $${offer.monthlyPrice}/mo` : " one time"}`).join("; ");
  const chatContext = `Hi BarakahSoft, I am reviewing the proposal for ${businessName}. I would like to discuss the ${selectedOffer.label} option (${setupPrice > 0 ? `$${setupPrice} one time` : "no setup"}${monthlyPrice > 0 ? ` + $${monthlyPrice}/mo` : ""}). Please help me choose between the four launch paths: ${offerSummary}. The main gaps identified were: ${diagnosedGaps}. Website: ${lead.source_url}`;

  const launchSteps = [
    { label: "Payment received", complete: isPaid, detail: "Stripe checkout confirmed" },
    { label: "Human QA review", complete: isApproved, detail: isApproved ? "Approved by the BarakahSoft team" : "Final fact and conversion review" },
    { label: "Domain connection", complete: Boolean(lead.custom_domain), detail: lead.custom_domain || "Domain details will be confirmed with you" },
    { label: "Website live", complete: Boolean(lead.live_at) || lead.status === "live", detail: lead.live_at ? "Live on the connected domain" : "Follows QA and domain setup" },
  ];

  const mockupData = extractMockupData({
    lead,
    artifact,
    scrapeResults,
    payload,
    isPaid,
  });

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
          tier: monthlyPrice > 0 ? "hosting" : "website",
          offer_id: selectedOffer.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      // Both failure paths used to say "redirecting to checkout" and then
      // do nothing, so a client trying to pay was told it was working while
      // it was not. Telling them to get in touch is the honest version, and
      // it keeps the sale alive.
      if (!res.ok || !data.url) {
        alert("We could not open the payment page just now. Please get in touch and we will send you a payment link directly.");
        return;
      }
      window.location.href = data.url;
    } catch {
      alert("We could not reach the payment page. Please check your connection and try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#0d1738] font-sans antialiased relative">
      <ProposalHeader businessName={businessName} isPaid={isPaid} isApproved={isApproved} tenant={tenant} />

      {!isApproved && !isPaid && (
        <>
          <ProposalProcessingSkeleton businessName={businessName} />
        </>
      )}

      <main className={`mx-auto max-w-7xl px-4 sm:px-8 py-12 space-y-16 transition duration-500 ${!isApproved && !isPaid ? "blur-md opacity-40 pointer-events-none select-none" : ""}`}>
        <ProposalHero
          businessName={businessName}
          address={address}
          rating={rating}
          reviewCount={reviewCount}
          leadSlug={lead.slug}
          isPaid={isPaid}
          chatContext={chatContext}
          mockupData={mockupData}
        />

        <ProposalAbout data={mockupData} />

        {/* Interactive Responsive Website Preview (Desktop / Mobile + Current Site Comparison) */}
        <ProposalWebsitePreview
          businessName={businessName}
          leadSlug={lead.slug}
          sourceUrl={lead.source_url}
          isOperator={isOperator}
          leadId={lead.id}
          showcaseBeforeUrl={lead.showcase_before_url}
          showcaseAfterUrl={lead.showcase_after_url}
          showcaseApproved={lead.showcase_approved}
          showcaseLabel={lead.showcase_label}
        />

        {/* Brand Identity & Visual DNA audit (with integrated 3D mockup) */}
        <ReportBrandIdentity
          businessName={businessName}
          branding={(facts.branding as any) ?? null}
          brandColorHex={payload.brandColorHsl || (facts.brand_color_hex as string) || null}
          logoUrl={payload.logoUrl}
          fontFamily={payload.fontFamily}
          designTokens={payload.designTokens}
          services={payload.services.map((s) => s.h2)}
          areas={payload.areas.map((a) => a.h2)}
          painPoints={lead.pain_points}
          speedScore={report.audit?.speedScore ?? (typeof scrapeResults?.pagespeed_mobile?.score === "number" ? scrapeResults.pagespeed_mobile.score : null)}
          mockupNode={
            <SocialLaunchMockup
              data={mockupData}
              showControls={false}
              className="w-full"
            />
          }
        />

        {/* Modules render only when there is measured data behind them AND
            they apply to this kind of business. A national agency does not
            see a local search grid, and an empty panel is never shown — the
            report is shorter for some businesses because less applies, not
            because it is thin. */}
        {report.audit && <ReportAudit audit={report.audit} businessName={businessName} />}

        {report.visibility && (
          <ReportVisibility
            cells={report.visibility.cells}
            visible={report.visibility.visible}
            missing={report.visibility.missing}
            dominant={report.visibility.dominant}
            businessName={businessName}
          />
        )}

        {report.competitors && (
          <ReportCompetitors rows={report.competitors.rows} query={report.competitors.query} />
        )}

        <ProposalPricingSection
          businessName={businessName}
          setupPrice={setupPrice}
          monthlyPrice={monthlyPrice}
          scopeItems={scopeItems}
          audit={report.audit}
          offers={offers}
          recommendedOfferId={recommendedOfferId}
          selectedOfferId={selectedOffer.id}
          onSelectOffer={setSelectedOfferId}
        />

        <ProposalDecisionBox
          businessName={businessName}
          setupPrice={setupPrice}
          monthlyPrice={monthlyPrice}
          priceFormattedLabel={priceFormattedLabel}
          isPaid={isPaid}
          launchSteps={launchSteps}
          onOpenCheckout={() => setShowCheckout(true)}
          chatContext={chatContext}
          brandName={tenant.brand.name}
          phoneDisplay={tenant.brand.phoneDisplay}
          phoneE164={tenant.brand.phoneE164}
          commerceMode={tenant.commerce.mode}
          primaryActionLabel={tenant.commerce.primaryActionLabel ?? "Start my selected plan"}
          hasChat={Boolean(tenant.brand.analytics?.crispId)}
        />

        {showCheckout && (
          <ProposalCheckoutModal
            businessName={businessName}
            setupPrice={setupPrice}
            monthlyPrice={monthlyPrice}
            priceFormattedLabel={priceFormattedLabel}
            scopeItems={scopeItems}
            checkoutLoading={checkoutLoading}
            commerceMode={tenant.commerce.mode}
            legalEntity={tenant.brand.legalEntity}
            primaryActionLabel={tenant.commerce.primaryActionLabel ?? "Start my selected plan"}
            onEnquiry={async (input) => {
              await fetch(`/api/s/${lead.slug}/purchase-enquiry`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
              });
            }}
            onClose={() => setShowCheckout(false)}
            onCheckout={handleCheckout}
          />
        )}
      </main>

      <ProposalFooter tenant={tenant} />
      <CrispChat websiteId={tenant.brand.analytics?.crispId} />
    </div>
  );
}
