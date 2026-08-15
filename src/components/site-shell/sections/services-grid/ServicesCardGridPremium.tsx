import { ArrowUpRight, Wrench } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import { RevealGroup, RevealItem } from "@/components/site-shell/primitives/Reveal";

// Premium sibling of ServicesCardGrid -- same real service data
// (payload.services, unchanged, same #slug anchor links), a gradient accent
// border and hover-lift/arrow reveal on each card instead of a flat
// bordered card.
export function ServicesCardGridPremium({ payload }: { payload: SitePayload }) {
  if (payload.services.length === 0) return null;
  return (
    <section id="services" className="border-t border-border py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <SectionEyebrow icon={Wrench}>What we offer</SectionEyebrow>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Services</h2>
        </div>
        <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {payload.services.map((service, i) => (
            <RevealItem key={service.slug} index={i}>
              <a
                href={`#${service.slug}`}
                className="group block h-full overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
              >
                {service.imageUrl && (
                  <div className="relative h-44 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={service.imageUrl}
                      alt={service.h2}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{service.h2}</h3>
                    <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{service.body_content}</p>
                </div>
              </a>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
