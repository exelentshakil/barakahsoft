import { ListChecks } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import { RevealGroup, RevealItem } from "@/components/site-shell/primitives/Reveal";

interface ProcessStep {
  title: string;
  description: string;
}

// Premium sibling of ProcessSteps -- same real data contract
// (payload.process.variant_props.steps), gradient-filled numbered badges
// connected by a horizontal line on desktop instead of plain flat circles.
export function ProcessTimeline({ payload }: { payload: SitePayload }) {
  const section = payload.process;
  const steps = (section?.variant_props?.steps as ProcessStep[] | undefined) ?? [];
  if (!section || steps.length === 0) return null;

  return (
    <section id="process" className="border-t border-border py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <SectionEyebrow icon={ListChecks}>How it works</SectionEyebrow>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{section.h2}</h2>
        </div>
        <RevealGroup className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block" />
          {steps.map((step, i) => (
            <RevealItem key={i} index={i} className="relative text-center lg:text-left">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-base font-bold text-primary-foreground shadow-lift lg:mx-0">
                {i + 1}
              </div>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
