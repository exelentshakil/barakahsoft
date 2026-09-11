// Does the audit actually separate a premium page from a safe one?
//
// The static and rendered passes are only worth having if they fail the page
// the old pipeline would have shipped. So this builds two pages from the SAME
// compiled design system — one composed timidly, one composed to the ambition
// floor — and asserts the audit can tell them apart.
//
// Plan verification step 8: "deliberately build something timid and confirm
// the ambition pass fails it. If it passes, the thresholds are too loose."

import { writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { compileDesignSystem } from "../src/lib/design";
import { auditStatic, scoreOf } from "../src/lib/design/audit";
import { auditRendered } from "../src/lib/design/audit-rendered";

let failed = 0;
const ok = (pass: boolean, message: string) => {
  console.log(`${pass ? "  ok  " : "  FAIL"}  ${message}`);
  if (!pass) failed += 1;
};

const system = compileDesignSystem({
  colour: { brandHex: "#ED1C24", chroma: "vivid", warmth: "warm" },
  type: { displayFamily: "Anton", bodyFamily: "Inter", voice: "brutal", measure: 66 },
  space: { rhythm: "cinematic", density: "regular" },
  motion: { character: "dramatic" },
  radius: "sharp",
  texture: "grain",
});

const body = "An independent strength floor off Boucher Road with staffed coaching hours, no mirrors on the platform, and no queue for the rack at six in the morning when you actually want to train.";

function doc(inner: string, extra = ""): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0}${system.css}${extra}</style></head><body><div class="bespoke-page">${inner}</div></body></html>`;
}

// Composed to the ambition floor: 94vh hero, five words, full bleeds, a grid
// break, a tall image, motion bound, generous padding.
const ambitious = doc(`
<section style="min-height:94vh;display:flex;align-items:flex-end" class="on-dark bleed-full">
  <div class="wrap" style="padding-bottom:var(--s-8)">
    <h1 style="font-size:var(--fs-8)">Train where nobody watches</h1>
    <p class="muted measure" style="margin-top:var(--s-6)">${body}</p>
  </div>
</section>
<section class="section on-paper bleed-full"><div class="wrap">
  <h2 style="font-size:var(--fs-7)" data-reveal>No tie-in</h2>
  <p class="measure" style="margin-top:var(--s-5)">${body}</p>
</div></section>
<section class="section on-paper-2 bleed-full"><div class="wrap split">
  <img data-reveal src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='900'%3E%3Crect width='800' height='900' fill='%23555'/%3E%3C/svg%3E" width="800" height="900" style="height:78vh;object-fit:cover" alt="">
  <div class="on-dark pull-in-2" style="padding:var(--s-7)" data-reveal>
    <h3 style="font-size:var(--fs-5)">On the floor</h3>
    <p class="muted" style="margin-top:var(--s-4)">${body}</p>
  </div>
</div></section>
<section class="section on-dark bleed-full"><div class="wrap"><h2 style="font-size:var(--fs-7)">First week free</h2></div></section>`);

// Composed the way an unharnessed model composes: everything on one grid, one
// timid type ramp, 40px padding, no bleed, no motion, no texture. Every
// prohibition satisfied.
const timid = doc(`
<section style="padding:40px 0" class="on-paper"><div class="wrap">
  <h1 style="font-size:34px;line-height:1.1">Train where nobody is watching you at our Belfast gym today</h1>
  <p style="margin-top:16px;max-width:66ch">${body}</p>
</div></section>
<section style="padding:40px 0" class="on-paper"><div class="wrap">
  <h2 style="font-size:26px">Membership</h2>
  <p style="margin-top:14px;max-width:66ch">${body}</p>
</div></section>
<section style="padding:40px 0" class="on-paper"><div class="wrap">
  <h2 style="font-size:26px">Coaching</h2>
  <p style="margin-top:14px;max-width:66ch">${body}</p>
</div></section>`,
  // Kill the grain, since a timid page would not have asked for one.
  ".bespoke-page::after{display:none}");

// The page that actually shipped, in miniature: every dimension pushed to its
// limit at once. Giant type on every section, a bleed everywhere, holes between
// them, an image taller than the screen, and almost no words anywhere.
//
// This fixture is the regression guard the suite was missing. It tested timid
// against good and never good against overblown, so a build that maximised
// every floor scored "no blockers" and went out to a real prospect.
const overblown = doc(`
<section style="min-height:97vh;display:flex;align-items:center" class="on-dark bleed-full"><div class="wrap">
  <h1 style="font-size:174px;line-height:1.2">Emergency plumbers</h1>
