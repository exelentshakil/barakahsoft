import { Telescope } from "lucide-react";
import { listIndustryShowcase } from "@/lib/design-reference";
import { Marquee } from "@/components/landing/primitives/Marquee";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";

// Real, curated premium websites across every trade we serve -- sourced
// and vetted by the team as the design bar every redesign is built to
// match. Explicitly NOT presented as BarakahSoft's own delivered work
// (that's ProofGallery, above, sourced from our own real client
// deliveries) -- this is the research/inspiration library, labeled as such
// so nothing here misrepresents authorship. One marquee row per industry,
// alternating scroll direction row to row (a real "horizontal / reverse
// horizontal" pattern, not just a repeated single direction).
export async function IndustryShowcase() {
  const groups = await listIndustryShowcase();
  if (groups.length === 0) return null;

  return (
    <section className="border-t border-border bg-muted/20 py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <SectionEyebrow icon={Telescope}>Research, not guesswork</SectionEyebrow>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">The design bar we build to</h2>
        <p className="mt-3 text-muted-foreground">
          Before we touch your site, we study the best real websites in your exact trade — not stock templates.
        </p>
      </div>

      <div className="mt-14 space-y-10">
        {groups.map((group, i) => (
          <div key={group.slug}>
            <p className="mb-3 px-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
            <Marquee gap="gap-5" reverse={i % 2 === 1} durationSeconds={Math.max(30, group.images.length * 5)}>
              {group.images.map((img) => (
                <div key={img.url} className="h-48 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt} className="h-full w-full object-cover object-top" />
                </div>
              ))}
            </Marquee>
          </div>
        ))}
      </div>
    </section>
  );
}
