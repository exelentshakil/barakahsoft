"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { QuoteRequestModal } from "@/components/site-shell/QuoteRequestModal";
import type { SitePayload } from "@/components/site-shell/types";

// Real, delivered-site-wide lead-capture: every "Get a free quote" CTA
// across the shell opens this one modal instead of a #contact anchor or a
// mailto: link that depends on the visitor having a configured email
// client. Mounted once at the layout level (src/app/s/[leadSlug]/layout.tsx)
// so it's available on every page under this route without each page/CTA
// managing its own dialog state.
const QuoteModalContext = createContext<(() => void) | null>(null);

export function useQuoteModal(): () => void {
  const open = useContext(QuoteModalContext);
  // A no-op fallback (never throws) -- a CTA rendered outside the provider
  // during a transitional edit shouldn't crash the page, just silently do
  // nothing until it's wired correctly.
  return open ?? (() => {});
}

export function QuoteModalProvider({ payload, children }: { payload: SitePayload; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openModal = useCallback(() => setOpen(true), []);
  const value = useMemo(() => openModal, [openModal]);

  return (
    <QuoteModalContext.Provider value={value}>
      {children}
      <QuoteRequestModal payload={payload} open={open} onOpenChange={setOpen} />
    </QuoteModalContext.Provider>
  );
}
