import { Users } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

interface AudienceSegment {
  label: string;
  description: string;
}

export function AudienceGrid({ payload }: { payload: SitePayload }) {
  const section = payload.audienceSegments;
  const segments = (section?.variant_props?.segments as AudienceSegment[] | undefined) ?? [];
  if (!section || segments.length === 0) return null;

  return (
    <section className="border-t border-border py-16">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight">{section.h2}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {segments.map((segment, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 text-center shadow-card">
              <Users className="mx-auto h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{segment.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{segment.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
