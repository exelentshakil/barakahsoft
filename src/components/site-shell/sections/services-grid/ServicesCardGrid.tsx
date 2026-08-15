import type { SitePayload } from "@/components/site-shell/types";

// Default services-grid variant — extracted verbatim from the original
// monolith. The individual per-service anchor sections (SectionRenderer)
// are rendered by the composer after this, unaffected by which variant runs.
export function ServicesCardGrid({ payload }: { payload: SitePayload }) {
  if (payload.services.length === 0) return null;
  return (
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
  );
}
