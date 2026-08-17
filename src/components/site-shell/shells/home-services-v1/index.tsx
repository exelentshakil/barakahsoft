import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { StickyMobileCTA } from "@/components/site-shell/StickyMobileCTA";
import { SectionRenderer } from "@/components/site-shell/SectionRenderer";
import { resolveSectionVariant } from "@/components/site-shell/sections/registry";
import { getShellStyle } from "@/components/site-shell/shell-style";
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
  const style = getShellStyle(payload);

  const Hero = resolveSectionVariant("hero", payload.sectionVariants.hero);
  const TrustStrip = resolveSectionVariant("trust-strip", payload.sectionVariants["trust-strip"]);
  const Proof = resolveSectionVariant("proof", payload.sectionVariants.proof);
  const Expertise = resolveSectionVariant("expertise", payload.sectionVariants.expertise);
  const ServicesGrid = resolveSectionVariant("services-grid", payload.sectionVariants["services-grid"]);
  const CtaBanner = resolveSectionVariant("cta-banner", payload.sectionVariants["cta-banner"]);
  const Process = resolveSectionVariant("process", payload.sectionVariants.process);
  const AudienceSegments = resolveSectionVariant("audience-segments", payload.sectionVariants["audience-segments"]);
  const Reviews = resolveSectionVariant("reviews", payload.sectionVariants.reviews);
  const Certifications = resolveSectionVariant("certifications", payload.sectionVariants.certifications);
  const ServiceArea = resolveSectionVariant("service-area", payload.sectionVariants["service-area"]);
  const Faq = resolveSectionVariant("faq", payload.sectionVariants.faq);
  const Guarantee = resolveSectionVariant("guarantee", payload.sectionVariants.guarantee);
  const Cta = resolveSectionVariant("cta", payload.sectionVariants.cta);

  return (
    <div style={style} className="pb-20 lg:pb-0">
      <MegaMenu payload={payload} />

      <Hero payload={payload} />
      <TrustStrip payload={payload} />
      <Proof payload={payload} />
      <Expertise payload={payload} />

      <ServicesGrid payload={payload} />
      {/* Individual service sections — real anchor targets for the menu/grid above */}
      {payload.services.map((service, i) => (
        <SectionRenderer key={service.slug} section={service} imageUrl={service.imageUrl} index={i} />
      ))}

      <CtaBanner payload={payload} />
      <Process payload={payload} />
      <AudienceSegments payload={payload} />

      <Reviews payload={payload} />
      <Certifications payload={payload} />

      {/* v4 -- payload.areas entries are now real extracted area *names*,
          not AI-generated pages (see render-shell.ts), so there's no real
          body_content to render per-area on the homepage anymore. Real
          per-area content lives at /areas/[slug] (aggregates that area's
          location-service pages) once fullSiteBuilt; ServiceArea below
          already links there via sectionHref. */}
      <ServiceArea payload={payload} />

      <Faq payload={payload} />
      <Guarantee payload={payload} />
      <Cta payload={payload} />

      <PremiumFooter payload={payload} />
      <StickyMobileCTA payload={payload} />
    </div>
  );
}
