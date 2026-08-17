import type { LucideIcon } from "lucide-react";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import { Reveal } from "@/components/site-shell/primitives/Reveal";

// Shared premium page-header band for every v3 standalone page template
// (service detail, location-service, about, faq, legal) -- gradient mesh,
// eyebrow + h1, optional subhead. One design, reused everywhere, matching
// the "single massive design per page kind" direction rather than a
// bespoke hero per template.
export function PageHeroBand({ eyebrow, eyebrowIcon, title, subhead }: { eyebrow: string; eyebrowIcon?: LucideIcon; title: string; subhead?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-card">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary" aria-hidden="true" />
      <Reveal className="relative mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <SectionEyebrow icon={eyebrowIcon}>{eyebrow}</SectionEyebrow>
        <h1 className="max-w-4xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">{title}</h1>
        {subhead && <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{subhead}</p>}
      </Reveal>
    </section>
  );
}
