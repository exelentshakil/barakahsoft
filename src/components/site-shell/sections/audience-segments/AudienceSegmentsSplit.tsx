import { Users } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import { RevealGroup, RevealItem } from "@/components/site-shell/primitives/Reveal";

interface AudienceSegment {
  label: string;
  description: string;
}

// v6 -- built from real vision analysis of the design-reference roofer
// screenshots (real premium sites present customer-type segments as a
// couple of large, wide split cards, not a 4-across grid) -- deliberately
// no per-segment photo (there's no real photo-to-segment mapping in the
// scraped data, and a generic stock image implying "this shows commercial
// work" would misrepresent it), so the size/weight of the cards themselves
// carries the visual distinction instead.
export function AudienceSegmentsSplit({ payload }: { payload: SitePayload }) {
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
        <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2">
          {segments.map((segment, i) => (
            <RevealItem key={i} index={i}>
              <div className="h-full rounded-2xl border border-border bg-card p-8">
                <div className="font-display text-3xl font-bold text-primary/25">{String.fromCharCode(65 + i)}</div>
                <h3 className="mt-3 text-lg font-semibold">{segment.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{segment.description}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
