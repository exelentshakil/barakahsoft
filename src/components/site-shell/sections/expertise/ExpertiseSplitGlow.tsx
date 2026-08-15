import { CheckCircle2, Award } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import { Reveal } from "@/components/site-shell/primitives/Reveal";

// Premium sibling of ExpertiseSplit -- same real data contract
// (payload.expertise.h2 + variant_props.bullets + real imageUrl), a
// decorative glow blob behind the photo and a proof-forward eyebrow instead
// of a plain two-column split.
export function ExpertiseSplitGlow({ payload }: { payload: SitePayload }) {
  const section = payload.expertise;
  const bullets = (section?.variant_props?.bullets as string[] | undefined) ?? [];
  if (!section || bullets.length === 0) return null;

  return (
    <section id="expertise" className="relative overflow-hidden border-t border-border py-20">
      <div className="decor-blob -left-32 top-1/2 h-80 w-80 -translate-y-1/2" />
      <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 lg:grid-cols-2">
        {section.imageUrl && (
          <Reveal variant="scale-in" className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={section.imageUrl} alt={section.h2} className="w-full rounded-2xl object-cover shadow-glow" />
          </Reveal>
        )}
        <Reveal>
          <SectionEyebrow icon={Award}>Why we're different</SectionEyebrow>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{section.h2}</h2>
          <ul className="mt-6 space-y-4">
            {bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
