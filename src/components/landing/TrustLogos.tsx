import { Marquee } from "@/components/landing/primitives/Marquee";

// `onDark: true` marks logos whose real asset is white/light-only (Legiit's
// filename literally says "DarkBG"; Heartcore Growth's mark rendered as an
// invisible sliver on a white chip during review) -- those get a dark chip
// instead of the usual white one, so the logo itself is never white-on-white.
const PARTNER_LOGOS = [
  { name: "Elementor", src: "https://barakahsoft.com/wp-content/uploads/2026/04/elementor.png", onDark: false },
  { name: "Legiit", src: "https://legiit.com/frontend/images/project_image/logos/Legiit_Logo_DarkBG.png", onDark: true },
  { name: "Heartcore Growth", src: "https://heartcoregrowth.com/public/images/logos/hcg-logo.png", onDark: true },
  { name: "No Half Cakes", src: "https://nohalfcakes.com/wp-content/uploads/2026/01/NHCTextLogo.png", onDark: false },
];

// Recognizable real platforms every web-design-agency owner already trusts
// -- via Simple Icons' public logo CDN (real brand marks, not fabricated),
// a step beyond the 4 direct partners above to round out the strip.
const PLATFORM_LOGOS = [
  { name: "WordPress", src: "https://cdn.simpleicons.org/wordpress/1e1e1e", onDark: false },
  { name: "Webflow", src: "https://cdn.simpleicons.org/webflow/1e1e1e", onDark: false },
  { name: "Shopify", src: "https://cdn.simpleicons.org/shopify/1e1e1e", onDark: false },
  { name: "Google", src: "https://cdn.simpleicons.org/google/1e1e1e", onDark: false },
  { name: "Meta", src: "https://cdn.simpleicons.org/meta/1e1e1e", onDark: false },
];

const LOGOS = [...PARTNER_LOGOS, ...PLATFORM_LOGOS];

// Real logos, hotlinked from their own live sites (partners) or Simple
// Icons' public CDN (recognizable platforms). Each sits in a fixed-size
// chip with object-contain -- several source files have huge internal
// transparent padding, so a fixed box + centered contain normalizes every
// logo to the same visual weight regardless of its own file's raw
// dimensions. Dark-only logos (see onDark above) render un-inverted on a
// dark chip rather than risking a color-distorting CSS invert() on a mark
// that isn't purely white.
export function TrustLogos() {
  return (
    <section className="border-y border-border bg-muted/30 py-10">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Trusted alongside
      </p>
      <Marquee>
        {LOGOS.map((logo) => (
          <div
            key={logo.name}
            className={
              logo.onDark
                ? "flex h-16 w-36 items-center justify-center rounded-lg bg-foreground px-4 shadow-card"
                : "flex h-16 w-36 items-center justify-center rounded-lg bg-white px-4 shadow-card"
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo.src}
              alt={logo.name}
              className={
                logo.onDark
                  ? "max-h-8 max-w-full object-contain opacity-90"
                  : "max-h-8 max-w-full object-contain opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0"
              }
            />
          </div>
        ))}
      </Marquee>
    </section>
  );
}
