import { Telescope } from "lucide-react";
import { listIndustryShowcase } from "@/lib/design-reference";
import { Marquee } from "@/components/landing/primitives/Marquee";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import { DesignReferenceCard } from "@/components/landing/DesignReferenceCard";

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
    <section id="design-standard" className="scroll-mt-24 border-t border-border bg-muted/20 py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <SectionEyebrow icon={Telescope}>Design standard</SectionEyebrow>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">See the quality bar before we build yours.</h2>
        <p className="mt-3 text-muted-foreground">
          These are curated real websites we study for structure, visual hierarchy, proof, and conversion ideas. They are research references, not our own client work.
        </p>
      </div>

      <div className="mt-14 space-y-10">
        {groups.map((group, i) => (
          <div key={group.slug}>
            <p className="mb-3 px-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
            <Marquee gap="gap-5" reverse={i % 2 === 1} durationSeconds={Math.max(30, group.images.length * 5)}>
              {group.images.map((img) => (
                <DesignReferenceCard key={img.url} url={img.url} alt={img.alt} />
              ))}
            </Marquee>
          </div>
        ))}
      </div>
    </section>
  );
}
