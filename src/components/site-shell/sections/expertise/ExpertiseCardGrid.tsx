import { Award, ShieldCheck, Clock, Wrench } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import { IconBadge } from "@/components/site-shell/primitives/IconBadge";
import { RevealGroup, RevealItem } from "@/components/site-shell/primitives/Reveal";

type ExpertisePoint = { title: string; description: string };

const CARD_ICONS = [Award, ShieldCheck, Clock, Wrench];

// v6 -- built from real vision analysis of the design-reference roofer
// screenshots (several real premium sites present "why choose us" as a
// structured grid of bordered cards, not a split image+list) -- a genuinely
// different layout shape from ExpertiseSplit/ExpertiseSplitGlow, no photo
// required so it works even for a lead with no differentiator photo.
export function ExpertiseCardGrid({ payload }: { payload: SitePayload }) {
  const section = payload.expertise;
  const points = (section?.variant_props?.points as ExpertisePoint[] | undefined) ?? [];
  if (!section || points.length === 0) return null;

  return (
    <section id="expertise" className="border-t border-border py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <SectionEyebrow icon={Award}>Why we're different</SectionEyebrow>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{section.h2}</h2>
        </div>
        <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2">
          {points.map((point, i) => (
            <RevealItem key={i} index={i}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-card">
                <IconBadge icon={CARD_ICONS[i % CARD_ICONS.length]} />
                <h3 className="mt-4 font-semibold">{point.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{point.description}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
