import { CheckCircle2 } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

// A denser, icon-led list instead of a card grid — reads well for
// businesses with a longer real service list (roofing, HVAC, etc.).
export function ServicesIconList({ payload }: { payload: SitePayload }) {
  if (payload.services.length === 0) return null;
  return (
    <section id="services" className="border-t border-border py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight">Services</h2>
        <div className="mt-10 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {payload.services.map((service) => (
            <a key={service.slug} href={`#${service.slug}`} className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold">{service.h2}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{service.body_content}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
