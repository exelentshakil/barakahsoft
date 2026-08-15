import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SitePayload } from "@/components/site-shell/types";

export function CtaBannerCentered({ payload }: { payload: SitePayload }) {
  const section = payload.ctaBanner;
  if (!section || !payload.nap.phone) return null;

  return (
    <section className="border-t border-border bg-primary py-14 text-primary-foreground">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{section.h2}</h2>
        {section.body_content && <p className="text-primary-foreground/90">{section.body_content}</p>}
        <Button asChild size="lg" variant="secondary">
          <a href={`tel:${payload.nap.phone}`}>
            <Phone className="h-4 w-4" /> {section.cta}
          </a>
        </Button>
      </div>
    </section>
  );
}
