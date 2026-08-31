/**
 * End-to-end smoke test for the bespoke homepage build.
 *
 *   npx tsx --env-file=.env.local scripts/build-homepage-smoke.ts [outfile]
 *
 * Runs the real model chain against a synthetic brief and writes a standalone
 * HTML file, so the whole pipeline can be judged by looking at it rather than
 * by reading logs.
 */
import { writeFileSync } from "node:fs";
import { buildHomepage } from "@/lib/generate/v2/build-homepage";
import { conversionIntentFor } from "@/lib/conversion-intent";
import { buildChromeData } from "@/lib/generate/v2/chrome-data";
import { compileDesignTokens } from "@/lib/design-tokens";
import { DEFAULT_DESIGN_DNA } from "@/lib/design-dna";
import type { SiteBrief } from "@/lib/generate-bespoke-site";

const brief: SiteBrief = {
  businessName: "Saddle Roofing",
  industry: "Roofing contractor",
  city: "Cheyenne, WY",
  founder: "Tony Ostheimer",
  phone: "(307) 475-6088",
  email: "info@saddleroofing.com",
  aboutContent:
    "Saddle Roofing was founded by Wyoming locals Tony and Hannah Ostheimer. Tony's background is in civil and environmental engineering, which he brings to every roof structure. They started the company after watching out-of-state storm chasers take Wyoming homeowners' money and disappear. Every project is backed by a 10-year transferable workmanship warranty.",
  services: [
    "Roof inspection",
    "Roof repair",
    "Roof replacement",
    "Gutter services",
    "Skylight services",
    "Shingle roofs",
    "Metal roofs",
    "Emergency roof repair",
  ],
  areas: ["Cheyenne", "Laramie", "Gillette", "Casper", "Rock Springs", "Sheridan"],
  rating: 4.9,
  reviewCount: 299,
  reviews: [
    { author: "Dana R.", rating: 5, text: "They replaced our roof after a hailstorm in four days and handled the whole insurance claim for us." },
    { author: "Mark H.", rating: 5, text: "Tony walked the roof with me and showed me photos of every problem before quoting anything." },
    { author: "Priya S.", rating: 5, text: "Crew cleaned up so thoroughly you could not tell they had been here, apart from the new roof." },
  ],
  photos: [
    "https://images.unsplash.com/photo-1632759145355-6d5dfb8c2a86?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1541889895054-47f631169c9b?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
  ],
  heroImage: null,
  factsDigest:
    "Licensed, bonded and insured roofing contractors serving Cheyenne, Laramie and surrounding Wyoming areas. Manufacturer certified. 10+ years of experience. 24/7 emergency response.",
  licensedInsured: true,
  leadSlug: "saddle-roofing-smoke",
  painInstructions: [
    "Our current site looks like a template and does not explain the warranty",
    "We lose jobs to out-of-state storm chasers",
  ],
  intent: conversionIntentFor("Roofing contractor", true),
};

const tokens = compileDesignTokens(DEFAULT_DESIGN_DNA, {
  colourSource: "client",
  clientBrandHex: "#E4761B",
}).vars;

async function main() {
  const started = Date.now();
  const { buildPage } = await import("@/lib/generate/v2/templates");
  const { BASE_STYLESHEET } = await import("@/lib/generate/v2/base-stylesheet");

  const page = await buildPage({
    brief,
    logoUrl: null,
    photos: brief.photos,
    brandHex: "#E4761B",
    innerPagesBuilt: false,
  });

  const tokenBlock = `.bespoke-page{${Object.entries(page.tokens).map(([k, v]) => `${k}:${v}`).join(";")}}`;
  const css = `${tokenBlock}\n${BASE_STYLESHEET}`;

  const out = process.argv[2] ?? "/tmp/bespoke-smoke.html";
  writeFileSync(
    out,
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${page.copy.seo.title}</title><link rel="stylesheet" href="${page.fontHref}"><style>*{box-sizing:border-box}body{margin:0}${css}</style></head><body><div class="bespoke-page">${page.chromeHtml}${page.bodyHtml}${page.footerHtml}</div></body></html>`
  );

  console.log(`\n--- built in ${Math.round((Date.now() - started) / 1000)}s ---`);
  console.log(`dna      : ${page.dna.hero.id} / ${page.dna.about.id} / ${page.dna.chrome.id}`);
  console.log(`sections : ${page.sections.length} (${page.sections.map((s) => s.id).join(", ")})`);
  console.log(`headline : ${page.copy.hero.headline}`);
  console.log(`css      : ${css.length} chars, html ${page.bodyHtml.length} chars`);
  console.log(`\nwrote ${out}`);
}

void main();
