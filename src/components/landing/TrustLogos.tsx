import { Marquee } from "@/components/landing/primitives/Marquee";

const PARTNER_LOGOS = [
  { name: "Elementor", src: "https://barakahsoft.com/wp-content/uploads/2026/04/elementor.png" },
  { name: "Legiit", src: "https://legiit.com/frontend/images/project_image/logos/Legiit_Logo_DarkBG.png" },
  { name: "Heartcore Growth", src: "https://heartcoregrowth.com/public/images/logos/hcg-logo.png" },
  { name: "No Half Cakes", src: "https://nohalfcakes.com/wp-content/uploads/2026/01/NHCTextLogo.png" },
];

// Recognizable real platforms every web-design-agency owner already trusts
// -- via Simple Icons' public logo CDN (real brand marks, not fabricated),
// a step beyond the 4 direct partners above to round out the strip.
const PLATFORM_LOGOS = [
  { name: "WordPress", src: "https://cdn.simpleicons.org/wordpress/1e1e1e" },
  { name: "Webflow", src: "https://cdn.simpleicons.org/webflow/1e1e1e" },
  { name: "Shopify", src: "https://cdn.simpleicons.org/shopify/1e1e1e" },
  { name: "Google", src: "https://cdn.simpleicons.org/google/1e1e1e" },
  { name: "Meta", src: "https://cdn.simpleicons.org/meta/1e1e1e" },
];

const LOGOS = [...PARTNER_LOGOS, ...PLATFORM_LOGOS];

// Real logos, hotlinked from their own live sites (partners) or Simple
// Icons' public CDN (recognizable platforms). Each sits in a fixed-size
// white chip with object-contain -- several source files have huge
// internal transparent padding or are designed for a dark background
// (Legiit's filename literally says "DarkBG"), so a bare `h-6 w-auto`
// rendered some of them as a barely-visible sliver; a fixed box + centered
// contain normalizes every logo to the same visual weight regardless of
// its own file's raw dimensions.
export function TrustLogos() {
  return (
    <section className="border-y border-border bg-muted/30 py-10">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Trusted alongside
      </p>
      <Marquee>
        {LOGOS.map((logo) => (
          <div key={logo.name} className="flex h-16 w-36 items-center justify-center rounded-lg bg-white px-4 shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo.src}
              alt={logo.name}
              className="max-h-8 max-w-full object-contain opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0"
            />
          </div>
        ))}
      </Marquee>
    </section>
  );
}
