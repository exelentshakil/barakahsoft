// Audit a real page, right now, in about fifteen seconds.
//
// The loop this replaces was: press Generate, wait nine minutes, read a stack
// trace, guess, press Generate again. That is an unusable feedback cycle for
// anything — and it was the reason three separate one-line colour bugs each
// cost a full build before they were understood.
//
// This runs the SAME rendered audit the build runs, against any URL: a saved
// page in the studio, a portal proposal, a deployed client site, or the
// client's existing site for comparison. No credentials, no model calls, no
// Supabase — Playwright loads the page and measures it.
//
//   npm run check:page -- https://redesign.barakahsoft.com/s/metroplumb-e2e
//   npm run check:page -- https://example.com --json
//
// Exit code is 1 when anything blocks, so it can gate a script.

import { auditRendered } from "../src/lib/design/audit-rendered";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const url = args.find((arg) => !arg.startsWith("--"));

if (!url) {
  console.error("Usage: npm run check:page -- <url> [--json]");
  process.exit(2);
}

const SEVERITY_ORDER = { blocker: 0, finding: 1, note: 2 } as const;

function bar(label: string, value: number, want: number, unit = ""): string {
  const pass = value >= want;
  return `  ${pass ? "ok  " : "FAIL"}  ${label.padEnd(24)} ${String(value).padStart(6)}${unit}  (want ${want}${unit})`;
}

async function main() {
  const started = Date.now();
  console.log(`\nAuditing ${url}\n`);

  const result = await auditRendered({ url: url! });
  const m = result.metrics;
  const took = ((Date.now() - started) / 1000).toFixed(1);

  if (asJson) {
    console.log(JSON.stringify({ url, metrics: m, mobile: result.mobile, findings: result.findings }, null, 2));
    process.exit(result.findings.some((f) => f.severity === "blocker") ? 1 : 0);
  }

  // Contrast first — it is the only check that stops a build, and the one
  // that needs a selector you can go and fix.
  if (m.contrastFailures.length) {
    console.log(`  Contrast — ${m.contrastFailures.length} pair(s) below the floor\n`);
    for (const f of m.contrastFailures.slice().sort((a, b) => a.ratio - b.ratio).slice(0, 12)) {
      console.log(`    ${String(f.ratio).padStart(5)}:1  ${f.selector.padEnd(28)} ${f.colour} on ${f.ground}, ${f.size}px`);
      if (f.hint) console.log(`            ${f.hint.replace(/^ — /, "")}`);
    }
    console.log("");
  } else {
    console.log("  ok    Contrast — every pair clears the floor\n");
  }

  console.log("  Composition");
  console.log(bar("hero height", m.heroVh, 80, "vh"));
  console.log(bar("full-bleed moments", m.fullBleedCount, 3));
  console.log(bar("grid breaks", m.gridBreaks, 1));
  console.log(bar("largest whitespace gap", m.largestGapPx, 160, "px"));
  console.log(bar("tallest image", m.tallestImageVh, 70, "vh"));
  console.log(bar("elements bound to motion", m.motionBound, 3));
  console.log(`  ${m.hasTexture ? "ok  " : "FAIL"}  ${"texture layer".padEnd(24)} ${m.hasTexture ? "yes" : "no"}`);

  console.log("\n  Type");
  console.log(`        body ${m.bodyPx}px · measure ${m.measureChars} chars · display ${m.displayPx}px · scale contrast ${m.scaleContrast}`);

  console.log("\n  Mobile (390×844)");
  console.log(`        ${m.overflowsX || result.mobile.overflowsX ? "OVERFLOWS X" : "no horizontal overflow"}` +
    ` · ${result.mobile.smallTapTargets} tap target(s) under 44px` +
    ` · ${result.mobile.contrastFailures} contrast failure(s)`);
  if (m.overflowsX && m.widestOffender) console.log(`        widest: ${m.widestOffender}`);

  const sorted = result.findings
    .slice()
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  if (sorted.length) {
    console.log("\n  Findings");
    for (const finding of sorted) {
      console.log(`    [${finding.severity}] ${finding.check}`);
      console.log(`        ${finding.detail}`);
    }
  }

  const blockers = sorted.filter((f) => f.severity === "blocker").length;
  console.log(`\n  ${blockers ? `${blockers} blocker(s)` : "No blockers"} · ${took}s\n`);
  process.exit(blockers ? 1 : 0);
}

main().catch((error) => {
  console.error(`\nCould not audit ${url}\n`, error instanceof Error ? error.message : error);
  process.exit(2);
});
