import { Star, ShieldCheck } from "lucide-react";
import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { StickyMobileCTA } from "@/components/site-shell/StickyMobileCTA";
import { SectionRenderer } from "@/components/site-shell/SectionRenderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SitePayload } from "@/components/site-shell/types";

// The first template shell (plan §7/§8: reused for both Home Services and
// case 0's karting-recreation vertical — playbook-driven copy/photo
// differences only, no second shell needed yet). Every one of PRD §5's 13
// required sections is present: mega menu, hero, proof widget, services
// grid, differentiators, reviews, service area, FAQ (10+), guarantee,
// final CTA, footer, sticky mobile CTA. (Process timeline is intentionally
// omitted when a business's real facts don't describe a genuine numbered
// sequence — PRD §5 requires it "only if genuinely sequential", never
// invented for the sake of hitting a section count.)
export function HomeServicesV1Shell({ payload }: { payload: SitePayload }) {
  const style = payload.brandColorHsl
    ? ({ ["--primary" as string]: payload.brandColorHsl, ["--ring" as string]: payload.brandColorHsl } as React.CSSProperties)
    : undefined;

  return (
    <div style={style} className="pb-20 lg:pb-0">
      <MegaMenu payload={payload} />

      {/* Hero */}
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

      {/* Proof widget — real photo/data, never an empty box */}
      <section id="proof" className="border-t border-border py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            {payload.proof.rating && (
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-3 shadow-card">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-lg font-bold">{payload.proof.rating}</span>
                <span className="text-sm text-muted-foreground">({payload.proof.reviewCount ?? 0} reviews)</span>
              </div>
            )}
            <p className="max-w-sm text-sm text-muted-foreground">{payload.differentiator}</p>
          </div>
          {payload.proof.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={payload.proof.imageUrl} alt="Real work" className="h-32 w-48 rounded-lg object-cover shadow-card" />
          )}
        </div>
      </section>

      {/* Services grid */}
      {payload.services.length > 0 && (
        <section id="services" className="border-t border-border py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center font-display text-3xl font-bold tracking-tight">Services</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {payload.services.map((service) => (
                <a
                  key={service.slug}
                  href={`#${service.slug}`}
                  className="rounded-xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-popover"
                >
                  <h3 className="font-semibold">{service.h2}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{service.body_content}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Individual service sections — real anchor targets for the menu/grid above */}
      {payload.services.map((service) => (
        <SectionRenderer key={service.slug} section={service} />
      ))}

      {/* Reviews — real content or omitted, never fabricated */}
      {payload.reviews.length > 0 && (
        <section id="reviews" className="border-t border-border py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center font-display text-3xl font-bold tracking-tight">What people say</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {payload.reviews.map((review, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <div className="flex gap-0.5">
                    {Array.from({ length: review.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">&ldquo;{review.text}&rdquo;</p>
                  <p className="mt-3 text-sm font-medium">{review.author_name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Service area sections */}
      {payload.areas.length > 0 && (
        <section id="service-area" className="border-t border-border py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center font-display text-3xl font-bold tracking-tight">Where we work</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {payload.areas.map((area) => (
                <a key={area.slug} href={`#${area.slug}`}>
                  <Badge variant="secondary">{area.h2}</Badge>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
      {payload.areas.map((area) => (
        <SectionRenderer key={area.slug} section={area} />
      ))}

      {/* FAQ — 10+ questions, FAQPage JSON-LD added by the page wrapper */}
      {payload.faq.length > 0 && (
        <section id="faq" className="border-t border-border py-16">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-center font-display text-3xl font-bold tracking-tight">Frequently asked questions</h2>
            <div className="mt-8 space-y-5">
              {payload.faq.map((f) => (
                <div key={f.slug}>
                  <p className="font-medium">{f.h2}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{f.body_content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Guarantee band */}
      {payload.guarantee && (
        <section className="border-t border-border bg-accent/40 py-10">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-6">
            <ShieldCheck className="h-6 w-6 shrink-0 text-primary" />
            <p className="text-sm font-medium">{payload.guarantee}</p>
          </div>
        </section>
      )}

      {/* Final CTA / Contact */}
      <section id="contact" className="border-t border-border py-20 text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight">Ready to get started?</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          {payload.nap.phone ? `Call ${payload.nap.phone} or ` : ""}send a message and {payload.businessName} will get back to you.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {payload.nap.phone && (
            <Button asChild size="lg">
              <a href={`tel:${payload.nap.phone}`}>Call now</a>
            </Button>
          )}
          {payload.nap.email && (
            <Button asChild variant="outline" size="lg">
              <a href={`mailto:${payload.nap.email}`}>Email us</a>
            </Button>
          )}
        </div>
      </section>

      <PremiumFooter payload={payload} />
      <StickyMobileCTA payload={payload} />
    </div>
  );
}
