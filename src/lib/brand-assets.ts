// Where the operator's brand images live, resolved in one place.
//
// CONFIRMED DATA LOSS. A logo uploaded in the Studio was written to
// extracted_assets.logo_url by the brief autosave and then read back from
// extracted_assets.branding.logo — a different key, which nothing writes.
// The upload succeeded, the URL appeared in the field, and on the next
// render the field fell through to the scraped logo as though nothing had
// happened. The build was worse: bespoke-generate read a third key,
// brand_logo_url, which nothing in the codebase has ever written, so every
// generated site used the scraped logo no matter what the operator chose.
// The live shell read a fourth, facts.logo_url, with the same result.
//
// Four readers, four different keys, one writer. These functions are now
// the only way any of them is read.

type Assets = Record<string, unknown> | null | undefined;
type Facts = Record<string, unknown> | null | undefined;

/**
 * The operator's saved value for `key`, if they have one.
 *
 * A key that is PRESENT wins even when it is an empty string, because empty
 * is how the field's clear button is stored and "I removed this logo" has to
 * outlive a reload just as much as "I uploaded this one". Only an absent key
 * means "never set — use whatever was scraped".
 */
function operatorValue(assets: Assets, key: string): string | null {
  if (!assets || !(key in assets)) return null;
  const value = assets[key];
  return typeof value === "string" ? value : null;
}

/** The last value a generate request carried, kept under brief_overrides. */
function overrideValue(assets: Assets, key: string): string | null {
  const overrides = assets?.brief_overrides as Record<string, unknown> | undefined;
  const value = overrides?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function scraped(facts: Facts, key: string): string | null {
  const value = facts?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

/** The header/brand logo: operator's choice first, the scrape only as a default. */
export function resolveLogoUrl(assets: Assets, facts: Facts, extra?: string | null): string | null {
  const operator = operatorValue(assets, "logo_url");
  if (operator !== null) return operator || null;
  return (
    overrideValue(assets, "logoUrl") ??
    (typeof (assets?.branding as { logo?: string } | undefined)?.logo === "string"
      ? ((assets!.branding as { logo?: string }).logo as string)
      : null) ??
    (extra?.trim() ? extra : null) ??
    scraped(facts, "logo_url")
  );
}

/** The transparent footer mark. Falls back to the header logo, never to nothing. */
export function resolveFooterLogoUrl(assets: Assets, facts: Facts): string | null {
  const operator = operatorValue(assets, "footer_logo_url");
  if (operator) return operator;
  // Deliberately NOT returning null on an empty string here: the footer
  // always needs a mark, and "no separate transparent version" is the normal
  // state of this field rather than a request for a bare footer.
  return overrideValue(assets, "footerLogoUrl") ?? resolveLogoUrl(assets, facts);
}

/** The hero photograph or cutout the operator picked. */
export function resolveHeroImage(assets: Assets, fallback?: string | null): string | null {
  const operator = operatorValue(assets, "hero_cutout");
  if (operator !== null) return operator || null;
  return overrideValue(assets, "heroImage") ?? (fallback?.trim() ? fallback : null);
}
