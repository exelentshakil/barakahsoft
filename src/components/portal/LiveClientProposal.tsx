"use client";

import { useState } from "react";
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
  const isApproved =
    artifact?.qa_status === "approved" ||
    ["qa_approved", "ready", "delivered", "paid", "live"].includes(lead.status);

  // Dynamic Pricing from Admin Configuration
  const pricingData = (artifact?.extracted_assets?.pricing as any) ?? {};
  const setupPrice = typeof pricingData.setupPrice === "number" ? pricingData.setupPrice : 797;
  const monthlyPrice = typeof pricingData.monthlyPrice === "number" ? pricingData.monthlyPrice : 0;
  const standardValue = typeof pricingData.standardValue === "number" ? pricingData.standardValue : 1597;
  const discountLabel =
    pricingData.discountLabel ||
    (setupPrice === 0 ? "$0 Setup · Monthly Plan" : "Custom Client Proposal");

  const priceFormattedLabel =
    setupPrice === 0 && monthlyPrice > 0
      ? `$0 Setup · $${monthlyPrice}/mo`
      : setupPrice > 0 && monthlyPrice > 0
      ? `$${setupPrice} Setup + $${monthlyPrice}/mo`
      : `$${setupPrice}`;

  const launchSteps = [
    { label: "Payment received", complete: isPaid, detail: "Stripe checkout confirmed" },
    { label: "Human QA review", complete: isApproved, detail: isApproved ? "Approved by the BarakahSoft team" : "Final fact and conversion review" },
    { label: "Domain connection", complete: Boolean(lead.custom_domain), detail: lead.custom_domain || "Domain details will be confirmed with you" },
    { label: "Website live", complete: Boolean(lead.live_at) || lead.status === "live", detail: lead.live_at ? "Live on the connected domain" : "Follows QA and domain setup" },
  ];

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
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Redirecting to secure Stripe checkout...");
      }
    } catch {
      alert("Redirecting to checkout session...");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#0d1738] font-sans antialiased relative">
      <ProposalHeader businessName={businessName} isPaid={isPaid} isApproved={isApproved} />

      {!isApproved && !isPaid && <ProposalProcessingSkeleton businessName={businessName} />}

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
          discountLabel={discountLabel}
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
            checkoutLoading={checkoutLoading}
            onClose={() => setShowCheckout(false)}
            onCheckout={handleCheckout}
          />
        )}
      </main>

      <ProposalFooter />
    </div>
  );
}
