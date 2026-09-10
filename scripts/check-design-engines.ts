// Unit checks for the design engines.
//
// These are pure functions, so the properties that make their output look
// hand-built are cheap to assert and expensive to lose. Wired into
// `npm run lint` alongside the other check-* scripts.

import { buildPalette, contrastOf, BODY_RATIO, DISPLAY_RATIO } from "../src/lib/design/colour";
import { buildType, MIN_SCALE_CONTRAST, MIN_DISPLAY_PX } from "../src/lib/design/type";

let failed = 0;
const ok = (pass: boolean, message: string) => {
  console.log(`${pass ? "  ok  " : "  FAIL"}  ${message}`);
  if (!pass) failed += 1;
};

console.log("\ncolour");

// T-FIT's real brand red on a warm ground.
const tfit = buildPalette({ brandHex: "#ED1C24", chroma: "vivid", warmth: "warm" });
const t = tfit.tokens;

// Perceptual evenness: every step in the neutral ramp is the same size.
const deltas = tfit.meta.rampL.slice(1).map((l, i) => Number((tfit.meta.rampL[i] - l).toFixed(4)));
ok(new Set(deltas).size === 1, `neutral ramp steps by a constant delta-L (${deltas[0]} x ${deltas.length})`);

// Solved contrast: no text token can sit illegibly on the ground it is for.
ok(contrastOf(t["--ink"], t["--paper"]) >= BODY_RATIO, `ink on paper = ${contrastOf(t["--ink"], t["--paper"])}`);
ok(contrastOf(t["--ink-2"], t["--paper"]) >= BODY_RATIO, `ink-2 on paper = ${contrastOf(t["--ink-2"], t["--paper"])}`);
ok(contrastOf(t["--ink-3"], t["--paper"]) >= DISPLAY_RATIO, `ink-3 on paper = ${contrastOf(t["--ink-3"], t["--paper"])}`);
ok(contrastOf(t["--on-dark"], t["--dark"]) >= BODY_RATIO, `on-dark over dark = ${contrastOf(t["--on-dark"], t["--dark"])}`);
ok(contrastOf(t["--on-dark-2"], t["--dark"]) >= BODY_RATIO, `on-dark-2 over dark = ${contrastOf(t["--on-dark-2"], t["--dark"])}`);
ok(contrastOf(t["--brand-ink"], t["--paper"]) >= BODY_RATIO, `brand-ink on paper = ${contrastOf(t["--brand-ink"], t["--paper"])}`);
ok(contrastOf(t["--on-brand"], t["--brand"]) >= DISPLAY_RATIO, `on-brand over brand = ${contrastOf(t["--on-brand"], t["--brand"])}`);
ok(contrastOf(t["--brand-on-dark"], t["--dark"]) >= DISPLAY_RATIO, `brand-on-dark over dark = ${contrastOf(t["--brand-on-dark"], t["--dark"])}`);

// The specific failure the old pipeline shipped: the brand fill used as body
// text. It is illegible by construction, which is exactly why --brand-ink is
// a separate, darker token rather than the same value reused.
const rawBrand = contrastOf(t["--brand"], t["--paper"]);
ok(rawBrand < BODY_RATIO, `raw brand fill is illegible as body text (${rawBrand}) — --brand-ink exists for this`);

// Two leads must not converge on the same palette.
const dental = buildPalette({ brandHex: "#0F6E56", chroma: "muted", warmth: "cool" });
ok(dental.tokens["--paper"] !== t["--paper"], `grounds differ: ${t["--paper"]} vs ${dental.tokens["--paper"]}`);
ok(dental.tokens["--brand"] !== t["--brand"], `brands differ: ${t["--brand"]} vs ${dental.tokens["--brand"]}`);
ok(contrastOf(dental.tokens["--ink"], dental.tokens["--paper"]) >= BODY_RATIO, `dental ink on paper = ${contrastOf(dental.tokens["--ink"], dental.tokens["--paper"])}`);

// A pale brand colour is the hard case: it cannot be legible at its own
// lightness, so the solver has to walk it down rather than give up.
const pale = buildPalette({ brandHex: "#FFD24D", chroma: "vivid", warmth: "neutral" });
ok(
  contrastOf(pale.tokens["--brand-ink"], pale.tokens["--paper"]) >= BODY_RATIO,
  `pale brand still solves to legible text = ${contrastOf(pale.tokens["--brand-ink"], pale.tokens["--paper"])}`
);

