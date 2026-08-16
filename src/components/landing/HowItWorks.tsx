import { ListChecks } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/site-shell/primitives/Reveal";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import landing from "../../../content/landing.json";

// Extracted from the old inline 3-step grid in page.tsx, upgraded with a
// staggered scroll-reveal and a connecting line -- same numbered-step
// visual language already established for the per-lead generated sites
// (site-shell/sections/process), applied here to the marketing page itself.
export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <SectionEyebrow icon={ListChecks}>How it works</SectionEyebrow>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Three steps. 48 hours.</h2>
        </div>
        <RevealGroup className="relative mt-14 grid gap-10 sm:grid-cols-3">
          <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent sm:block" />
          {landing.steps.map((step, i) => (
            <RevealItem key={step.title} index={i} className="relative text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-base font-bold text-primary-foreground shadow-lift">
                {i + 1}
              </div>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
