import { Telescope } from "lucide-react";
import { listIndustryShowcase } from "@/lib/design-reference";
import { StackFlipRow } from "@/components/landing/primitives/StackFlipRow";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";

// Real, curated premium websites across the trades we serve -- sourced and
// vetted by the team as the design bar every redesign is built to match.
// Explicitly NOT presented as BarakahSoft's own delivered work (that's
// ProofGallery, above, sourced from our own real client deliveries) --
// this is the research/inspiration library, labeled as such so nothing
// here misrepresents authorship.
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

      <div className="mt-10">
        <StackFlipRow>
          {groups.map((group) => (
            <div key={group.slug} className="h-full overflow-hidden rounded-3xl border border-border bg-card shadow-glow">
              <div className="relative h-[52vh] w-full overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={group.images[0].url} alt={group.images[0].alt} className="h-full w-full object-cover object-top" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Real {group.label.toLowerCase()} website</p>
                  <p className="mt-1 font-display text-2xl font-bold text-white">{group.label}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-px bg-border">
                {group.images.slice(1, 4).map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.url} src={img.url} alt={img.alt} className="aspect-video w-full bg-card object-cover object-top" />
                ))}
              </div>
            </div>
          ))}
        </StackFlipRow>
      </div>
    </section>
  );
}
