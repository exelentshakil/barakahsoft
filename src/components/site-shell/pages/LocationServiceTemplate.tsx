import { MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SitePayload, ResolvedSection } from "@/components/site-shell/types";
import { PageHeroBand } from "@/components/site-shell/pages/PageHeroBand";
import { Reveal } from "@/components/site-shell/primitives/Reveal";

// The one premium location-service page template -- a real service x real
// area combination, populated entirely from enrich-expand.ts's grounded
// long-form content. Only ever rendered for a section whose real area name
// came from extract-service-areas.ts (never a fabricated place).
export function LocationServiceTemplate({ payload, section }: { payload: SitePayload; section: ResolvedSection }) {
  const area = (section.variant_props?.area as string | undefined) ?? "";
  const paragraphs = (section.long_body_content ?? section.body_content).split(/\n{2,}/).filter(Boolean);

  return (
    <>
      <PageHeroBand eyebrow={area ? `Serving ${area}` : "Service area"} eyebrowIcon={MapPin} title={section.h2} />

      <section className="py-16">
        <div className="mx-auto grid max-w-4xl gap-10 px-6">
          <Reveal className="space-y-5">
            {paragraphs.map((p, i) => (
              <p key={i} className="leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </Reveal>
          {payload.nap.phone && (
            <Reveal variant="fade-in" className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
              <p className="font-semibold">Serving {area || "your area"} — ready when you are.</p>
              <Button asChild className="mt-4">
                <a href={`tel:${payload.nap.phone}`}>
                  <Phone className="h-4 w-4" /> Call {payload.nap.phone}
                </a>
              </Button>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
