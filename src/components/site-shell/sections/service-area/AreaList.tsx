import { MapPin } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

// A plain columned list with pin icons instead of pill badges — reads
// calmer for a business with a longer real list of service areas.
export function AreaList({ payload }: { payload: SitePayload }) {
  if (payload.areas.length === 0) return null;
  return (
    <section id="service-area" className="border-t border-border py-16">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight">Where we work</h2>
        <div className="mt-8 columns-2 gap-6 sm:columns-3">
          {payload.areas.map((area) => (
            <a key={area.slug} href={`#${area.slug}`} className="mb-3 flex items-center gap-2 break-inside-avoid text-sm hover:text-primary">
              {area.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={area.imageUrl} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
              ) : (
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              {area.h2}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
