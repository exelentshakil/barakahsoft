import { Badge } from "@/components/ui/badge";
import { sectionHref, type SitePayload } from "@/components/site-shell/types";

// Default service-area variant — extracted verbatim from the original
// monolith. v4 -- was hardcoding `#${area.slug}` unconditionally, which
// meant even a fully built area page could never be linked to from here;
// now uses the same sectionHref pattern services already use (real link
// once innerPagesBuilt, `#slug` placeholder until then).
export function AreaBadges({ payload }: { payload: SitePayload }) {
  if (payload.areas.length === 0) return null;
  return (
    <section id="service-area" className="border-t border-border py-16">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight">Where we work</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {payload.areas.map((area) => (
            <a key={area.slug} href={sectionHref(payload, "areas", area.slug)} className="inline-flex items-center gap-1.5">
              {area.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={area.imageUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
              )}
              <Badge variant="secondary">{area.h2}</Badge>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
