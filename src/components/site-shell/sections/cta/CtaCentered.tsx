import { Button } from "@/components/ui/button";
import type { SitePayload } from "@/components/site-shell/types";

// Default final-CTA variant — extracted verbatim from the original monolith.
export function CtaCentered({ payload }: { payload: SitePayload }) {
  return (
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
  );
}
