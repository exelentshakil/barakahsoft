import { CheckCircle2 } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

export function ExpertiseSplit({ payload }: { payload: SitePayload }) {
  const section = payload.expertise;
  const bullets = (section?.variant_props?.bullets as string[] | undefined) ?? [];
  if (!section || bullets.length === 0) return null;

  return (
    <section id="expertise" className="border-t border-border py-16">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 lg:grid-cols-2">
        {section.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={section.imageUrl} alt={section.h2} className="w-full rounded-xl object-cover shadow-card" />
        )}
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">{section.h2}</h2>
          <ul className="mt-6 space-y-3">
            {bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
