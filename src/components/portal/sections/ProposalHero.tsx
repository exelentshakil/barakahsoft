import { ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";

interface ProposalHeroProps {
  businessName: string;
  address: string;
  rating: string;
  reviewCount: string;
  leadSlug: string;
  isPaid: boolean;
  priceFormattedLabel: string;
  onOpenCheckout: () => void;
}

export function ProposalHero({
  businessName,
  address,
  rating,
  reviewCount,
  leadSlug,
  isPaid,
  priceFormattedLabel,
  onOpenCheckout,
}: ProposalHeroProps) {
  return (
    <section className="rounded-2xl border border-[#c7d0fb] bg-white p-8 sm:p-12 shadow-sm space-y-6">
      <div className="flex items-center gap-2">
        <span className="flex h-2.5 w-2.5 rounded-full bg-[#533afd] animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
          Digital X-Ray & Proposal Ready
        </span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-[#0d1738] sm:text-5xl leading-tight">
        {businessName}
      </h1>

      <p className="max-w-3xl text-base leading-relaxed text-[#42506a] sm:text-lg">
        We performed a deep X-Ray of your website, local Google search rankings in {address}, and competitor positioning. Your business has real proof ({reviewCount} reviews · {rating} ★ rating) — but the current customer journey is hiding that authority and leaking calls. Here is the verified breakdown of the lead machine we would put in its place.
      </p>

      <div className="pt-2 flex flex-wrap gap-4">
        <a
          href={`/s/${leadSlug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#432bd9]"
        >
          Open Live Homepage Preview <ExternalLink className="h-4 w-4" />
        </a>
        {isPaid ? (
          <div className="inline-flex items-center gap-2 rounded-md bg-[#eaf8f0] px-6 py-3.5 text-sm font-semibold text-[#0b8f5b]">
            <CheckCircle2 className="h-4 w-4" /> Payment received · launch workflow active
          </div>
        ) : (
          <button
            onClick={onOpenCheckout}
            className="inline-flex items-center gap-2 rounded-md bg-[#0b8f5b] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#09744a]"
          >
            Launch Complete Website ({priceFormattedLabel}) <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Stepper */}
      <div className="border-t border-[#e5e7f2] pt-8">
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div className="rounded-xl bg-[#f0f3ff] p-4 border border-[#e5e7f2]">
            <span className="font-bold text-[#533afd]">Step 1: Done ✓</span>
            <p className="mt-1 text-[#0d1738] font-semibold text-sm">Website X-Ray & Audit</p>
          </div>
          <div className="rounded-xl border-2 border-[#533afd] bg-white p-4 shadow-sm">
            <span className={`font-bold ${isPaid ? "text-[#0b8f5b]" : "text-[#533afd]"}`}>{isPaid ? "Step 2: Complete ✓" : "Step 2: Current"}</span>
            <p className="mt-1 text-[#0d1738] font-semibold text-sm">{isPaid ? "Launch Approved" : "You Review the Concept"}</p>
          </div>
          <div className={`rounded-xl p-4 border ${isPaid ? "border-2 border-[#0b8f5b] bg-[#eaf8f0] text-[#0b8f5b]" : "border-[#e5e7f2] bg-[#f9f9ff] text-[#777588]"}`}>
            <span className="font-bold">{isPaid ? "Step 3: Active" : "Step 3: Next"}</span>
            <p className="mt-1 font-semibold text-sm">{isPaid ? "QA, Domain & Go-Live" : "Launch in 48 Hours"}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
