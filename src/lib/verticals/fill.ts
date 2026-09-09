import type { SiteBrief } from "@/lib/generate-bespoke-site";
import type { VerticalProfile } from "@/lib/verticals/types";

// Profile templates carry placeholders because the same string has to work for
// every business in a vertical: "{industry} arrangement being prepared in
// {city}" is one line that serves every florist rather than one per lead.

export interface FillVars {
  industry: string;
  city: string;
  business: string;
  /** The profile's singular noun for what this business sells. */
  offering: string;
  /** A specific offering name, where one is in hand. */
  item?: string;
}

const PLACEHOLDER = /\{(industry|city|business|offering|item)\}/g;

/**
 * Substitute {industry} {city} {business} {offering} {item} in a profile
 * template. An unknown placeholder is left as-is rather than replaced with
 * "undefined", so a typo in a profile is visible in the output instead of
 * silently producing a broken prompt.
 */
export function fill(template: string, vars: FillVars): string {
  return template.replace(PLACEHOLDER, (match, key: keyof FillVars) => {
    const value = vars[key];
    return typeof value === "string" && value.trim() ? value.trim() : match;
  });
}

/** The vars every caller derives the same way, from the brief and its profile. */
export function fillVars(brief: SiteBrief, profile: VerticalProfile, item?: string): FillVars {
  return {
    industry: brief.industry,
    city: brief.city,
    business: brief.businessName,
    offering: profile.nouns.offering,
    item,
  };
}
