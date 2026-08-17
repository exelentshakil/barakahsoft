import { Wrench, ArrowRight } from "lucide-react";
import type { FunnelPageSection } from "@/types/database";
import { Reveal } from "@/components/site-shell/primitives/Reveal";
import { IconBadge } from "@/components/site-shell/primitives/IconBadge";
import { Button } from "@/components/ui/button";

// The individual per-service anchor sections rendered below the homepage's
// ServicesGrid (real anchor targets for the mega-menu/grid links above).
// v6.4 -- this was rendering as bare h2+paragraph+text-link with no card,
// no icon, and (a separate bug) its caller never passed the service's own
// real photo through even when one existed -- a long visible "wall of
// plain text" directly under the premium services grid, which is exactly
// what made the page feel like it degraded back to a generic default
// design halfway down. Now: a real bordered/shadowed card, an icon badge,
// and the real photo (alternating left/right by index) when one exists.
export function SectionRenderer({
  section,
  imageUrl,
  index = 0,
}: {
  section: FunnelPageSection;
  imageUrl?: string | null;
  index?: number;
}) {
  const imageOnRight = index % 2 === 0;

  return (
    <section id={section.slug} className="scroll-mt-20 border-t border-border py-16">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className={`grid items-center gap-0 ${imageUrl ? "lg:grid-cols-2" : ""}`}>
              <div className={`p-8 sm:p-10 ${imageUrl && !imageOnRight ? "lg:order-2" : ""}`}>
                <IconBadge icon={Wrench} />
                <h2 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">{section.h2}</h2>
                <p className="mt-3 whitespace-pre-line text-muted-foreground">{section.body_content}</p>
                {section.cta && (
                  <Button asChild variant="outline" className="mt-6">
                    <a href="#contact">
                      {section.cta} <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={section.h2} className="h-full min-h-64 w-full object-cover" />
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
