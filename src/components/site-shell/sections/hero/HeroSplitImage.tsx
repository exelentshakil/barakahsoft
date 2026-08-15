import { Button } from "@/components/ui/button";
import type { SitePayload } from "@/components/site-shell/types";

// Default hero variant — headline/subhead/CTAs left, real photo right.
// Extracted verbatim from the original home-services-v1 monolith so this
// is the safe fallback every lead rendered before section variants existed.
export function HeroSplitImage({ payload }: { payload: SitePayload }) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[36rem] bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.15),transparent_70%)]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{payload.headline}</h1>
          {payload.subhead && <p className="mt-5 max-w-lg text-lg text-muted-foreground">{payload.subhead}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#contact">Get a free quote</a>
            </Button>
            {payload.nap.phone && (
              <Button asChild variant="outline" size="lg">
                <a href={`tel:${payload.nap.phone}`}>Call {payload.nap.phone}</a>
              </Button>
            )}
          </div>
        </div>
        {payload.heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={payload.heroImageUrl} alt={payload.businessName} className="w-full rounded-xl object-cover shadow-popover" />
        )}
      </div>
    </section>
  );
}
