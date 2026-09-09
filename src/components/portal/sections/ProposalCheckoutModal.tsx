"use client";

import { useState } from "react";
interface ProposalCheckoutModalProps {
  businessName: string;
  setupPrice: number;
  monthlyPrice: number;
  priceFormattedLabel: string;
  scopeItems: string[];
  checkoutLoading: boolean;
  onClose: () => void;
  onCheckout: () => void;
  /** "stripe" pays now; "enquiry" collects a name and a contact instead. */
  commerceMode: "stripe" | "enquiry";
  /** The entity named at the point of payment. Must be the one being paid. */
  legalEntity: string;
  primaryActionLabel: string;
  /** Enquiry mode only: POSTs to the seller's own inbox. */
  onEnquiry?: (input: { name: string; contact: string; message: string }) => Promise<void>;
}

export function ProposalCheckoutModal({
  businessName,
  setupPrice,
  monthlyPrice,
  priceFormattedLabel,
  scopeItems,
  checkoutLoading,
  onClose,
  onCheckout,
  commerceMode,
  legalEntity,
  primaryActionLabel,
  onEnquiry,
}: ProposalCheckoutModalProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const enquiry = commerceMode === "enquiry";
  const canSubmit = name.trim().length > 1 && contact.trim().length > 3;
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
            <p className="text-xs text-[#777588]">Personalized launch plan for {businessName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-sm font-bold text-[#777588] hover:bg-[#f0f3ff] hover:text-[#0d1738]"
          >
            ✕
          </button>
        </div>

        <div className="rounded-xl bg-[#f0f3ff] p-5 text-xs space-y-3 border border-[#c7d0fb]">
          {scopeItems.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span className="mt-0.5 text-[#0b8f5b]">✓</span>
              <span className="font-bold text-[#0d1738]">{item}</span>
            </div>
          ))}
          <div className="flex justify-between items-center border-t border-[#c7d0fb] pt-3 text-sm">
            <div>
              <span className="font-bold text-[#0d1738] block">Total investment</span>
              <span className="text-[10px] text-[#777588]">Based on the scope above</span>
            </div>
            <span className="text-xl font-bold text-[#533afd]">
              {priceFormattedLabel}
            </span>
          </div>
        </div>

        {sent ? (
          <div className="space-y-3 rounded-lg bg-[#f4f3ff] p-5 text-center">
            <p className="text-sm font-bold text-[#0d1738]">Request sent.</p>
            <p className="text-[13px] leading-relaxed text-[#5b6270]">
              {legalEntity} will be in touch to confirm the details and next steps. Nothing is charged
              and nothing is committed until you say so.
            </p>
            <button
              onClick={onClose}
              className="w-full text-center text-xs font-semibold text-[#777588] hover:text-[#0d1738] pt-1"
            >
              Back to the proposal
            </button>
          </div>
        ) : (
        <div className="space-y-3">
          <p className="text-center text-[11px] leading-relaxed text-[#777588]">
            {enquiry
              ? "Nothing is charged here. This starts the conversation."
              : "*After payment, final content approval, and domain access are received."}
          </p>

          {enquiry && (
            <div className="space-y-2 text-left">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="w-full rounded-md border border-[#e5e7f2] px-3 py-3 text-sm text-[#0d1738] outline-none focus:border-[#533afd]"
              />
              <input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="Email or phone"
                autoComplete="email"
                className="w-full rounded-md border border-[#e5e7f2] px-3 py-3 text-sm text-[#0d1738] outline-none focus:border-[#533afd]"
              />
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Anything you want us to know (optional)"
                rows={3}
                className="w-full resize-none rounded-md border border-[#e5e7f2] px-3 py-3 text-sm text-[#0d1738] outline-none focus:border-[#533afd]"
              />
            </div>
          )}

          <button
            onClick={async () => {
              if (!enquiry) return onCheckout();
              if (!canSubmit || !onEnquiry) return;
              setSending(true);
              try {
                await onEnquiry({ name, contact, message });
                setSent(true);
              } finally {
                setSending(false);
              }
            }}
            disabled={enquiry ? sending || !canSubmit : checkoutLoading}
            className="w-full rounded-md bg-[#533afd] py-4 text-sm font-bold text-white shadow-md transition hover:bg-[#432bd9] disabled:opacity-60"
          >
            {enquiry ? (sending ? "Sending…" : primaryActionLabel) : payButtonLabel}
          </button>

          <p className="text-center text-[11px] text-[#777588]">
            {enquiry
              ? `Goes straight to ${legalEntity}. No card, no commitment.`
              : `🔒 256-bit encrypted checkout via Stripe · Verified ${legalEntity}`}
          </p>
          <button
            onClick={onClose}
            className="w-full text-center text-xs font-semibold text-[#777588] hover:text-[#0d1738] pt-1"
          >
            Cancel and review proposal preview
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
