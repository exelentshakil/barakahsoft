// A real build, end to end, with live models and no database.
//
// Everything the Inngest job does between "we have a lead" and "we have a
// page", run against real API keys: intake brief, PRD, compile, chrome, body,
// assemble, audit, repair. The result is written to disk so it can be opened
// and judged, which is the only test that actually matters.
//
//   npx tsx --env-file=.env.local scripts/smoke-build.ts

import { writeFileSync } from "node:fs";
import { buildIntakeSpec } from "../src/lib/intake-spec";
import { writePrd, intentFrom, prdToMarkdown } from "../src/lib/generate/prd";
import { compileDesignSystem } from "../src/lib/design";
import { authorChrome, authorBody, type MediaAsset } from "../src/lib/generate/author";
import { assemble } from "../src/lib/generate/assemble";
import { healthWellness } from "../src/lib/verticals/profiles/health-wellness";
import { salonWellness } from "../src/lib/verticals/profiles/salon-wellness";
import { homeServices } from "../src/lib/verticals/profiles/home-services";
import type { Entity } from "../src/lib/extract-entities";
import type { DesignDna } from "../src/lib/design-dna";

const t0 = Date.now();
const since = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

interface Fixture {
  slug: string;
  businessName: string;
  industry: string;
  city: string;
  brandHex: string;
  vertical: typeof healthWellness;
  rating: number;
  reviewCount: number;
  services: string[];
  areas: string[];
  pains: string[];
  entities: Entity[];
  blueprint: DesignDna["blueprint"];
}

const src = (page: string) => `https://example.test/${page}`;