console.log("\ntype");

const gymType = buildType({ displayFamily: "Anton", bodyFamily: "Inter", voice: "brutal", measure: 66 });
const m = gymType.meta;

// The ambition floor, satisfied by construction rather than by hoping.
ok(m.scaleContrast >= MIN_SCALE_CONTRAST, `scale contrast ${m.scaleContrast}x >= ${MIN_SCALE_CONTRAST}x`);
ok(m.displayPx >= MIN_DISPLAY_PX, `display ${m.displayPx}px >= ${MIN_DISPLAY_PX}px`);
ok(m.bodyPx >= 17 && m.bodyPx <= 19, `body ${m.bodyPx}px inside the law's 17-19`);

// Monotonic scale.
const sizes = m.tracking.map((entry) => entry.px);
ok(sizes.every((px, i) => i === 0 || px > sizes[i - 1]), `scale is monotonic: ${sizes.join(" ")}`);

// The tracking curve: negative at display, zero at body, positive at caption.
const caption = m.tracking[0];
const body = m.tracking[2];
const display = m.tracking[m.tracking.length - 1];
ok(caption.em > 0.02, `caption tracking positive (${caption.px}px -> ${caption.em}em)`);
ok(Math.abs(body.em) < 0.006, `body tracking ~neutral (${body.px}px -> ${body.em}em)`);
ok(display.em < -0.02, `display tracking negative (${display.px}px -> ${display.em}em)`);
ok(
  m.tracking.every((entry, i) => i === 0 || entry.em <= m.tracking[i - 1].em),
  "tracking decreases monotonically as size grows"
);

// Leading solved from size: tight at display, open at body.
const lead = m.leading;
ok(lead[lead.length - 1].lh < 1.0, `display leading tight (${lead[lead.length - 1].lh})`);
ok(lead[2].lh >= 1.5 && lead[2].lh <= 1.7, `body leading inside the law's 1.5-1.7 (${lead[2].lh})`);

// Measure inside the law.
ok(gymType.tokens["--measure"] === "66ch", `measure ${gymType.tokens["--measure"]}`);

// x-height genuinely feeds leading: two faces at the same size differ.
const wide = buildType({ displayFamily: "Anton", bodyFamily: "Archivo", voice: "brutal", measure: 66 });
const narrow = buildType({ displayFamily: "Anton", bodyFamily: "Fraunces", voice: "brutal", measure: 66 });
ok(wide.meta.leading[2].lh !== narrow.meta.leading[2].lh, `x-height changes leading: Archivo ${wide.meta.leading[2].lh} vs Fraunces ${narrow.meta.leading[2].lh}`);

// Measure genuinely feeds leading.
const longMeasure = buildType({ displayFamily: "Anton", bodyFamily: "Inter", voice: "brutal", measure: 75 });
ok(longMeasure.meta.leading[2].lh > m.leading[2].lh, `longer measure opens leading: 66ch ${m.leading[2].lh} -> 75ch ${longMeasure.meta.leading[2].lh}`);

// Fallback metrics present, so nothing reflows on font load.
ok(/size-adjust/.test(gymType.css) && /ascent-override/.test(gymType.css), "fallback @font-face carries size-adjust and ascent-override");
ok(/cap-display::before/.test(gymType.css), "cap-height trim utilities emitted");
ok(gymType.fontHref.startsWith("https://fonts.googleapis.com/"), "google fonts href built");

if (process.argv.includes("--sample")) {
  console.log("\ntype sample (Anton / Inter, brutal)");
  console.log(`  ratio ${m.ratio}  body ${m.bodyPx}px  display ${m.displayPx}px  contrast ${m.scaleContrast}x`);
  m.tracking.forEach((entry, i) => console.log(`  fs-${i}  ${String(entry.px).padStart(4)}px   tr ${String(entry.em).padStart(7)}em   lh ${m.leading[i].lh}`));
  console.log(`  --fs-8 = ${gymType.tokens["--fs-8"]}`);
}

if (process.argv.includes("--sample")) {
  console.log("\nT-FIT sample");
  for (const key of ["--paper", "--paper-2", "--ink", "--ink-2", "--brand", "--brand-ink", "--on-brand", "--dark", "--on-dark", "--line"]) {
    console.log(`  ${key.padEnd(14)} ${t[key]}`);
  }
}

console.log(failed ? `\n${failed} check(s) failed\n` : "\nall design engine checks passed\n");
process.exit(failed ? 1 : 0);
