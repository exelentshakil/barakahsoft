import { Users } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";
import { IconBadge } from "@/components/site-shell/primitives/IconBadge";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import { RevealGroup, RevealItem } from "@/components/site-shell/primitives/Reveal";

interface AudienceSegment {
  label: string;
  description: string;
}

// Premium sibling of AudienceGrid -- same real data contract
// (payload.audienceSegments.variant_props.segments), gradient icon badges
// and a hover-lift card instead of a flat bordered card with a bare icon.
export function AudienceSegmentsCards({ payload }: { payload: SitePayload }) {
  const section = payload.audienceSegments;
  const segments = (section?.variant_props?.segments as AudienceSegment[] | undefined) ?? [];
  if (!section || segments.length === 0) return null;

  return (
    <section className="border-t border-border py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <SectionEyebrow icon={Users}>Who we serve</SectionEyebrow>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{section.h2}</h2>
        </div>
        <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {segments.map((segment, i) => (
            <RevealItem key={i} index={i}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <IconBadge icon={Users} className="mx-auto" />
                <h3 className="mt-4 font-semibold">{segment.label}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{segment.description}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