</div></section>
<section class="section on-paper bleed-full" style="padding-block:400px"><div class="wrap">
  <h2 style="font-size:174px;line-height:1.2">Property protection</h2>
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1600'%3E%3Crect width='800' height='1600' fill='%23555'/%3E%3C/svg%3E" width="800" height="1600" style="height:135vh;object-fit:cover" alt="">
</div></section>
<section class="section on-paper-2 bleed-full" style="padding-block:400px"><div class="wrap"><h2 style="font-size:174px;line-height:1.2">Gas safe engineers</h2></div></section>
<section class="section on-paper bleed-full" style="padding-block:400px"><div class="wrap"><h2 style="font-size:174px;line-height:1.2">Modern heating</h2></div></section>
<section class="section on-dark bleed-full" style="padding-block:400px"><div class="wrap"><h2 style="font-size:174px;line-height:1.2">Call us today</h2></div></section>
<section class="section on-paper bleed-full" style="padding-block:400px"><div class="wrap"><h2 style="font-size:174px;line-height:1.2">Our promise</h2></div></section>
<section class="section on-paper-2 bleed-full" style="padding-block:400px"><div class="wrap"><h2 style="font-size:174px;line-height:1.2">Coverage</h2></div></section>`);

async function main(): Promise<void> {
  console.log("\nstatic audit");

  const clean = auditStatic({
    css: ".bespoke-page .hero{padding-block:var(--section-y);color:var(--ink);gap:var(--s-5)}",
    sectionIds: ["hero", "proof", "membership", "timetable", "coaching", "facility", "areas", "faq", "contact"],
    spacingScale: system.meta.space.steps,
  });
  ok(clean.length === 0, `a page written in tokens produces no findings (score ${scoreOf(clean)})`);

  const dirty = auditStatic({
    css: ".bespoke-page .hero{color:#3a5a45;padding:84px 0;font-size:18px;border-radius:4px}.bespoke-page .a{border-radius:9px}.bespoke-page .b{border-radius:22px}",
    sectionIds: ["hero", "about", "services", "faq"],
    spacingScale: system.meta.space.steps,
  });
  const checks = dirty.map((f) => f.check);
  ok(checks.includes("literal-colour"), "catches a literal colour");
  ok(checks.includes("off-scale-spacing"), "catches spacing off the compiled scale");
  ok(checks.includes("radius-drift"), "catches radius drift");
  ok(checks.includes("section-band"), "catches a 4-section page falling under the band");

  // var() fallbacks repeat the engine's own value; counting them is a finding
  // on correct code.
  const fallbacks = auditStatic({
    css: ".bespoke-page .x{padding:var(--s-5, 40px);color:var(--ink, #111)}",
    sectionIds: new Array(9).fill(0).map((_, i) => `s${i}`),
    spacingScale: system.meta.space.steps,
  });
  ok(fallbacks.length === 0, "var() fallbacks are not reported as literals");

  console.log("\nrendered audit");
  const dir = mkdtempSync(join(tmpdir(), "audit-"));
  const aPath = join(dir, "ambitious.html");
  const tPath = join(dir, "timid.html");
  writeFileSync(aPath, ambitious);
  writeFileSync(tPath, timid);

  const a = await auditRendered({ url: `file://${aPath}` });
  const t = await auditRendered({ url: `file://${tPath}` });

  const summarise = (label: string, r: typeof a) => {
    const m = r.metrics;
    console.log(
      `  ${label}: display ${m.displayPx}px  contrast ${m.scaleContrast}x  hero ${m.heroVh}vh/${m.heroWords}w  bleeds ${m.fullBleedCount}  breaks ${m.gridBreaks}  pad ${m.sectionPadMinPx}px  gap ${m.largestGapPx}px  img ${m.tallestImageVh}vh  motion ${m.motionBound}  texture ${m.hasTexture}`
    );
  };
  summarise("ambitious", a);
  summarise("timid    ", t);

  const timidFinding = (r: typeof a) => r.findings.find((f) => f.check === "timid");
  ok(!!timidFinding(t), "the timid page is reported as timid");
  ok(!timidFinding(a), "the ambitious page is not");
  ok(a.metrics.scaleContrast > t.metrics.scaleContrast, `scale contrast separates them: ${a.metrics.scaleContrast}x vs ${t.metrics.scaleContrast}x`);
  ok(a.metrics.heroVh > t.metrics.heroVh, `hero height separates them: ${a.metrics.heroVh}vh vs ${t.metrics.heroVh}vh`);
  ok(a.metrics.fullBleedCount > t.metrics.fullBleedCount, `bleed count separates them: ${a.metrics.fullBleedCount} vs ${t.metrics.fullBleedCount}`);
  ok(a.metrics.hasTexture && !t.metrics.hasTexture, "texture separates them");

  // Both are built from solved tokens, so neither may fail contrast. If the
  // ambitious page fails here the dark grounds are wrong, not the composition.
  if (a.metrics.contrastFailures.length) console.log("  contrast detail:", JSON.stringify(a.metrics.contrastFailures.slice(0, 3)));
  ok(a.findings.every((f) => f.check !== "contrast"), `ambitious page clears contrast (${a.metrics.contrastFailures.length} failures)`);
  ok(t.findings.every((f) => f.check !== "contrast"), `timid page clears contrast too — being safe is not the same as being good`);
  ok(!a.metrics.overflowsX, "no horizontal overflow at 1440px");
  ok(a.screenshot.length > 5000, `screenshot captured (${Math.round(a.screenshot.length / 1024)}kb)`);

  if (timidFinding(t)) console.log(`\n  reported: ${timidFinding(t)!.detail}`);

  // ── the other direction ──
  const oPath = join(dir, "overblown.html");
  writeFileSync(oPath, overblown);
  const o = await auditRendered({ url: `file://${oPath}` });
  summarise("overblown", o);

  const over = o.findings.find((f) => f.check === "overblown");
  ok(!!over, "a page that maximises every floor is caught");
  ok(over?.severity === "blocker", `…as a blocker, not a note (${over?.severity})`);
  ok(!timidFinding(o), "and is NOT reported as timid — the opposite failure");
  ok(
    o.findings.some((f) => f.check === "density"),
    "its empty sections are caught as a density failure"
  );
  ok(!a.findings.some((f) => f.check === "overblown" && f.severity === "blocker"), "a balanced page is not caught by the ceilings");
  if (over) console.log(`\n  reported: ${over.detail}`);
}

main()
  .then(() => {
    console.log(failed ? `\n${failed} check(s) failed\n` : "\naudit separates premium from safe\n");
    process.exit(failed ? 1 : 0);
  })
  .catch((error) => {
    console.error("\naudit checks threw:", error);
    process.exit(1);
  });
