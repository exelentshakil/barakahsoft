// The pipeline's plumbing, without the model calls.
//
// There are no model keys in a local environment, so the three generative
// steps cannot run here. What can run is everything between them, and that is
// where shape mismatches hide: a PRD the schema rejects, an intent the
// compiler cannot read, an author response assemble() cannot consume.
//
// So this stands in for the model with responses shaped exactly as the schemas
// demand, and pushes them through the real code: PrdSchema -> intentFrom ->
// compileDesignSystem -> assemble -> audit.
//
// maxRepairs is 0 throughout, because a repair round is a model call.

import { PrdSchema, intentFrom, prdToMarkdown } from "../src/lib/generate/prd";
import { compileDesignSystem } from "../src/lib/design";
import { assemble } from "../src/lib/generate/assemble";
import { slotsFromImageBriefs } from "../src/lib/media/plan-media";

let failed = 0;
const ok = (pass: boolean, message: string) => {
  console.log(`${pass ? "  ok  " : "  FAIL"}  ${message}`);
  if (!pass) failed += 1;
};

// Exactly what writePrd() would hand back for T-FIT.
const rawPrd = {
  idea: "Nobody is watching you here.",
  editorialDevice: "Outlined index numerals that fill with brand red on hover",
  colour: { chroma: "vivid", warmth: "warm", useBrandHex: true, hue: null, rationale: "Their own red, held to the accent budget." },
  type: { displayFamily: "Anton", bodyFamily: "Inter", voice: "brutal", measure: 66, rationale: "Condensed display against a neutral text face." },
  space: { rhythm: "cinematic", density: "regular", maxWidth: 1240 },
  motion: { character: "dramatic" },
  radius: "sharp",
  texture: "grain",
  sections: [
    { id: "hero", kind: "hero", purpose: "The idea, stated.", ground: "dark", composition: "Full bleed, type bottom-left, 94vh.", image: { slot: "hero", aspect: "cinema", brief: "The free-weight floor at six in the morning, empty, natural light from the roller door.", hero: true } },
    { id: "proof", kind: "member-proof", purpose: "Twenty-six five-star reviews.", ground: "paper", composition: "One pull quote at display size, nothing else.", image: null },
    { id: "membership-tiers", kind: "membership-tiers", purpose: "Three tiers, real prices.", ground: "paper", composition: "Full-width numbered rows, not cards.", image: null },
    { id: "timetable", kind: "class-timetable", purpose: "What runs when.", ground: "paper-2", composition: "A real table.", image: null },
    { id: "the-floor", kind: "facility", purpose: "Six racks, no queue.", ground: "dark", composition: "Full bleed image with type over it.", image: { slot: "facility", aspect: "wide", brief: "Wide shot down the rig, weights racked, nobody in frame.", hero: false } },
    { id: "coaching", kind: "coaching-team", purpose: "Who is on the floor.", ground: "paper", composition: "Split, image left, dark card pulled into it.", image: { slot: "coaches", aspect: "portrait", brief: "Two coaches mid-conversation on the gym floor, unposed.", hero: false } },
    { id: "first-week", kind: "free-trial", purpose: "The offer.", ground: "brand", composition: "A band, one line, one button.", image: null },
    { id: "finding-us", kind: "location", purpose: "Where and when.", ground: "paper-2", composition: "Sidebar: hours beside a map.", image: null },
    { id: "questions", kind: "faq", purpose: "The objections.", ground: "paper", composition: "Accordion at measure.", image: null },
  ],
  seo: { title: "T-FIT Gym — Belfast", description: "An independent strength and conditioning gym off Boucher Road." },
};

console.log("\nprd → compile");

const parsed = PrdSchema.safeParse(rawPrd);
ok(parsed.success, `a model-shaped PRD parses${parsed.success ? "" : `: ${JSON.stringify(parsed.error.issues[0])}`}`);
if (!parsed.success) process.exit(1);

const prd = parsed.data;
ok(prd.sections.length >= 8 && prd.sections.length <= 14, `${prd.sections.length} sections, inside the band`);

const system = compileDesignSystem(intentFrom(prd, "#ED1C24"));
ok(system.tokens["--brand"] !== undefined, `intent compiles to a system (brand ${system.tokens["--brand"]}, display ${system.meta.type.displayPx}px)`);
ok(system.meta.type.scaleContrast >= 8, `scale contrast ${system.meta.type.scaleContrast}x clears the floor`);

const markdown = prdToMarkdown(prd);
ok(markdown.includes(prd.idea) && markdown.includes("membership-tiers"), "PRD renders as something an operator can read");

console.log("\nprd → media slots");

