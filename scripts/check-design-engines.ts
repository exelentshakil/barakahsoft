// Unit checks for the design engines.
//
// These are pure functions, so the properties that make their output look
// hand-built are cheap to assert and expensive to lose. Wired into
// `npm run lint` alongside the other check-* scripts.

import { buildPalette, contrastOf, BODY_RATIO, DISPLAY_RATIO } from "../src/lib/design/colour";

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

if (process.argv.includes("--sample")) {
  console.log("\nT-FIT sample");
  for (const key of ["--paper", "--paper-2", "--ink", "--ink-2", "--brand", "--brand-ink", "--on-brand", "--dark", "--on-dark", "--line"]) {
    console.log(`  ${key.padEnd(14)} ${t[key]}`);
  }
}

console.log(failed ? `\n${failed} check(s) failed\n` : "\nall design engine checks passed\n");
process.exit(failed ? 1 : 0);
