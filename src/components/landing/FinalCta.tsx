import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site-shell/primitives/Reveal";
import landing from "../../../content/landing.json";

// Full-bleed closing band — the last, boldest push before the footer.
// Same real intake flow (anchors back up to the Hero's form), just a
// second, harder-to-miss entry point for anyone who scrolled the whole story.
export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-gradient-primary py-20 text-primary-foreground">
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
      <Reveal className="relative mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Stop losing calls to a site that doesn't represent you
        </h2>
        <p className="max-w-lg text-primary-foreground/90">{landing.trustLine}</p>
        <Button asChild size="lg" variant="secondary" className="mt-2 shadow-lift">
          <a href="#top">
            {landing.primaryCta} <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </Reveal>
    </section>
  );
}