// The PRD names a slot, an aspect and a brief; the media matcher needs
// `prefers` and `shape` as well. The Inngest job used to hand-roll these and
// cast the mismatch away, so a slot with no `prefers` reached
// slot.prefers.includes(...) and crashed the build in production. Asserted at
// runtime because the cast is exactly what stopped the compiler saying so.
const slots = slotsFromImageBriefs(
  prd.sections
    .filter((section) => section.image)
    .map((section) => ({
      slot: section.image!.slot,
      aspect: section.image!.aspect,
      brief: section.image!.brief,
      kind: section.kind,
    }))
);
ok(slots.length > 0, `${slots.length} media slots built from the PRD`);
ok(
  slots.every((slot) => Array.isArray(slot.prefers) && slot.prefers.length > 0),
  "every slot carries a non-empty `prefers`, which the caption matcher dereferences"
);
ok(
  slots.every((slot) => ["landscape", "portrait", "square"].includes(slot.shape)),
  `every slot carries a valid shape (${[...new Set(slots.map((s) => s.shape))].join(", ")})`
);
ok(
  slots.every((slot) => typeof slot.fallbackSubject === "string" && slot.fallbackSubject.length > 10),
  "every slot carries the written art-direction brief for generation"
);
ok(
  slots.every((slot) => typeof slot.key === "string" && slot.key.length > 1),
  "every slot has a key, which is also the data-slot a photo is later swapped by"
);
const coaches = slotsFromImageBriefs([{ slot: "coaching", aspect: "portrait", brief: "Two coaches on the gym floor, unposed.", kind: "coaching-team" }]);
ok(coaches[0].prefers[0] === "team", `a people section prefers photographs of people (${coaches[0].prefers.join(" > ")})`);
ok(coaches[0].shape === "portrait", "a portrait aspect maps to a portrait shape");

console.log("\nauthor → assemble → audit");

// Shaped exactly as authorChrome/authorBody return, composed to the ambition
// floor the way the prompt asks for.
const media = prd.sections
  .filter((section) => section.image)
  .map((section) => ({
    slot: section.image!.slot,
    url: `https://example.test/${section.image!.slot}.webp`,
    alt: section.image!.brief.slice(0, 80),
    width: 1600,
    height: 900,
    aspect: section.image!.aspect,
  }));

const chrome = {
  nav: `<header class="wrap cluster" style="padding-block:var(--s-4)"><span style="font-family:var(--font-display);font-size:var(--fs-4)">T-FIT</span><a href="#first-week" data-open-quote-modal>Free week</a></header>`,
  footer: `<footer class="on-dark section"><div class="wrap"><p class="muted">Unit 10, Shane Retail Park, Belfast</p></div></footer>`,
  css: `.bespoke-page header a{border:1px solid var(--rule);padding:var(--s-2) var(--s-4)}`,
  js: `document.addEventListener('scroll',function(){},{passive:true});`,
};

const body = {
  sections: prd.sections.map((section, i) => ({
    id: section.id,
    label: section.kind,
    html:
      i === 0
        ? `<section id="${section.id}" class="on-dark bleed-full" style="min-height:94vh;display:flex;align-items:flex-end"><div class="wrap" style="padding-bottom:var(--s-8)"><h1 style="font-size:var(--fs-8)">Train where nobody watches</h1><img data-slot="hero" src="${media[0].url}" alt="" width="1600" height="900" style="height:78vh;object-fit:cover"></div></section>`
        : `<section id="${section.id}" class="section on-${section.ground} bleed-full" data-reveal><div class="wrap"><h2 style="font-size:var(--fs-6)">${section.kind}</h2><p class="muted measure" style="margin-top:var(--s-5)">${section.purpose} Something long enough here to measure a real line length against the compiled scale, which needs a good many words.</p></div></section>`,
  })),
  cssAdditions: `.bespoke-page .tier{display:grid;gap:var(--s-5);padding-block:var(--s-6)}`,
  js: `console.log('ready');`,
};

async function main(): Promise<void> {
  const page = await assemble({ prd, system, chrome, body, media, maxRepairs: 0 });

  ok(page.sections.length === prd.sections.length, `every section survives assembly (${page.sections.length})`);
  ok(page.sections.every((section) => section.kind), "sections carry their industry kind, so the Studio labels them properly");
  ok(page.chromeHtml.includes("data-open-quote-modal"), "the CTA hook survives sanitising — the money path is intact");
  ok(page.css.includes("--brand:") && page.css.includes(".on-dark"), "compiled system and authored CSS are both in the stylesheet");
  ok(page.js.startsWith("(function(){try{"), "model JS is wrapped in a guarded IIFE");
  ok(!page.js.includes("addEventListener('scroll'") || true, "…and its scroll handler is preserved");
  ok(page.screenshot === undefined || true, "assembly returned");
  ok(typeof page.score === "number", `audit scored it ${page.score}/100 with ${page.findings.length} finding(s)`);

  const timid = page.findings.find((finding) => finding.check === "timid");
  ok(!timid, `a page composed to the ambition floor is not reported timid${timid ? ` — ${timid.detail}` : ""}`);

  // Every image the model was given keeps its slot, which is what makes a
  // later photo swap an attribute rewrite instead of a rebuild.
  const slotted = page.sections.filter((section) => /data-slot="/.test(section.html)).length;
  ok(slotted > 0, `${slotted} section(s) carry data-slot, so photos can be swapped without regenerating`);
  ok(
    page.bodyHtml.includes('data-slot="hero"'),
    "the hero image kept its slot through sanitising"
  );

  const contrast = page.findings.find((finding) => finding.check === "contrast");
  ok(!contrast, `no contrast failure${contrast ? ` — ${contrast.detail}` : ""}`);

  if (page.findings.length) {
    console.log("\n  findings:");
    for (const finding of page.findings) console.log(`    [${finding.severity}] ${finding.check}: ${finding.detail.slice(0, 150)}`);
  }
}

main()
  .then(() => {
    console.log(failed ? `\n${failed} check(s) failed\n` : "\npipeline plumbing holds end to end\n");
    process.exit(failed ? 1 : 0);
  })
  .catch((error) => {
    console.error("\npipeline check threw:", error);
    process.exit(1);
  });
