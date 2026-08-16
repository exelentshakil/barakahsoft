import { ListChecks } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import { RevealGroup, RevealItem } from "@/components/site-shell/primitives/Reveal";

interface ProcessStep {
  title: string;
  description: string;
}

// v6 -- built from real vision analysis of the design-reference roofer
// screenshots (several real premium sites use an oversized "01/02/03/04"
// index number in an accent gradient with a thin divider line beneath it,
// not a small numbered circle) -- a direct translation of that specific
// extracted pattern, genuinely distinct from ProcessSteps/ProcessTimeline.
export function ProcessNumberedIndex({ payload }: { payload: SitePayload }) {
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
        <RevealGroup className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <RevealItem key={i} index={i}>
              <div className="text-gradient-primary font-display text-5xl font-bold">{String(i + 1).padStart(2, "0")}</div>
              <div className="mt-3 h-px w-10 bg-primary" />
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
