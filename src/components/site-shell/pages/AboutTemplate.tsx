import { Building2, CheckCircle2 } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";
import { PageHeroBand } from "@/components/site-shell/pages/PageHeroBand";
import { Reveal } from "@/components/site-shell/primitives/Reveal";

// The one premium About page -- assembled entirely from content that
// already exists elsewhere in the payload (differentiator/expertise,
// real proof stats, real photo) rather than generating anything new, so
// this page is available as soon as the fast homepage pass has run, not
// gated behind full-site expansion.
type ExpertisePoint = { title: string; description: string };

export function AboutTemplate({ payload }: { payload: SitePayload }) {
  const points = (payload.expertise?.variant_props?.points as ExpertisePoint[] | undefined) ?? [];

  return (
    <>
      <PageHeroBand eyebrow="About us" eyebrowIcon={Building2} title={payload.businessName} subhead={payload.differentiator || undefined} />

      <section className="py-16">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 lg:grid-cols-2">
          {payload.expertise?.imageUrl && (
            <Reveal variant="scale-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={payload.expertise.imageUrl} alt={payload.businessName} className="w-full rounded-2xl object-cover shadow-glow" />
            </Reveal>
          )}
          <Reveal>
            <h2 className="font-display text-2xl font-bold tracking-tight">{payload.expertise?.h2 || "Why choose us"}</h2>
            {points.length > 0 ? (
              <ul className="mt-6 space-y-5">
                {points.map((p, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-semibold">{p.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-muted-foreground">{payload.differentiator}</p>
            )}
            {payload.proof.rating && (
              <p className="mt-6 text-sm text-muted-foreground">
                Rated <span className="font-semibold text-foreground">{payload.proof.rating}★</span> from{" "}
                <span className="font-semibold text-foreground">{payload.proof.reviewCount ?? 0}</span> real reviews.
              </p>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}
