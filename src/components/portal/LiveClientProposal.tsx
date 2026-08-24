"use client";

import { useState } from "react";
import type { SitePayload } from "@/components/site-shell/types";
import type { Lead, Artifact, ScrapeResults } from "@/types/database";
import { ProposalHeader } from "@/components/portal/sections/ProposalHeader";
import { ProposalProcessingSkeleton } from "@/components/portal/sections/ProposalProcessingSkeleton";
import { PendingAutoRefresh } from "@/components/portal/PendingAutoRefresh";
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
import { SocialLaunchMockup } from "@/components/mockup/SocialLaunchMockup";
import { extractMockupData } from "@/lib/mockup-data";
import { CrispChat } from "@/components/CrispChat";

interface LiveClientProposalProps {
  lead: Lead;
  payload: SitePayload;
  scrapeResults: ScrapeResults | null;
  artifact: Artifact | null;
}

export function LiveClientProposal({
  lead,
  payload,
  scrapeResults,
  artifact,
}: LiveClientProposalProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const businessName = lead.business_name || payload.businessName || "Your Business";
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
  const setupPrice = typeof pricingData.setupPrice === "number" ? pricingData.setupPrice : 779;
  const monthlyPrice = typeof pricingData.monthlyPrice === "number" ? pricingData.monthlyPrice : 99;
  const standardValue = typeof pricingData.standardValue === "number" ? pricingData.standardValue : 1897;
  const discountLabel =
    pricingData.discountLabel ||
    (setupPrice === 0 ? "$0 Setup · Monthly Plan" : "Custom Client Proposal");

  const priceFormattedLabel =
    setupPrice === 0 && monthlyPrice > 0
      ? `$0 Setup · $${monthlyPrice}/mo`
      : setupPrice > 0 && monthlyPrice > 0
      ? `$${setupPrice} setup · $${monthlyPrice}/mo`
      : `$${setupPrice}`;

  const scopeItems = Array.isArray(pricingData.scopeItems) && pricingData.scopeItems.length > 0
    ? pricingData.scopeItems.filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0)
    : [
        `Custom homepage redesign for ${businessName}`,
        `${artifact?.funnel_pages.filter((page) => page.kind === "service").length || 1} service pages based on your real offerings`,
        "Lead capture, click-to-call, and callback flow",
        "LocalBusiness schema and technical SEO foundation",
        "Domain connection and 2-4 week launch support",
        "100% client-owned website files",
      ];

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
      <ProposalHeader businessName={businessName} isPaid={isPaid} isApproved={isApproved} />

      {!isApproved && !isPaid && (
        <>
          <ProposalProcessingSkeleton businessName={businessName} />
          <PendingAutoRefresh intervalMs={4000} />
        </>
      )}

      <main className={`mx-auto max-w-5xl px-6 py-12 space-y-16 transition duration-500 ${!isApproved && !isPaid ? "blur-md opacity-40 pointer-events-none select-none" : ""}`}>
        <ProposalHero
          businessName={businessName}
          address={address}
          rating={rating}
          reviewCount={reviewCount}
          leadSlug={lead.slug}
          isPaid={isPaid}
          priceFormattedLabel={priceFormattedLabel}
          onOpenCheckout={() => setShowCheckout(true)}
        />

        {/* 3D Website Redesign Showcase Mockup */}
        <section className="flex flex-col items-center space-y-6">
          <div className="text-center max-w-xl space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#533afd]">
              High-Converting Modern Redesign
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#0d1738]">
              Your Brand, Elevated to Category Leader
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              A bespoke, lightning-fast digital storefront engineered to convert local search visitors into qualified phone calls and bookings.
            </p>
          </div>

          <div className="w-full flex justify-center py-2">
            <SocialLaunchMockup
              data={mockupData}
              showControls={false}
              className="w-full max-w-[620px]"
            />
          </div>
        </section>

        <ProposalAbout data={mockupData} />

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
          standardValue={standardValue}
          scopeItems={scopeItems}
          audit={report.audit}
        />

        <ProposalDecisionBox
          businessName={businessName}
          setupPrice={setupPrice}
          monthlyPrice={monthlyPrice}
          priceFormattedLabel={priceFormattedLabel}
          isPaid={isPaid}
          launchSteps={launchSteps}
          onOpenCheckout={() => setShowCheckout(true)}
        />

        {showCheckout && (
          <ProposalCheckoutModal
            businessName={businessName}
            discountLabel={discountLabel}
            standardValue={standardValue}
            setupPrice={setupPrice}
            monthlyPrice={monthlyPrice}
            priceFormattedLabel={priceFormattedLabel}
            scopeItems={scopeItems}
            checkoutLoading={checkoutLoading}
            onClose={() => setShowCheckout(false)}
            onCheckout={handleCheckout}
          />
        )}
      </main>

      <ProposalFooter />
      <CrispChat />
    </div>
  );
}
