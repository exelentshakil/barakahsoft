import type { SitePayload } from "@/components/site-shell/types";

interface ProcessStep {
  title: string;
  description: string;
}

export function ProcessSteps({ payload }: { payload: SitePayload }) {
  const section = payload.process;
  const steps = (section?.variant_props?.steps as ProcessStep[] | undefined) ?? [];
  if (!section || steps.length === 0) return null;

  return (
    <section id="process" className="border-t border-border py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight">{section.h2}</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={i}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </div>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
