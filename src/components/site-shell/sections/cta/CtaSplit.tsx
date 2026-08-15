import { Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SitePayload } from "@/components/site-shell/types";

// A tinted, split two-column treatment instead of one centered block —
// gives the final CTA more visual weight as a distinct closing section.
export function CtaSplit({ payload }: { payload: SitePayload }) {
  return (
    <section id="contact" className="border-t border-border bg-accent/40 py-20">
      <div className="mx-auto grid max-w-4xl items-center gap-8 px-6 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Ready to get started?</h2>
          <p className="mt-3 text-muted-foreground">Send a message and {payload.businessName} will get back to you.</p>
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-card">
          {payload.nap.phone && (
            <Button asChild size="lg" className="w-full">
              <a href={`tel:${payload.nap.phone}`}>
                <Phone className="h-4 w-4" /> Call {payload.nap.phone}
              </a>
            </Button>
          )}
          {payload.nap.email && (
            <Button asChild variant="outline" size="lg" className="w-full">
              <a href={`mailto:${payload.nap.email}`}>
                <Mail className="h-4 w-4" /> Email us
              </a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
