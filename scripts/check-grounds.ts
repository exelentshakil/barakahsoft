// A ground painted by hand must still be a readable pair.
//
// The failure this guards against cost a whole T-FIT build: the model painted
// `background: var(--dark)` on a class of its own instead of using .on-dark,
// so `--muted` still resolved to the LIGHT ground's ink and printed 2.27:1
// grey on near-black. Two repair rounds could not fix it, the contrast gate
// is zero-tolerance, and ten minutes of work was discarded.
//
// remediateCss now completes the pair deterministically. This asserts two
// things against the REAL compiled system and the REAL rendered audit:
//
//   1. the un-remediated page genuinely fails, so the check has teeth
//   2. the remediated page is clean, with no model call involved
//
// Run: npm run check:grounds

import { compileDesignSystem } from "../src/lib/design";
import { remediateCss } from "../src/lib/design/remediate";
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

const copy =
  "An independent strength floor off Boucher Road with staffed coaching hours, no mirrors on the platform, and no queue for the rack at six in the morning when you actually want to train.";

// Exactly what the model wrote: its own class, its own background, no ground
// utility anywhere. Both directions — a dark band on the page's light ground,
// and a light card sitting inside that dark band.
const authored = `
.hero-band{background:var(--dark);padding:var(--s-8) 0}
.note-card{background:var(--paper-2);padding:var(--s-6)}
.brand-strip{background:var(--brand-ground);padding:var(--s-7) 0}
`;

const markup = `
<section class="hero-band"><div class="wrap">
  <h1 style="font-size:var(--fs-8)">Train where nobody watches</h1>
  <p class="muted measure" style="margin-top:var(--s-6)">${copy}</p>
  <div class="note-card" style="margin-top:var(--s-6)">
    <p class="muted">${copy}</p>
  </div>
</div></section>
<section class="brand-strip"><div class="wrap">
  <p class="muted measure">${copy}</p>
</div></section>`;

function doc(authoredCss: string): string {
  return (
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<style>html,body{margin:0;padding:0}${system.css}\n${authoredCss}</style></head>` +
    `<body><div class="bespoke-page">${markup}</div></body></html>`
  );
}

function contrastBlockers(findings: { check: string; severity: string; detail: string }[]) {
  return findings.filter((f) => f.check === "contrast" && f.severity === "blocker");
}

// The second failure, and the one that killed the 8m25s T-FIT run: a brand-red
// button with a 12px white label. No text colour reaches the BODY floor on
// that red — white scores 4.81:1, black 4.36:1 — so judging a control label as
// running copy made the build unpassable at any size the model would set. The
// colour engine already says 4.5:1 is the right floor for a button label; this
// asserts the audit finally agrees with it.
const buttonMarkup = `
<section class="on-paper"><div class="wrap" style="padding:var(--s-8) 0">
  <h2 style="font-size:var(--fs-7)">Book a free trial</h2>
  <button class="btn" style="background:var(--brand);color:var(--on-brand);font-size:12px;padding:var(--s-3) var(--s-5);border:0">
    Start now
  </button>
</div></section>`;

function buttonDoc(): string {
  return (
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<style>html,body{margin:0;padding:0}${system.css}</style></head>` +
    `<body><div class="bespoke-page">${buttonMarkup}</div></body></html>`
  );
}

async function main() {
  console.log("\nGround pairs — painted by hand, audited for real\n");

  // 1 · the check has teeth
  const before = await auditRendered({ html: doc(authored) });
  const beforeBlockers = contrastBlockers(before.findings);
  ok(
    beforeBlockers.length > 0,
    `un-remediated: ${before.metrics.contrastFailures.length} failing pair(s) — the bug still reproduces`
  );
  if (beforeBlockers.length) {
    const worst = before.metrics.contrastFailures.slice().sort((a, b) => a.ratio - b.ratio)[0];
    console.log(`        worst ${worst.ratio}:1 — ${worst.colour} on ${worst.ground}`);
  }

  // 2 · remediation completes every pair
  const { css, changes } = remediateCss(authored);
  ok(changes.length >= 3, `remediation rewrote ${changes.length} declaration(s) across the three grounds`);

  const after = await auditRendered({ html: doc(css) });
  const afterBlockers = contrastBlockers(after.findings);
  ok(
    afterBlockers.length === 0,
    afterBlockers.length === 0
      ? "remediated: no contrast blocker — this build would now be saved"
      : `remediated: STILL ${after.metrics.contrastFailures.length} failing pair(s)`
  );
  for (const failure of after.metrics.contrastFailures) {
    console.log(`        left over: ${failure.selector} at ${failure.ratio}:1`);
  }

  // 3 · a control label is judged as a control, not as a paragraph
  const button = await auditRendered({ html: buttonDoc() });
  const buttonBlockers = contrastBlockers(button.findings);
  ok(
    buttonBlockers.length === 0,
    buttonBlockers.length === 0
      ? "a 12px brand-fill button label passes at the control floor"
      : `brand button STILL blocks the build: ${buttonBlockers[0].detail}`
  );

  console.log(failed ? `\n${failed} check(s) failed\n` : "\nAll checks passed\n");
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
