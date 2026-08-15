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
    <section className="relative overflow-hidden border-b border-border">
      <div className="decor-blob -right-32 -top-32 h-96 w-96" />
      <div className="decor-blob -bottom-32 -left-32 h-72 w-72" />
      <Reveal className="relative mx-auto max-w-4xl px-6 py-20 text-center">
        <SectionEyebrow icon={eyebrowIcon}>{eyebrow}</SectionEyebrow>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        {subhead && <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{subhead}</p>}
      </Reveal>
    </section>
  );
}
