import { compileDesignTokens } from "@/lib/design-tokens";
import { BASE_STYLESHEET } from "@/lib/generate/v2/base-stylesheet";
import { verifyHomepage } from "@/lib/audit/quality-gate";
import { DEFAULT_DESIGN_DNA, type DesignDna } from "@/lib/design-dna";
import { PROFILES } from "@/lib/verticals";

// Does the stylesheet survive every palette we can ship?
//
// The release gate runs per build and refuses a page whose contrast fails. That
// is the right place to stop a bad page reaching a client, but it is the wrong
// place to FIND the bug: by then an operator is blocked on a lead, and the
// failing rule is usually not specific to that lead at all.
//
// A gym resolved to a dark palette and six separate rules turned out to pair a
// literal white against --bs-ink, which is the page's TEXT colour and is white
// when the page is dark. Every one of them had been latent since the stylesheet
// was written, waiting for the first client whose brand was not light.
//
// So the same gate runs here against every art direction in the registry plus
// the extremes, with no build and no model call. Run it after touching the
// stylesheet or design-tokens.ts.

const EXTREMES: { label: string; dna: DesignDna }[] = [
  {
    label: "dark-premium (near-black)",
    dna: {
      ...DEFAULT_DESIGN_DNA,
      mood: "dark-premium",
      palette: {
        primary: "#C41230", accent: "#FF002B",
        surface: "#1A1A1A", surfaceAlt: "#333333",
        ink: "#FFFFFF", inkMuted: "#CCCCCC", onPrimary: "#FFFFFF",
      },
    },
  },
  {
    label: "pale brand on white",
    dna: {
      ...DEFAULT_DESIGN_DNA,
      palette: {
        primary: "#FFD12D", accent: "#FFF07A",
        surface: "#FFFFFF", surfaceAlt: "#FAFAF7",
        ink: "#111111", inkMuted: "#555555", onPrimary: "#111111",
      },
    },
  },
  {
    label: "very dark brand on light",
    dna: {
      ...DEFAULT_DESIGN_DNA,
      palette: {
        primary: "#0B1F3A", accent: "#123",
        surface: "#FFFFFF", surfaceAlt: "#EEF1F5",
        ink: "#0B0F19", inkMuted: "#4B5563", onPrimary: "#FFFFFF",
      },
    },
  },
];

const cases = [
  { label: "house default", dna: DEFAULT_DESIGN_DNA },
  ...PROFILES.map((profile) => ({ label: `profile: ${profile.slug}`, dna: profile.artDirection })),
  ...EXTREMES,
];

let failed = 0;
for (const { label, dna } of cases) {
  const tokens = compileDesignTokens(dna, { colourSource: "reference", clientBrandHex: null });
  const report = verifyHomepage("<main></main>", {} as never, tokens, BASE_STYLESHEET);
  const mark = report.blockers.length === 0 ? "ok  " : "FAIL";
  if (report.blockers.length) failed++;
  console.log(`  ${mark} ${label.padEnd(34)} ${report.blockers.length} blocker(s), ${report.findings.length} finding(s)`);
  for (const blocker of report.blockers) console.log(`       ${blocker.detail.slice(0, 150)}`);
}

if (failed) {
  console.error(`\n${failed} palette(s) would be refused by the release gate.\n`);
  process.exit(1);
}
console.log(`\ncontrast: ok (${cases.length} palettes)`);