const FIXTURES: Record<string, Fixture> = {
  gym: {
    slug: "t-fit-gym",
    businessName: "T-FIT GYM",
    industry: "gym",
    city: "Belfast",
    brandHex: "#ED1C24",
    vertical: healthWellness,
    rating: 5,
    reviewCount: 26,
    services: ["Membership", "Facility Hire", "Classes", "Personal Training", "Nutritional Counseling"],
    areas: ["Belfast", "Boucher Road", "Lisburn"],
    pains: [
      "Outdated design / looks wrong on phones",
      "Not enough leads or enquiries",
      "Visitors don't convert into calls",
    ],
    entities: [
      { kind: "pricing-tier", label: "Off-Peak", detail: "10am-4pm weekdays, all day weekends", price: "£24", period: "month", attributes: ["Full floor access"], source: src("membership") },
      { kind: "pricing-tier", label: "Full Access", detail: "Any hour we are open", price: "£34", period: "month", attributes: ["All classes included"], source: src("membership") },
      { kind: "pricing-tier", label: "Coached", detail: "Fortnightly one-to-one plus a written programme", price: "£79", period: "month", attributes: [], source: src("membership") },
      { kind: "class", label: "Barbell Club", detail: "Mon, Wed, Fri 6:00am", price: "", period: "", attributes: [], source: src("timetable") },
      { kind: "class", label: "Conditioning", detail: "Tue, Thu 7:15am", price: "", period: "", attributes: [], source: src("timetable") },
      { kind: "person", label: "Declan", detail: "Strength and powerlifting coach", price: "", period: "", attributes: [], source: src("coaches") },
      { kind: "person", label: "Niamh", detail: "Conditioning and rehab", price: "", period: "", attributes: [], source: src("coaches") },
      { kind: "opening-hours", label: "Weekdays", detail: "6am-10pm", price: "", period: "", attributes: [], source: src("contact") },
      { kind: "location", label: "Unit 10, Shane Retail Park, Boucher Road, Belfast BT12 6UA", detail: "", price: "", period: "", attributes: [], source: src("contact") },
    ],
    blueprint: {
      sections: [
        { kind: "video-introduction", purpose: "Introduce the brand culture through a video.", needs: ["video"] },
        { kind: "membership-tiers", purpose: "Outline the different membership options and pricing.", needs: ["pricing-tier"] },
        { kind: "service-overview", purpose: "Detail the services and facilities available.", needs: [] },
        { kind: "location-list", purpose: "List the locations where the gym is available.", needs: ["location"] },
      ],
      rationale: "A fitness reference leads with culture, then price, then place.",
    },
  },
  florist: {
    slug: "bloom-and-vine",
    businessName: "Bloom & Vine",
    industry: "florist",
    city: "Bath",
    brandHex: "#3A5A45",
    vertical: salonWellness,
    rating: 4.9,
    reviewCount: 63,
    services: ["Weekly subscriptions", "Wedding flowers", "Seasonal bouquets", "Dried arrangements"],
    areas: ["Bath", "Widcombe", "Bradford-on-Avon"],
    pains: ["Nobody finds us on Google", "Outdated design / looks wrong on phones"],
    entities: [
      { kind: "pricing-tier", label: "The Everyday", detail: "A smaller weekly bunch", price: "£26", period: "", attributes: [], source: src("shop") },
      { kind: "pricing-tier", label: "Late Autumn", detail: "Dahlias, hydrangea and rosehip", price: "£42", period: "", attributes: [], source: src("shop") },
      { kind: "policy", label: "Delivery", detail: "By our own van, Wednesdays and Saturdays before noon", price: "", period: "", attributes: [], source: src("delivery") },
      { kind: "opening-hours", label: "Studio", detail: "Tue-Sat 9am-5pm", price: "", period: "", attributes: [], source: src("visit") },
    ],
    blueprint: {
      sections: [
        { kind: "seasonal-collections", purpose: "Show what is in season now.", needs: ["pricing-tier"] },
        { kind: "wedding-consultation", purpose: "Invite an enquiry for events.", needs: [] },
        { kind: "subscription-explainer", purpose: "Explain how a standing order works.", needs: ["policy"] },
      ],
      rationale: "A florist reference is image-led and seasonal.",
    },
  },
  roofer: {
    slug: "kestrel-roofing",
    businessName: "Kestrel Roofing",
    industry: "roofing contractor",
    city: "Sheffield",
    brandHex: "#C4501B",
    vertical: homeServices,
    rating: 4.8,
    reviewCount: 112,
    services: ["Full re-roofs", "Repairs and leaks", "Flat roofs", "Heritage stone slate"],
    areas: ["Sheffield", "Rotherham", "Chesterfield", "Dronfield", "Hathersage", "Bakewell"],
    pains: ["Not enough leads or enquiries", "Invisible in AI search", "Visitors don't convert into calls"],
    entities: [
      { kind: "certification", label: "£5m public liability cover", detail: "", price: "", period: "", attributes: [], source: src("about") },
      { kind: "policy", label: "10-year workmanship guarantee", detail: "On all re-roofing work", price: "", period: "", attributes: [], source: src("guarantee") },
      { kind: "policy", label: "4-hour emergency attendance", detail: "Storm damage across Sheffield", price: "", period: "", attributes: [], source: src("emergency") },
      { kind: "differentiator", label: "Trading since 2004", detail: "All work in-house, no subcontracting", price: "", period: "", attributes: [], source: src("about") },
    ],
    blueprint: {
      sections: [
        { kind: "emergency-callout", purpose: "Capture urgent storm-damage work.", needs: ["policy"] },
        { kind: "recent-work", purpose: "Show completed jobs.", needs: ["photo"] },
        { kind: "guarantee", purpose: "State what is covered and for how long.", needs: ["policy"] },
        { kind: "coverage-area", purpose: "List where they work.", needs: [] },
      ],
      rationale: "A trades reference leads with urgency and proof.",
    },
  },
};

