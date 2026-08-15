import type { ComponentType } from "react";
import type { SitePayload } from "@/components/site-shell/types";
import { heroVariants, heroDefaultVariant } from "@/components/site-shell/sections/hero";
import { proofVariants, proofDefaultVariant } from "@/components/site-shell/sections/proof";
import { servicesGridVariants, servicesGridDefaultVariant } from "@/components/site-shell/sections/services-grid";
import { reviewsVariants, reviewsDefaultVariant } from "@/components/site-shell/sections/reviews";
import { serviceAreaVariants, serviceAreaDefaultVariant } from "@/components/site-shell/sections/service-area";
import { faqVariants, faqDefaultVariant } from "@/components/site-shell/sections/faq";
import { guaranteeVariants, guaranteeDefaultVariant } from "@/components/site-shell/sections/guarantee";
import { ctaVariants, ctaDefaultVariant } from "@/components/site-shell/sections/cta";

export type SectionKind = "hero" | "proof" | "services-grid" | "reviews" | "service-area" | "faq" | "guarantee" | "cta";

type SectionComponent = ComponentType<{ payload: SitePayload }>;

// One registry per section kind + its default (= today's exact current
// look) — the composer looks up `SECTION_VARIANT_REGISTRY[kind][selection]`
// and falls back to `DEFAULT_VARIANT[kind]` when a selection is missing or
// unrecognized (an already-delivered lead, or an invalid AI pick).
export const SECTION_VARIANT_REGISTRY: Record<SectionKind, Record<string, SectionComponent>> = {
  hero: heroVariants,
  proof: proofVariants,
  "services-grid": servicesGridVariants,
  reviews: reviewsVariants,
  "service-area": serviceAreaVariants,
  faq: faqVariants,
  guarantee: guaranteeVariants,
  cta: ctaVariants,
};

export const DEFAULT_VARIANT: Record<SectionKind, string> = {
  hero: heroDefaultVariant,
  proof: proofDefaultVariant,
  "services-grid": servicesGridDefaultVariant,
  reviews: reviewsDefaultVariant,
  "service-area": serviceAreaDefaultVariant,
  faq: faqDefaultVariant,
  guarantee: guaranteeDefaultVariant,
  cta: ctaDefaultVariant,
};

export function resolveSectionVariant(kind: SectionKind, selection: string | undefined): SectionComponent {
  const variants = SECTION_VARIANT_REGISTRY[kind];
  const picked = selection && variants[selection] ? selection : DEFAULT_VARIANT[kind];
  return variants[picked];
}
