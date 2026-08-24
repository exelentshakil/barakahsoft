import { CheckCircle2, Sparkles, Tag } from "lucide-react";
import type { SiteAudit } from "@/lib/audit/site-audit";
import type { OfferOption } from "@/lib/audit/lead-value";

interface ProposalPricingSectionProps {
  businessName: string;
  setupPrice: number;
  monthlyPrice: number;
  scopeItems: string[];
  audit?: SiteAudit | null;
  offers: OfferOption[];
  recommendedOfferId?: OfferOption["id"];
}

export function ProposalPricingSection({
  businessName,
  setupPrice,
  monthlyPrice,
  scopeItems,
  audit,
  offers,
  recommendedOfferId,
}: ProposalPricingSectionProps) {
  return (
    <section className="rounded-2xl border-2 border-[#533afd] bg-white p-8 sm:p-10 shadow-sm space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start border-b border-[#e5e7f2] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-3 py-1 text-xs font-bold text-[#533afd] shrink-0">
              <Tag className="h-3 w-3" /> What it costs
            </span>
            {setupPrice === 0 && (
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b] shrink-0">
                <Sparkles className="h-3 w-3" /> Monthly plan · no setup fee
              </span>
            )}
          </div>
          <h2 className="mt-2 text-3xl font-bold text-[#0d1738]">Putting {businessName} in a stronger position</h2>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#42506a]">
            This is the complete scope and investment for the focused rebuild that fixes the gaps we found and puts your
            existing reputation to work.
          </p>
        </div>

        {/* Price Tag Box */}
        <div className="rounded-xl bg-[#f9f9ff] border border-[#c7d0fb] p-5 text-left sm:text-right shrink-0">
          <span className="text-xs font-semibold text-[#777588]">
            Total investment
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
                <span className="text-xs font-semibold text-[#777588]">one time</span>
              </>
            )}
          </div>
          <span className="mt-1.5 block text-[11px] font-bold text-[#0b8f5b]">
            {monthlyPrice > 0 ? "Monthly service · website files remain yours" : "One-time project fee · website files remain yours"}
          </span>
        </div>
      </div>

      {audit && audit.findings.length > 0 && (
        <div className="rounded-xl border border-[#f2d38a] bg-[#fffaf0] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a5b00]">Why this is built for you</p>
          <p className="mt-1 text-sm font-semibold text-[#0d1738]">We are solving the problems already costing {businessName} attention.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {audit.findings.slice(0, 3).map((finding) => (
              <div key={finding.title} className="rounded-lg border border-[#f2d38a]/70 bg-white px-3 py-2.5 text-xs font-semibold text-[#42506a]">
                {finding.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {offers.length > 0 && (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#533afd]">Choose your launch path</p>
            <p className="mt-1 text-sm text-[#42506a]">Every option starts with the same evidence-led rebuild. The difference is how much of the site and ongoing responsibility you want us to carry.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {offers.map((offer) => {
              const recommended = offer.id === recommendedOfferId;
              return (
                <div key={offer.id} className={`relative rounded-xl border p-4 ${recommended ? "border-[#533afd] bg-[#f0f3ff] shadow-sm" : "border-[#e5e7f2] bg-[#f9f9ff]"}`}>
                  {recommended && <span className="absolute -top-2.5 left-3 rounded-full bg-[#533afd] px-2.5 py-1 text-[10px] font-bold text-white">Recommended</span>}
                  <h3 className="text-sm font-bold text-[#0d1738]">{offer.label}</h3>
                  <p className="mt-2 text-xl font-black text-[#533afd]">${offer.setupPrice}{offer.monthlyPrice > 0 ? <span className="text-xs font-bold text-[#42506a]"> + ${offer.monthlyPrice}/mo</span> : <span className="text-xs font-bold text-[#42506a]"> one time</span>}</p>
                  <p className="mt-2 text-xs leading-relaxed text-[#42506a]">{offer.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        {scopeItems.map((item) => (
          <div key={item} className="flex items-start justify-between gap-3 rounded-lg border border-[#e5e7f2] p-4 bg-[#f9f9ff]">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0b8f5b] mt-0.5" />
              <span className="font-medium text-[#0d1738] text-xs sm:text-sm">{item}</span>
            </div>
            <span className="shrink-0 text-[11px] font-bold text-[#533afd]">Included</span>
          </div>
        ))}
      </div>
    </section>
  );
}
