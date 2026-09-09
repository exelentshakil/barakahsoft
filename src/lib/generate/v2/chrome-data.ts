import { slugifyText } from "@/lib/slug";
/**
 * The chrome contract: what the header/nav renderer needs, independent of who
 * renders it. These lived in the old prompt-driven renderer; the application
 * owns the markup now, so they live beside the data that fills them.
 */
export interface NavLink {
  label: string;
  href: string;
  /** Present only for a top-level item that opens a mega-menu panel. */
  children?: { label: string; href: string }[];
}

export interface ChromeData {
  links: NavLink[];
  phone: string | null;
  primaryLabel: string;
  primaryHref: string;
  utility: string[];
}
import type { SiteBrief } from "@/lib/generate-bespoke-site";

// Where the navigation points is the application's decision, not the model's.
//
// The generator gets composition — how the bar is arranged, what the mega
// menu looks like, which glyphs it uses — and a fixed list of destinations it
// is forbidden to alter. The first version let the model write its own hrefs
// and it linked at on-page anchors (#services, #engineering) that only existed
// on the homepage.
//
// innerPagesBuilt matters: phase 1 delivers the homepage alone, so the service
// and area routes genuinely do not exist yet. Linking at them then would ship
// a nav full of 404s to the client on the one impression that decides the
// sale, so before phase 2 those items collapse to homepage anchors.

export function buildChromeData(
  brief: SiteBrief,
  options: { services: string[]; areas: string[]; innerPagesBuilt: boolean }
): ChromeData {
  const { services, areas, innerPagesBuilt } = options;

  const serviceHref = (name: string) =>
    innerPagesBuilt ? `/services/${slugifyText(name)}` : "#services";
  const areaHref = (name: string) => (innerPagesBuilt ? `/areas/${slugifyText(name)}` : "#areas");

  const links: NavLink[] = [{ label: "Home", href: "/" }];

  if (services.length > 0) {
    links.push({
      label: "Services",
      href: innerPagesBuilt ? "/services" : "#services",
      children: services.slice(0, 8).map((name) => ({ label: name, href: serviceHref(name) })),
    });
  }

  if (areas.length > 0) {
    links.push({
      label: "Service Areas",
      href: innerPagesBuilt ? "/areas" : "#areas",
      children: areas.slice(0, 8).map((name) => ({ label: name, href: areaHref(name) })),
    });
  }

  links.push({ label: "About", href: innerPagesBuilt ? "/about" : "#about" });
  links.push({ label: "FAQ", href: innerPagesBuilt ? "/faq" : "#faq" });
  links.push({ label: "Contact", href: innerPagesBuilt ? "/contact" : "#contact" });

  const utility = [
    brief.licensedInsured ? "Licensed, bonded & insured" : null,
    brief.areas.length ? `Serving ${brief.areas.slice(0, 3).join(", ")} & surrounding areas` : null,
    brief.email,
  ].filter((item): item is string => Boolean(item));

  return {
    links,
    phone: brief.phone,
    primaryLabel: brief.intent.primaryLabel,
    primaryHref: innerPagesBuilt ? "/contact" : "#contact",
    utility,
  };
}

/**
 * The last word on where the navigation points.
 *
 * The prompt forbids inventing an href, but a prompt is not a guarantee and a
 * nav full of 404s is the single most expensive defect this pipeline can ship.
 * Anything that is not a destination the application supplied is rewritten to
 * the homepage; tel:, mailto: and external links are left alone.
 */
export function enforceChromeHrefs(html: string, data: ChromeData): string {
  const allowed = new Set<string>([data.primaryHref, "/"]);
  for (const link of data.links) {
    allowed.add(link.href);
    for (const child of link.children ?? []) allowed.add(child.href);
  }

  return html.replace(/href\s*=\s*["']([^"']*)["']/gi, (match, href: string) => {
    const value = href.trim();
    if (/^(tel:|mailto:|https?:)/i.test(value)) return match;
    if (allowed.has(value)) return match;
    console.warn(`[chrome] dropped an href the application did not supply: "${value}"`);
    return 'href="/"';
  });
}
