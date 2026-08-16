import { Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SitePayload } from "@/components/site-shell/types";
import { Reveal } from "@/components/site-shell/primitives/Reveal";

// v6 -- built from real vision analysis of the design-reference roofer
// screenshots (real premium sites often present a mid-page CTA as a
// contained, bordered two-column card rather than a full-bleed color band)
// -- genuinely different container shape from CtaBannerCentered/Gradient,
// which are both full-width bands.
export function CtaBannerSplitCard({ payload }: { payload: SitePayload }) {
  const section = payload.ctaBanner;
  if (!section || !payload.nap.phone) return null;

  return (
    <section className="border-t border-border py-16">
      <Reveal className="mx-auto max-w-4xl px-6">
        <div className="grid overflow-hidden rounded-2xl border border-border shadow-lift sm:grid-cols-2">
          <div className="flex flex-col justify-center gap-2 p-8">
            <h2 className="font-display text-2xl font-bold tracking-tight">{section.h2}</h2>
            {section.body_content && <p className="text-sm text-muted-foreground">{section.body_content}</p>}
          </div>
          <div className="flex flex-col items-start justify-center gap-3 bg-gradient-primary p-8 text-primary-foreground">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Phone className="h-5 w-5" />
            </div>
            <Button asChild size="lg" variant="secondary">
              <a href={`tel:${payload.nap.phone}`}>
                {section.cta} <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
