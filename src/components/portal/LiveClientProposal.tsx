"use client";

import { useState } from "react";
import type { SitePayload } from "@/components/site-shell/types";
import type { Lead, Artifact, ScrapeResults } from "@/types/database";
import { ProposalHeader } from "@/components/portal/sections/ProposalHeader";
import { ProposalProcessingSkeleton } from "@/components/portal/sections/ProposalProcessingSkeleton";
import { ProposalHero } from "@/components/portal/sections/ProposalHero";
import { ProposalFrictionGrid } from "@/components/portal/sections/ProposalFrictionGrid";
import { ProposalGeoSnippets } from "@/components/portal/sections/ProposalGeoSnippets";
import { ProposalSpeedScorecard } from "@/components/portal/sections/ProposalSpeedScorecard";
import { ProposalMapMatrix } from "@/components/portal/sections/ProposalMapMatrix";
import { ProposalCompetitorRadar } from "@/components/portal/sections/ProposalCompetitorRadar";
import { ProposalPricingSection } from "@/components/portal/sections/ProposalPricingSection";
import { ProposalDecisionBox } from "@/components/portal/sections/ProposalDecisionBox";
import { ProposalCheckoutModal } from "@/components/portal/sections/ProposalCheckoutModal";
import { ProposalFooter } from "@/components/portal/sections/ProposalFooter";

const GOOGLE_PAA_QUESTIONS = [
  {
    q: "Do I need a city permit for high-value installation and upgrade work?",
    a: "Yes. Major residential and commercial work requires municipal permits & utility coordination. Your rebuilt site provides clear permit guidance and direct quote capture.",
    article: "Launch Article #1",
  },
  {
    q: "How fast can emergency repair dispatch be scheduled?",
    a: "Your team provides 24/7 priority emergency dispatch with a persistent 1-tap mobile call bar so customers never bounce to competitors.",
    article: "Launch Article #2",
  },
  {
    q: "How much does a commercial installation cost on average?",
    a: "Commercial installations vary based on project scale and capacity. Dedicated landing routes provide clear cost estimation forms.",
    article: "Launch Article #3",
  },
  {
    q: "What is the ROI of upgrading to high-efficiency equipment?",
    a: "Modern high-efficiency systems reduce utility costs by up to 65% while ensuring complete code compliance and warranty protection.",
    article: "Launch Article #4",
  },
];

const MAP_POINTS = [
  { id: 1, name: "Astoria North", rank: 14, competitor: "Local Competitor A", status: "missing" },
  { id: 2, name: "Astoria Ditmars", rank: 12, competitor: "Local Competitor A", status: "missing" },
  { id: 3, name: "Long Island City", rank: 18, competitor: "Citywide Power", status: "missing" },
  { id: 4, name: "Sunnyside", rank: 11, competitor: "Brightline Power", status: "missing" },
  { id: 5, name: "Woodside", rank: 8, competitor: "Brightline Power", status: "outside" },
  { id: 6, name: "Jackson Heights", rank: 3, competitor: "Your Business", status: "visible" },
  { id: 7, name: "East Elmhurst", rank: 15, competitor: "Metro Sparks", status: "missing" },
  { id: 8, name: "Corona Plaza", rank: 2, competitor: "Your Business", status: "visible" },
  { id: 9, name: "Flushing Main", rank: 1, competitor: "Your Business", status: "visible" },
  { id: 10, name: "Flushing Chinatown", rank: 2, competitor: "Your Business", status: "visible" },
  { id: 11, name: "Murray Hill", rank: 1, competitor: "Your Business", status: "visible" },
  { id: 12, name: "Broadway Station", rank: 1, competitor: "Your Business", status: "visible" },
  { id: 13, name: "Auburndale", rank: 1, competitor: "Your Business", status: "visible" },
  { id: 14, name: "Bayside West", rank: 1, competitor: "Your Business", status: "visible" },
  { id: 15, name: "Bayside Bell Blvd", rank: 1, competitor: "Your Business", status: "visible" },
  { id: 16, name: "Bay Terrace", rank: 2, competitor: "Your Business", status: "visible" },
  { id: 17, name: "Whitestone", rank: 1, competitor: "Your Business", status: "visible" },
  { id: 18, name: "Malba", rank: 5, competitor: "North Shore Pro", status: "outside" },
  { id: 19, name: "College Point", rank: 9, competitor: "Queens Light Co", status: "outside" },
  { id: 20, name: "Rego Park", rank: 16, competitor: "Citywide Power", status: "missing" },
  { id: 21, name: "Forest Hills 71st", rank: 14, competitor: "Citywide Power", status: "missing" },
  { id: 22, name: "Kew Gardens", rank: 19, competitor: "Metro Sparks", status: "missing" },
  { id: 23, name: "Richmond Hill", rank: 22, competitor: "South Queens Pro", status: "missing" },
  { id: 24, name: "Woodhaven", rank: 17, competitor: "South Queens Pro", status: "missing" },
  { id: 25, name: "Ozone Park", rank: 24, competitor: "Crossbay Electric", status: "missing" },
  { id: 26, name: "Howard Beach", rank: 15, competitor: "Crossbay Electric", status: "missing" },
  { id: 27, name: "Middle Village", rank: 11, competitor: "Apex Sparks", status: "missing" },
  { id: 28, name: "Glendale", rank: 13, competitor: "Apex Sparks", status: "missing" },
  { id: 29, name: "Ridgewood", rank: 20, competitor: "Border Pro", status: "missing" },
  { id: 30, name: "Maspeth", rank: 14, competitor: "Industrial Power", status: "missing" },
  { id: 31, name: "Fresh Meadows", rank: 4, competitor: "Northeast Pro", status: "outside" },
  { id: 32, name: "Oakland Gardens", rank: 6, competitor: "Northeast Pro", status: "outside" },
  { id: 33, name: "Little Neck", rank: 7, competitor: "Nassau Border Pro", status: "outside" },
  { id: 34, name: "Douglaston", rank: 5, competitor: "Nassau Border Pro", status: "outside" },
  { id: 35, name: "Floral Park", rank: 12, competitor: "Long Island Pro", status: "missing" },
  { id: 36, name: "Bellerose", rank: 14, competitor: "Long Island Pro", status: "missing" },
  { id: 37, name: "Queens Village", rank: 19, competitor: "East Queens Tech", status: "missing" },
  { id: 38, name: "Hollis Hills", rank: 9, competitor: "East Queens Tech", status: "outside" },
  { id: 39, name: "Jamaica Estates", rank: 13, competitor: "Mid-Island Pro", status: "missing" },
  { id: 40, name: "Jamaica Center", rank: 21, competitor: "Metro Sparks", status: "missing" },
  { id: 41, name: "St. Albans", rank: 25, competitor: "Southeast Power", status: "missing" },
  { id: 42, name: "Cambria Heights", rank: 23, competitor: "Southeast Power", status: "missing" },
  { id: 43, name: "Rosedale", rank: 27, competitor: "South Shore Pro", status: "missing" },
  { id: 44, name: "Laurelton", rank: 24, competitor: "South Shore Pro", status: "missing" },
  { id: 45, name: "Springfield Gardens", rank: 26, competitor: "JFK Corridor Pro", status: "missing" },
  { id: 46, name: "Rockaway Beach", rank: 18, competitor: "Seaside Pro", status: "missing" },
  { id: 47, name: "Belle Harbor", rank: 12, competitor: "Seaside Pro", status: "missing" },
  { id: 48, name: "Arverne", rank: 20, competitor: "Seaside Pro", status: "missing" },
  { id: 49, name: "Far Rockaway", rank: 22, competitor: "Atlantic Coast Pro", status: "missing" },
];

