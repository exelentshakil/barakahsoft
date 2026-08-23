"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { QuoteRequestModal } from "@/components/site-shell/QuoteRequestModal";
import { SiteSupportChat } from "@/components/site-shell/SiteSupportChat";
import type { SitePayload } from "@/components/site-shell/types";

const QuoteModalContext = createContext<(() => void) | null>(null);

export function useQuoteModal(): () => void {
  const open = useContext(QuoteModalContext);
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
      <SiteSupportChat />
    </QuoteModalContext.Provider>
  );
}
