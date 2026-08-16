"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SitePayload } from "@/components/site-shell/types";
import { Reveal } from "@/components/site-shell/primitives/Reveal";
import { useQuoteModal } from "@/components/site-shell/QuoteModalProvider";

// Premium sibling of HeroSplitImage -- same real data (headline/subhead/
// nap.phone/heroImageUrl/proof.rating), a larger decorative glow, a real
// rating badge above the headline when available, staggered entrance
// motion, and a glow-shadow photo instead of a flat popover shadow.
export function HeroSplitImagePremium({ payload }: { payload: SitePayload }) {
  const openQuoteModal = useQuoteModal();
  return (
    <section className="relative overflow-hidden">
      <div className="decor-blob -right-40 -top-40 h-[32rem] w-[32rem]" />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
        <Reveal>
          {payload.proof.rating && (
            <div className="mb-5 flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 shadow-card">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold">{payload.proof.rating}</span>
              <span className="text-sm text-muted-foreground">({payload.proof.reviewCount ?? 0} real reviews)</span>
            </div>
          )}
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{payload.headline}</h1>
          {payload.subhead && <p className="mt-5 max-w-lg text-lg text-muted-foreground">{payload.subhead}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="shadow-lift" onClick={openQuoteModal}>
              Get a free quote
            </Button>
            {payload.nap.phone && (
              <Button asChild variant="outline" size="lg">
                <a href={`tel:${payload.nap.phone}`}>Call {payload.nap.phone}</a>
              </Button>
            )}
          </div>
        </Reveal>
        {payload.heroImageUrl && (
          <Reveal variant="scale-in" delay={0.15}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={payload.heroImageUrl} alt={payload.businessName} className="w-full rounded-2xl object-cover shadow-glow" />
          </Reveal>
        )}
      </div>
    </section>
  );
}
