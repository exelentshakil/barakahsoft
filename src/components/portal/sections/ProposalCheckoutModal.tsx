interface ProposalCheckoutModalProps {
  businessName: string;
  discountLabel: string;
  standardValue: number;
  setupPrice: number;
  monthlyPrice: number;
  priceFormattedLabel: string;
  checkoutLoading: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function ProposalCheckoutModal({
  businessName,
  discountLabel,
  standardValue,
  setupPrice,
  monthlyPrice,
  priceFormattedLabel,
  checkoutLoading,
  onClose,
  onCheckout,
}: ProposalCheckoutModalProps) {
  const payButtonLabel =
    checkoutLoading
      ? "Redirecting..."
      : setupPrice === 0 && monthlyPrice > 0
      ? `Start $${monthlyPrice}/mo Subscription via Card / Apple Pay`
      : setupPrice > 0 && monthlyPrice > 0
      ? `Pay $${setupPrice} Setup + $${monthlyPrice}/mo`
      : `Pay $${setupPrice} via Card / Apple Pay`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 text-[#0d1738] border border-[#e5e7f2]">
        <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
          <div>
            <h3 className="text-xl font-bold text-[#0d1738]">Launch {businessName}&apos;s Website</h3>
            <p className="text-xs text-[#777588]">
              {discountLabel} · Tailored B2B Proposal
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-sm font-bold text-[#777588] hover:bg-[#f0f3ff] hover:text-[#0d1738]"
          >
            ✕
          </button>
        </div>

        <div className="rounded-xl bg-[#f0f3ff] p-5 text-xs space-y-3 border border-[#c7d0fb]">
          <div className="flex justify-between items-center">
            <span className="text-[#777588] font-semibold">Scope of Work</span>
            <span className="font-bold text-[#0d1738]">28 Service Pages + 8 Launch Articles</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#777588] font-semibold">AI Search & Assistant</span>
            <span className="font-bold text-[#0d1738]">Local Schema + Callback Bot</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#777588] font-semibold">Domain Setup</span>
            <span className="font-bold text-[#0d1738]">Custom Domain (SSL & DNS Included)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#777588] font-semibold">Delivery Time</span>
            <span className="font-bold text-[#0b8f5b]">48 Hours to Official Go-Live</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#777588] font-semibold">Ownership</span>
            <span className="font-bold text-[#0d1738]">100% You Own the Website</span>
          </div>
          <div className="flex justify-between items-center border-t border-[#c7d0fb] pt-3 text-sm">
            <div>
              <span className="font-bold text-[#0d1738] block">Pricing Terms</span>
              <span className="text-[10px] text-[#777588] line-through">Standard Value: ${standardValue}</span>
            </div>
            <span className="text-xl font-bold text-[#533afd]">
              {priceFormattedLabel}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onCheckout}
            disabled={checkoutLoading}
            className="w-full rounded-md bg-[#533afd] py-4 text-sm font-bold text-white shadow-md transition hover:bg-[#432bd9] disabled:opacity-60"
          >
            {payButtonLabel}
          </button>
          <p className="text-center text-[11px] text-[#777588]">
            🔒 256-bit encrypted checkout via Stripe · Verified BarakahSoft LLC
          </p>
          <button
            onClick={onClose}
            className="w-full text-center text-xs font-semibold text-[#777588] hover:text-[#0d1738] pt-1"
          >
            Cancel and review proposal preview
          </button>
        </div>
      </div>
    </div>
  );
}
