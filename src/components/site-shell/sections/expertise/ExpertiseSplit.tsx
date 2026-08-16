import { CheckCircle2 } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

type ExpertisePoint = { title: string; description: string };

export function ExpertiseSplit({ payload }: { payload: SitePayload }) {
  const section = payload.expertise;
  const points = (section?.variant_props?.points as ExpertisePoint[] | undefined) ?? [];
  if (!section || points.length === 0) return null;

  return (
    <section id="expertise" className="border-t border-border py-16">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 lg:grid-cols-2">
        {section.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={section.imageUrl} alt={section.h2} className="w-full rounded-xl object-cover shadow-card" />
        )}
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">{section.h2}</h2>
          <ul className="mt-6 space-y-5">
            {points.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">{point.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{point.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
