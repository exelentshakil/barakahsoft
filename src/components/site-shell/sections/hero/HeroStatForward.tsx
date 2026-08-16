"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuoteModal } from "@/components/site-shell/QuoteModalProvider";
import type { SitePayload } from "@/components/site-shell/types";

// Leads with the real rating/review-count as a prominent stat row above the
// headline, full-bleed photo behind everything instead of split alongside
// it — for leads with strong real review proof, worth putting first.
export function HeroStatForward({ payload }: { payload: SitePayload }) {
  const openQuoteModal = useQuoteModal();
  return (
    <section className="relative overflow-hidden">
      {payload.heroImageUrl && (
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={payload.heroImageUrl} alt={payload.businessName} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
        </div>
      )}
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        {payload.proof.rating && (
          <div className="mx-auto mb-6 flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 shadow-card">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold">{payload.proof.rating}</span>
            <span className="text-sm text-muted-foreground">({payload.proof.reviewCount ?? 0} real reviews)</span>
          </div>
        )}
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{payload.headline}</h1>
        {payload.subhead && <p className="mx-auto mt-5 max-w-lg text-lg text-muted-foreground">{payload.subhead}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={openQuoteModal}>
            Get a free quote
          </Button>
          {payload.nap.phone && (
            <Button asChild variant="outline" size="lg">
              <a href={`tel:${payload.nap.phone}`}>Call {payload.nap.phone}</a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
