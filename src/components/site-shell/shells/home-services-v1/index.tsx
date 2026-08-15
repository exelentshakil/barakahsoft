import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { StickyMobileCTA } from "@/components/site-shell/StickyMobileCTA";
import { SectionRenderer } from "@/components/site-shell/SectionRenderer";
import { resolveSectionVariant } from "@/components/site-shell/sections/registry";
import type { SitePayload } from "@/components/site-shell/types";

// The first template shell (plan §7/§8: reused for both Home Services and
// case 0's karting-recreation vertical — playbook-driven copy/photo
// differences only, no second shell needed yet). Every one of PRD §5's 13
// required sections is present: mega menu, hero, proof widget, services
// grid, differentiators, reviews, service area, FAQ (10+), guarantee,
// final CTA, footer, sticky mobile CTA. (Process timeline is intentionally
// omitted when a business's real facts don't describe a genuine numbered
// sequence — PRD §5 requires it "only if genuinely sequential", never
// invented for the sake of hitting a section count.)
//
// This shell is a composer, not a monolith: the 13-section order below is
// fixed, but which component renders *within* each slot is picked per lead
// by enrich-generate's section-composition step (payload.sectionVariants),
// falling back to each kind's default (= this file's original markup) when
// a selection is missing or invalid. See src/components/site-shell/sections/.
export function HomeServicesV1Shell({ payload }: { payload: SitePayload }) {
  const style = payload.brandColorHsl
    ? ({ ["--primary" as string]: payload.brandColorHsl, ["--ring" as string]: payload.brandColorHsl } as React.CSSProperties)
    : undefined;

  const Hero = resolveSectionVariant("hero", payload.sectionVariants.hero);
  const Proof = resolveSectionVariant("proof", payload.sectionVariants.proof);
  const ServicesGrid = resolveSectionVariant("services-grid", payload.sectionVariants["services-grid"]);
  const Reviews = resolveSectionVariant("reviews", payload.sectionVariants.reviews);
  const ServiceArea = resolveSectionVariant("service-area", payload.sectionVariants["service-area"]);
  const Faq = resolveSectionVariant("faq", payload.sectionVariants.faq);
  const Guarantee = resolveSectionVariant("guarantee", payload.sectionVariants.guarantee);
  const Cta = resolveSectionVariant("cta", payload.sectionVariants.cta);

  return (
    <div style={style} className="pb-20 lg:pb-0">
      <MegaMenu payload={payload} />

      <Hero payload={payload} />
      <Proof payload={payload} />

      <ServicesGrid payload={payload} />
      {/* Individual service sections — real anchor targets for the menu/grid above */}
      {payload.services.map((service) => (
        <SectionRenderer key={service.slug} section={service} />
      ))}

      <Reviews payload={payload} />

      <ServiceArea payload={payload} />
      {payload.areas.map((area) => (
        <SectionRenderer key={area.slug} section={area} />
      ))}

      <Faq payload={payload} />
      <Guarantee payload={payload} />
      <Cta payload={payload} />

      <PremiumFooter payload={payload} />
      <StickyMobileCTA payload={payload} />
    </div>
  );
}
