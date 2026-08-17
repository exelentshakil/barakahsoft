"use client";

import { ArrowRight, Phone } from "lucide-react";
import { useQuoteModal } from "@/components/site-shell/QuoteModalProvider";

export function PremiumLeadButton({ children }: { children: React.ReactNode }) {
  const openQuoteModal = useQuoteModal();
  return (
    <button type="button" onClick={openQuoteModal} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lift transition hover:-translate-y-0.5 hover:shadow-glow">
      {children}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

export function PremiumPhoneButton({ phone }: { phone: string }) {
  return <a href={`tel:${phone}`} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-bold transition hover:border-primary hover:text-primary"><Phone className="h-4 w-4" /> {phone}</a>;
}