async function build(key: string): Promise<void> {
  const f = FIXTURES[key];
  console.log(`\n══ ${f.businessName} — ${f.industry}, ${f.city} ══`);

  const dna = { blueprint: f.blueprint, mood: "light-editorial" } as unknown as DesignDna;

  console.log(`[${since()}] intake brief…`);
  const intake = await buildIntakeSpec({
    businessName: f.businessName,
    industry: f.industry,
    city: f.city,
    vertical: f.vertical,
    entities: f.entities,
    dna,
    overrides: {},
    facts: {},
  });
  if (!intake) throw new Error("intake brief failed");
  console.log(`    ${intake.fields.length} fields · ${intake.fields.filter((x) => x.found).length} already answered · ${intake.missing.length} to chase`);
  console.log(`    asks for: ${intake.fields.slice(0, 6).map((x) => x.label).join(" · ")}`);
  const unlocks = intake.fields.filter((x) => x.unlocks.length && !x.found);
  if (unlocks.length) console.log(`    unlocks: ${unlocks.map((x) => `${x.label} → ${x.unlocks.join(",")}`).join(" | ")}`);

  console.log(`[${since()}] PRD…`);
  const prd = await writePrd({
    businessName: f.businessName,
    industry: f.industry,
    city: f.city,
    vertical: f.vertical,
    entities: f.entities,
    intake,
    dna,
    brandHex: f.brandHex,
    rating: f.rating,
    reviewCount: f.reviewCount,
    services: f.services,
    areas: f.areas,
    painInstructions: f.pains,
    photoCount: 6,
    band: f.vertical.sectionBand,
  });
  if (!prd) throw new Error("PRD failed");
  console.log(`    idea: “${prd.idea}”`);
  console.log(`    device: ${prd.editorialDevice}`);
  console.log(`    type: ${prd.type.displayFamily} / ${prd.type.bodyFamily} (${prd.type.voice}) · ${prd.space.rhythm} · ${prd.radius} · ${prd.motion.character}`);
  console.log(`    ${prd.sections.length} sections: ${prd.sections.map((s) => s.kind).join(" · ")}`);

  const system = compileDesignSystem(intentFrom(prd, f.brandHex));
  console.log(`[${since()}] compiled · paper ${system.tokens["--paper"]} ink ${system.tokens["--ink"]} brand ${system.tokens["--brand"]} · display ${system.meta.type.displayPx}px (${system.meta.type.scaleContrast}x)`);

  const media: MediaAsset[] = prd.sections
    .filter((s) => s.image)
    .map((s) => ({
      slot: s.image!.slot,
      // Deterministic placeholder pixels, so the audit measures a real image
      // box without this script needing the media pipeline or a network.
      url: `https://placehold.co/1600x1000/${system.tokens["--dark"].slice(1)}/${system.tokens["--paper"].slice(1)}.png`,
      alt: s.image!.brief.slice(0, 100),
      width: 1600,
      height: 1000,
      aspect: s.image!.aspect,
    }));

  const authorInput = {
    prd,
    businessName: f.businessName,
    city: f.city,
    phone: "028 9066 0000",
    email: null,
    address: f.entities.find((e) => e.kind === "location")?.label ?? null,
    services: f.services,
    areas: f.areas,
    facts: f.entities.map((e) => `${e.kind}: ${e.label}${e.price ? ` — ${e.price}${e.period ? `/${e.period}` : ""}` : ""}${e.detail ? ` (${e.detail})` : ""}`),
    reviews: [],
    media,
    logoUrl: null,
    innerPagesBuilt: false,
  };

  console.log(`[${since()}] chrome…`);
  const chrome = await authorChrome(authorInput);
  if (!chrome) throw new Error("chrome failed");

  console.log(`[${since()}] body…`);
  const body = await authorBody(authorInput, system.css, chrome.css);
  if (!body) throw new Error("body failed");
  console.log(`    ${body.sections.length} sections authored`);

  console.log(`[${since()}] assemble, measure, repair…`);
  const page = await assemble({ prd, system, chrome, body, media, maxRepairs: 2 });

  console.log(`[${since()}] score ${page.score}/100 after ${page.repairs} repair round(s)`);
  for (const finding of page.findings) console.log(`    [${finding.severity}] ${finding.check}: ${finding.detail.slice(0, 190)}`);

  const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${f.businessName}</title><link rel="stylesheet" href="${system.fontHref}"><style>html,body{margin:0}${page.css}</style></head><body><div class="bespoke-page">${page.chromeHtml}${page.bodyHtml}${page.footerHtml}</div><script>${page.js}</script></body></html>`;
  const out = `/tmp/build-${f.slug}.html`;
  writeFileSync(out, doc);
  writeFileSync(`/tmp/prd-${f.slug}.md`, prdToMarkdown(prd));
  console.log(`[${since()}] → ${out}  (${Math.round(doc.length / 1024)}kb)`);
}

const which = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const targets = which.length ? which : ["gym"];

(async () => {
  for (const target of targets) await build(target);
  console.log(`\ndone in ${since()}\n`);
})().catch((error) => {
  console.error(`\nfailed at ${since()}:`, error);
  process.exit(1);
});
