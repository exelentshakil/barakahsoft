import { CheckCircle2, Sparkles, Tag } from "lucide-react";

interface ProposalPricingSectionProps {
  businessName: string;
  setupPrice: number;
  monthlyPrice: number;
  standardValue: number;
  discountLabel: string;
}

export function ProposalPricingSection({
  businessName,
  setupPrice,
  monthlyPrice,
  standardValue,
  discountLabel,
}: ProposalPricingSectionProps) {
  const deliverableItems = [
    { item: "Conversion-focused homepage built around your real logo, proof, services, and calls to action", val: "$400 Value" },
    { item: "28 dedicated service landing pages that give high-value jobs a clear path to contact you", val: "$600 Value" },
    { item: "8 original launch articles written for local customers (never blank)", val: "$300 Value" },
    { item: "AI search readiness and LocalBusiness schema foundation", val: "$150 Value" },
    { item: "0.12s Mobile Load Time with sticky 1-tap call buttons and AI lead assistant", val: "$100 Value" },
    { item: "Connected to your custom domain with SSL security & fast reliable hosting", val: "Included Free" },
  ];

  return (
    <section className="rounded-2xl border-2 border-[#533afd] bg-white p-8 sm:p-10 shadow-sm space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start border-b border-[#e5e7f2] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-3 py-1 text-xs font-bold text-[#533afd] shrink-0">
              <Tag className="h-3 w-3" /> Proposal & Launch Pricing
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b] shrink-0">
              <Sparkles className="h-3 w-3" /> {discountLabel}
            </span>
          </div>
          <h2 className="mt-2 text-3xl font-bold text-[#0d1738]">
            Custom Launch & Ongoing Plan
          </h2>
          <p className="mt-1 text-sm text-[#42506a]">
            Standard agency value anchored at ${standardValue} — curated specifically for {businessName}.
          </p>
        </div>

        {/* Price Tag Box */}
        <div className="rounded-xl bg-[#f9f9ff] border border-[#c7d0fb] p-5 text-left sm:text-right shrink-0">
          <span className="text-xs text-[#777588] line-through font-semibold">
            Standard Value: ${standardValue}
          </span>
          <div className="mt-0.5 flex items-baseline gap-1 sm:justify-end">
            {setupPrice === 0 && monthlyPrice > 0 ? (
              <>
                <span className="text-3xl font-bold text-[#0d1738]">$0</span>
                <span className="text-xs font-semibold text-[#777588]">setup +</span>
                <span className="text-3xl font-bold text-[#533afd] ml-1">${monthlyPrice}</span>
                <span className="text-xs font-semibold text-[#777588]">/mo</span>
              </>
            ) : setupPrice > 0 && monthlyPrice > 0 ? (
              <>
                <span className="text-3xl font-bold text-[#0d1738]">${setupPrice}</span>
                <span className="text-xs font-semibold text-[#777588]">setup + ${monthlyPrice}/mo</span>
              </>
            ) : (
              <>
                <span className="text-4xl font-bold text-[#0d1738]">${setupPrice}</span>
                <span className="text-xs font-semibold text-[#777588]">USD setup</span>
              </>
            )}
          </div>
          <span className="text-[11px] font-bold text-[#0b8f5b] block mt-1">
            {setupPrice === 0 && monthlyPrice > 0
              ? `✓ $0 Upfront · $${monthlyPrice}/mo Hosting & Maintenance`
              : setupPrice > 0 && monthlyPrice > 0
              ? `✓ $${setupPrice} Setup · $${monthlyPrice}/mo Ongoing Retainer`
              : `✓ 100% Client-Owned Website`}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        {deliverableItems.map((d) => (
          <div key={d.item} className="flex items-start justify-between gap-3 rounded-lg border border-[#e5e7f2] p-4 bg-[#f9f9ff]">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0b8f5b] mt-0.5" />
              <span className="font-medium text-[#0d1738] text-xs sm:text-sm">{d.item}</span>
            </div>
            <span className="text-[11px] font-bold text-[#533afd] shrink-0">{d.val}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