const COMPETITOR_BARS = [
  { name: "Your Site (Rebuilt)", speed: 98, pages: 28 },
  { name: "Top Competitor A", speed: 48, pages: 6 },
  { name: "Top Competitor B", speed: 65, pages: 4 },
  { name: "Top Competitor C", speed: 40, pages: 8 },
];

const RADAR_DATA = [
  { subject: "Search Coverage", Client: 90, Competitors: 45, fullMark: 100 },
  { subject: "Mobile Speed", Client: 98, Competitors: 35, fullMark: 100 },
  { subject: "Conversion UX", Client: 95, Competitors: 40, fullMark: 100 },
  { subject: "Service Depth", Client: 92, Competitors: 30, fullMark: 100 },
  { subject: "Trust & Proof", Client: 96, Competitors: 60, fullMark: 100 },
  { subject: "Structured Schema", Client: 100, Competitors: 25, fullMark: 100 },
];

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
  const [selectedPoint, setSelectedPoint] = useState(MAP_POINTS[8]);

  const businessName = lead.business_name || payload.businessName || "Your Business";
  const phone = payload.nap.phone || lead.phone || "(307) 533-6678";
  const address = payload.nap.address || "United States";
  const rating = payload.proof.rating ? String(payload.proof.rating) : "5.0";
  const reviewCount = payload.proof.reviewCount ? `${payload.proof.reviewCount}+` : "450+";

  const facts = (scrapeResults?.facts ?? {}) as Record<string, unknown>;
  const pagespeed = (facts.pagespeed as { score?: number; lcp?: string }) ?? {};
  const beforeScore = pagespeed.score || 29;
  const beforeLcp = pagespeed.lcp || "8.4s";

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

        <ProposalFrictionGrid
          businessName={businessName}
          phone={phone}
          reviewCount={reviewCount}
          rating={rating}
          beforeLcp={beforeLcp}
        />

        <ProposalGeoSnippets questions={GOOGLE_PAA_QUESTIONS} />

        <ProposalSpeedScorecard beforeScore={beforeScore} beforeLcp={beforeLcp} />

        <ProposalMapMatrix
          mapPoints={MAP_POINTS}
          selectedPoint={selectedPoint}
          industry={lead.industry}
          onSelectPoint={setSelectedPoint}
        />

        <ProposalCompetitorRadar
          businessName={businessName}
          competitorBars={COMPETITOR_BARS}
          radarData={RADAR_DATA}
        />

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
