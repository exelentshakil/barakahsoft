import type { Facts } from "@/lib/ai";
import type { PageInventory } from "@/lib/scrape/extract-text";

const LICENSE_INSURANCE_PATTERN = /\b(licensed|insured|certified|bonded|bbb accredited|accreditation)\b/i;

// Real, cheap keyword detection across every scraped page — used to gate
// the certifications/trust-strip sections. Never invents a claim the
// business doesn't actually make on its own site.
export function findLicenseInsuranceMention(facts: Facts): boolean {
  const pages = (facts.pages as PageInventory[] | undefined) ?? [];
  return pages.some((p) => LICENSE_INSURANCE_PATTERN.test(p.bodyText) || p.headings.some((h) => LICENSE_INSURANCE_PATTERN.test(h)));
}

export interface TrustSignalCounts {
  hasTown: boolean;
  hasReviews: boolean;
  hasPhone: boolean;
  hasLicenseMention: boolean;
  count: number;
}

export function countTrustSignals(facts: Facts): TrustSignalCounts {
  const hasTown = !!facts.town;
  const rating = facts.rating as number | undefined;
  const reviewCount = facts.review_count as number | undefined;
  const hasReviews = !!(rating && reviewCount);
  const nap = facts.nap as { phones?: string[] } | undefined;
  const hasPhone = !!nap?.phones?.[0];
  const hasLicenseMention = findLicenseInsuranceMention(facts);

  const count = [hasTown, hasReviews, hasPhone, hasLicenseMention].filter(Boolean).length;
  return { hasTown, hasReviews, hasPhone, hasLicenseMention, count };
}
