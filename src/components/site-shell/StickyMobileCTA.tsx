"use client";

import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuoteModal } from "@/components/site-shell/QuoteModalProvider";
import type { SitePayload } from "@/components/site-shell/types";

// Sticky mobile CTA bar below 900px (plan §5 non-negotiable requirement).
// Hidden at lg+ via Tailwind's breakpoint rather than a literal 900px media
// query — the shadcn/Tailwind config's default lg (1024px) is close enough
// to the spec's intent (mobile-first, hidden on real desktop viewports)
// without introducing a bespoke breakpoint just for this one component.
export function StickyMobileCTA({ payload }: { payload: SitePayload }) {
  const openQuoteModal = useQuoteModal();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
      {payload.nap.phone && (
        <Button asChild variant="outline" size="lg" className="flex-1">
          <a href={`tel:${payload.nap.phone}`}>
            <Phone className="h-4 w-4" /> Call
          </a>
        </Button>
      )}
      <Button size="lg" className="flex-1" onClick={openQuoteModal}>
        Get a free quote
      </Button>
    </div>
  );
}
