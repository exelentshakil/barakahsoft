import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SitePayload } from "@/components/site-shell/types";
import { Reveal } from "@/components/site-shell/primitives/Reveal";

// Premium sibling of CtaBannerCentered -- same real data contract
// (payload.ctaBanner + real nap.phone), a multi-stop gradient mesh band
// with a soft glow behind the CTA button instead of a flat solid-primary
// band.
export function CtaBannerGradient({ payload }: { payload: SitePayload }) {
  const section = payload.ctaBanner;
  if (!section || !payload.nap.phone) return null;

  return (
    <section className="relative overflow-hidden border-t border-border bg-gradient-primary py-16 text-primary-foreground">
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
      <Reveal className="relative mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-4xl">{section.h2}</h2>
        {section.body_content && <p className="max-w-xl text-primary-foreground/90">{section.body_content}</p>}
        <Button asChild size="lg" variant="secondary" className="mt-2 shadow-lift">
          <a href={`tel:${payload.nap.phone}`}>
            <Phone className="h-4 w-4" /> {section.cta}
          </a>
        </Button>
      </Reveal>
    </section>
  );
}
