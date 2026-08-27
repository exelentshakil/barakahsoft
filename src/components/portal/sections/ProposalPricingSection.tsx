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
  selectedOfferId: OfferOption["id"];
  onSelectOffer: (offerId: OfferOption["id"]) => void;
}

export function ProposalPricingSection({
  businessName,
  setupPrice,
  monthlyPrice,
  scopeItems,
  audit,
  offers,
  recommendedOfferId,
  selectedOfferId,
  onSelectOffer,
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
              const selected = offer.id === selectedOfferId;
              const included = recommended && scopeItems.length > 0 ? scopeItems : offer.scopeItems;
              return (
                <button
                  key={offer.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelectOffer(offer.id)}
                  className={`group relative flex flex-col rounded-2xl border p-6 text-left transition hover:-translate-y-1 hover:shadow-lg ${selected ? "border-[#533afd] bg-[#fcfcff] shadow-md ring-1 ring-[#533afd]" : "border-[#e5e7f2] bg-white hover:border-[#b4bbf2]"}`}
                >
                  {recommended && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#c0f282] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#1e3b0e]">Recommended</span>}
                  <h3 className="text-lg font-display font-medium text-[#0d1738]">{offer.label}</h3>
                  <p className="mt-2 text-xs text-[#5b6270] leading-snug min-h-[36px]">{offer.description}</p>
                  
                  <div className="mt-4 mb-5 border-b border-[#e5e7f2] pb-5">
                    <p className="text-4xl font-display font-medium text-[#0d1738]">
                      ${offer.setupPrice}<span className="text-base font-normal text-[#5b6270]">{offer.monthlyPrice > 0 ? ` + ${offer.monthlyPrice}/mo` : ""}</span>
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {included.map((item, i) => {
                      // Bold the first few words up to the first space or specific keywords for scanability if we want, or just leave as is.
                      // For now, render cleanly like Wix
                      return (
                        <li key={i} className="flex items-start text-xs text-[#42506a] leading-tight">
                          <svg className="w-3.5 h-3.5 mr-2.5 mt-0.5 text-[#533afd] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="flex-1">{item}</span>
                        </li>
                      );
                    })}
                  </ul>
                  
                  <div className={`mt-auto pt-4 flex justify-center`}>
                    <div className={`w-full text-center py-2.5 rounded-full text-xs font-bold transition ${selected ? "bg-[#533afd] text-white" : "bg-white border border-[#e5e7f2] text-[#0d1738] group-hover:border-[#533afd] group-hover:text-[#533afd]"}`}>
                      {selected ? "Selected plan" : "Select this plan"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
