"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroStatForward } from "@/components/site-shell/sections/hero/HeroStatForward";
import { Reveal } from "@/components/site-shell/primitives/Reveal";
import { useQuoteModal } from "@/components/site-shell/QuoteModalProvider";
import type { SitePayload } from "@/components/site-shell/types";

// Only selected when a real video was actually generated for this lead --
// but generation is bounded/best-effort (enrich-generate.ts times out after
// ~2.5 min), so this variant can still be picked with no video ready.
// Falling back to the stat-forward static hero here (not returning null)
// means an incomplete generation never produces a blank hero on a live page.
// Muted/autoPlay is not just a style choice -- Veo 3.1 has no API switch to
// disable audio, so this is what actually delivers the approved "no audio" hero.
//
// v3 (Phase M) -- the "sell me -> sold" closing moment: badge/headline/
// subhead/CTA stagger in over the footage instead of appearing instantly,
// framing it as a deliberate reveal rather than ambient background motion.
// Veo itself can't do reliable text overlays, so this is built here.
export function HeroVideoBackground({ payload }: { payload: SitePayload }) {
  const openQuoteModal = useQuoteModal();
  if (!payload.heroVideoUrl) return <HeroStatForward payload={payload} />;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <video
          src={payload.heroVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
      </div>
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        {payload.proof.rating && (
          <Reveal variant="fade-in" delay={0.2}>
            <div className="mx-auto mb-6 flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 shadow-card">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold">{payload.proof.rating}</span>
              <span className="text-sm text-muted-foreground">({payload.proof.reviewCount ?? 0} real reviews)</span>
            </div>
          </Reveal>
        )}
        <Reveal delay={0.45}>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{payload.headline}</h1>
        </Reveal>
        {payload.subhead && (
          <Reveal delay={0.65}>
            <p className="mx-auto mt-5 max-w-lg text-lg text-muted-foreground">{payload.subhead}</p>
          </Reveal>
        )}
        <Reveal delay={0.85}>
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
        </Reveal>
      </div>
    </section>
  );
}
