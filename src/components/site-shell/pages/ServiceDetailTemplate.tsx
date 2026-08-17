import { Wrench, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SitePayload, ResolvedSection } from "@/components/site-shell/types";
import { PageHeroBand } from "@/components/site-shell/pages/PageHeroBand";
import { Reveal } from "@/components/site-shell/primitives/Reveal";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";

// The one premium standalone service page template -- same design for
// every service, driven entirely by real per-service data (long_body_content
// when enrich-expand.ts has produced it, falling back to the short
// homepage-card body_content otherwise so the page still works pre-
// expansion). Real photo, real related-services, real phone CTA -- never
// invented content.
export function ServiceDetailTemplate({ payload, service }: { payload: SitePayload; service: ResolvedSection }) {
  const paragraphs = (service.long_body_content ?? service.body_content).split(/\n{2,}/).filter(Boolean);
  const related = payload.services.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <>
      <PageHeroBand eyebrow="Service" eyebrowIcon={Wrench} title={service.h2} />

      <section className="border-b border-border py-16 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_360px]">
          <Reveal className="space-y-5">
            {paragraphs.map((p, i) => (
              <p key={i} className="max-w-2xl text-lg leading-8 text-muted-foreground">
                {p}
              </p>
            ))}
          </Reveal>
          <div className="space-y-6">
            {service.imageUrl && (
              <Reveal variant="scale-in">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={service.imageUrl} alt={service.h2} className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lift" />
              </Reveal>
            )}
            {payload.nap.phone && (
              <div className="rounded-2xl border border-border bg-slate-950 p-6 text-white shadow-lift">
                <p className="font-semibold">Ready to get started?</p>
                <p className="mt-1 text-sm text-slate-300">Call now for a free quote and a clear next step.</p>
                <Button asChild className="mt-4 w-full">
                  <a href={`tel:${payload.nap.phone}`}>
                    <Phone className="h-4 w-4" /> {payload.nap.phone}
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-6">
            <SectionEyebrow>Related services</SectionEyebrow>
            <h2 className="font-display text-2xl font-bold tracking-tight">Other ways we can help</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {related.map((r) => (
                <a
                  key={r.slug}
                  href={payload.innerPagesBuilt ? `/s/${payload.leadSlug}/services/${r.slug}` : `/s/${payload.leadSlug}#${r.slug}`}
                  className="block rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-lift"
                >
                  <h3 className="font-semibold">{r.h2}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{r.body_content}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
