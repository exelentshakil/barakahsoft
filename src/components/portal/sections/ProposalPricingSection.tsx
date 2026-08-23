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
  // Each line says the problem it solves rather than the thing we build.
  // A business owner does not want "LocalBusiness schema"; he wants to stop
  // losing the person who searched at nine at night and called someone else.
  //
  // Values are proportions of the anchor rather than fixed numbers, so they
  // always add up to the figure printed above them. Hardcoded amounts summed
  // to $1,550 under a headline reading $1,297, which is the kind of thing a
  // careful buyer checks and a careless one is annoyed by later.
  //
  // Three claims were removed outright: "28 dedicated service landing pages"
  // (the real number depends on how many services and areas they have),
  // "8 original launch articles" (the generator writes no articles at all),
  // and "0.12s Mobile Load Time" (nothing measures it — it was a number
  // somebody typed).
  const share = (fraction: number) => Math.round(standardValue * fraction);
  const parts = [share(0.31), share(0.385), share(0.193), share(0.075)];
  const remainder = Math.max(0, standardValue - parts.reduce((a, b) => a + b, 0));

  const deliverableItems = [
    {
      item: "A homepage built around your real reviews, real services and real photos — so the proof you already earned is the first thing a visitor sees",
      val: `$${parts[0]} Value`,
    },
    {
      item: "A page for every service you offer and every area you serve, so someone searching for one specific job lands on that job instead of hunting your homepage",
      val: `$${parts[1]} Value`,
    },
    {
      item: "An AI assistant that answers questions in your words and takes the caller's details — the enquiry at nine at night that currently goes to whoever answers first",
      val: `$${parts[2]} Value`,
    },
    {
      item: "Written so Google and ChatGPT can quote you directly when someone asks about your trade in your area",
      val: `$${parts[3]} Value`,
    },
    {
      item: "Built for speed on a phone, with one-tap calling everywhere your number appears",
      val: `$${remainder} Value`,
    },
    { item: "Your own domain, SSL and hosting, set up and looked after", val: "Included" },
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
