// Unit checks for the design engines.
//
// These are pure functions, so the properties that make their output look
// hand-built are cheap to assert and expensive to lose. Wired into
// `npm run lint` alongside the other check-* scripts.

import { buildPalette, contrastOf, BODY_RATIO, DISPLAY_RATIO } from "../src/lib/design/colour";
import { buildType, MIN_SCALE_CONTRAST, MIN_DISPLAY_PX } from "../src/lib/design/type";
import { buildSpace, MIN_SECTION_PAD_PX } from "../src/lib/design/space";
import { buildMotion } from "../src/lib/design/motion";
import { compileDesignSystem } from "../src/lib/design";
import { treatImage, ASPECT_RATIOS } from "../src/lib/design/image";
import sharp from "sharp";

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

console.log("\nspace");

for (const rhythm of ["tight", "generous", "cinematic"] as const) {
  const sp = buildSpace({ rhythm, density: "regular" });
  // Every rhythm clears the ambition floor. "tight" still means 112px, because
  // the timid end of the range is the thing the law exists to prevent.
  ok(sp.meta.sectionMaxPx >= MIN_SECTION_PAD_PX, `${rhythm} section padding ${sp.meta.sectionMaxPx}px >= ${MIN_SECTION_PAD_PX}px`);
}

const sp = buildSpace({ rhythm: "cinematic", density: "regular" });
const halfUnit = sp.meta.unit / 2;
ok(sp.meta.steps.every((v) => Math.abs(v % halfUnit) < 0.001), `every spacing step lands on the ${halfUnit}px grid: ${sp.meta.steps.join(" ")}`);
ok(sp.meta.steps.every((v, i) => i === 0 || v > sp.meta.steps[i - 1]), "spacing scale is monotonic");
ok(
  [1, 2, 3].every((n) => parseInt(sp.tokens[`--overlap-${n}`], 10) % sp.meta.unit === 0),
  `overlap offsets are whole units, so a grid break still lands on grid (${sp.tokens["--overlap-1"]} ${sp.tokens["--overlap-2"]} ${sp.tokens["--overlap-3"]})`
);
ok(sp.tokens["--split-major"] === "1.618fr 1fr", `split ratios are real proportions, not 1fr 1fr (${sp.tokens["--split-major"]})`);
ok(/bleed-full/.test(sp.css) && /pull-up-1/.test(sp.css), "bleed levels and overlap utilities emitted");
ok(/@media\(max-width:860px\)/.test(sp.css), "primitives reflow without per-section media queries");

// Density genuinely changes the system rather than relabelling it.
const dense = buildSpace({ rhythm: "generous", density: "dense" });
const airy = buildSpace({ rhythm: "generous", density: "airy" });
ok(dense.meta.unit !== airy.meta.unit && dense.meta.ratio !== airy.meta.ratio, `density changes unit and ratio: ${dense.meta.unit}/${dense.meta.ratio} vs ${airy.meta.unit}/${airy.meta.ratio}`);

console.log("\nmotion");
const mo = buildMotion({ character: "dramatic" });
ok(/prefers-reduced-motion/.test(mo.css), "reduced-motion path present");
ok(
  /\[data-reveal-armed\]:not\(\[data-revealed\]\)\{opacity:0/.test(mo.css),
  "reveal hides on the armed attribute, so a no-JS render and the audit screenshot still show content"
);
ok(!/\[data-reveal\]\{opacity:0/.test(mo.css), "reveal does NOT hide on the bare attribute — that ships a blank page");
ok(/focus-visible/.test(mo.css), "focus ring present");
const calm = buildMotion({ character: "calm" });
ok(calm.meta.baseMs !== mo.meta.baseMs, `character changes duration: calm ${calm.meta.baseMs}ms vs dramatic ${mo.meta.baseMs}ms`);

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

console.log("\ncompiler");

const gymSystem = compileDesignSystem({
  colour: { brandHex: "#ED1C24", chroma: "vivid", warmth: "warm" },
  type: { displayFamily: "Anton", bodyFamily: "Inter", voice: "brutal", measure: 66 },
  space: { rhythm: "cinematic", density: "regular" },
  motion: { character: "dramatic" },
  radius: "sharp",
  texture: "grain",
});
const dentalSystem = compileDesignSystem({
  colour: { brandHex: "#0F6E56", chroma: "muted", warmth: "cool" },
  type: { displayFamily: "Outfit", bodyFamily: "Outfit", voice: "clinical", measure: 72 },
  space: { rhythm: "generous", density: "airy" },
  motion: { character: "calm" },
  radius: "rounded",
  texture: "grain",
});

ok(/\.bespoke-page :where\(\*/.test(gymSystem.css), "containment layer present, so host globals cannot leak in");
// Every ground utility must set a background AND a text colour AND the
// supporting colours in the same rule. Asserted structurally rather than as a
// literal string, so adding a token to the pair does not fail the check that
// the pair exists.
const groundRules = [...gymSystem.css.matchAll(/\.bespoke-page \.on-[a-z0-9-]+\{([^}]*)\}/g)].map((m) => m[1]);
ok(groundRules.length >= 6, `${groundRules.length} ground utilities emitted`);
ok(
  groundRules.every((rule) => /background:var\(/.test(rule) && /(^|;)color:var\(/.test(rule) && /--muted:var\(/.test(rule)),
  "every ground sets background, text and supporting colour together, so an unreadable section is not expressible"
);
ok(/position:fixed[^}]*background-image:url\("data:image\/svg/.test(gymSystem.css), "grain layer emitted");
ok(gymSystem.tokens["--radius"] === "0px" && dentalSystem.tokens["--radius"] === "16px", `radius differs: ${gymSystem.tokens["--radius"]} vs ${dentalSystem.tokens["--radius"]}`);

// The whole point: two leads, two genuinely different systems.
const differing = ["--paper", "--brand", "--ink", "--fs-8", "--s-6", "--dur", "--radius", "--font-body"].filter(
  (k) => gymSystem.tokens[k] !== dentalSystem.tokens[k]
);
ok(differing.length === 8, `two leads diverge across ${differing.length}/8 sampled tokens: ${differing.join(" ")}`);

// Voice must push the scale past the floor rather than sitting on it, or two
// leads sharing a body size share a headline size.
const brutal = buildType({ displayFamily: "Anton", bodyFamily: "Inter", voice: "brutal" });
const clinical = buildType({ displayFamily: "Outfit", bodyFamily: "Outfit", voice: "clinical" });
ok(brutal.meta.displayPx !== clinical.meta.displayPx, `voice changes display size: brutal ${brutal.meta.displayPx}px vs clinical ${clinical.meta.displayPx}px`);
ok(brutal.meta.scaleContrast >= MIN_SCALE_CONTRAST && clinical.meta.scaleContrast >= MIN_SCALE_CONTRAST, "both still clear the ambition floor");
ok(gymSystem.fontHref !== dentalSystem.fontHref, "different font stacks requested");

// No literal colour should escape into the emitted rules outside the token
// block itself - everything downstream must reference var().
const rulesOnly = gymSystem.css.split("\n\n").filter((block) => !block.startsWith(".bespoke-page{--")).join("\n");
const strayHex = rulesOnly.match(/#[0-9a-f]{3,8}\b/gi) ?? [];
ok(strayHex.length === 0, `no literal colours outside the token block (found ${strayHex.length})`);

async function imageChecks(): Promise<void> {
  console.log("\nimage");

  // A synthetic photograph: a colourful subject off-centre, so a centre crop
  // and a saliency crop cannot produce the same pixels.
  const source = await sharp({
    create: { width: 1600, height: 1200, channels: 3, background: { r: 120, g: 122, b: 118 } },
  })
    .composite([
      { input: await sharp({ create: { width: 260, height: 260, channels: 3, background: { r: 220, g: 60, b: 40 } } }).png().toBuffer(), left: 1180, top: 160 },
      { input: await sharp({ create: { width: 400, height: 300, channels: 3, background: { r: 40, g: 90, b: 150 } } }).png().toBuffer(), left: 80, top: 780 },
    ])
    .jpeg()
    .toBuffer();

  const warm = await treatImage(source, { aspect: "wide", width: 1200 }, { brandHex: "#ED1C24", ground: "light", strength: "moderate" });
  ok(warm.width === 1200 && warm.height === Math.round(1200 / ASPECT_RATIOS.wide), `wide crop is ${warm.width}x${warm.height}`);
  ok(warm.webp.length > 0 && warm.avif.length > 0, `both encodings produced (webp ${Math.round(warm.webp.length / 1024)}kb, avif ${Math.round(warm.avif.length / 1024)}kb)`);

  const tall = await treatImage(source, { aspect: "tall", width: 900 }, { brandHex: "#ED1C24", ground: "light" });
  ok(tall.height > tall.width, `tall aspect is portrait-shaped (${tall.width}x${tall.height})`);

  // The grade must actually depend on the palette, or every site's photography
  // looks the same regardless of brand.
  const cool = await treatImage(source, { aspect: "wide", width: 1200 }, { brandHex: "#0F6E56", ground: "light", strength: "moderate" });
  const warmStats = await sharp(warm.webp).stats();
  const coolStats = await sharp(cool.webp).stats();
  const warmBalance = warmStats.channels[0].mean - warmStats.channels[2].mean;
  const coolBalance = coolStats.channels[0].mean - coolStats.channels[2].mean;
  ok(
    Math.abs(warmBalance - coolBalance) > 1.5,
    `grade follows the brand: red-minus-blue ${warmBalance.toFixed(1)} vs ${coolBalance.toFixed(1)}`
  );

  // Subtle is the default and has to stay genuinely subtle — the guard against
  // the grade drifting back into being a look.
  //
  // Measured against a neutral-brand baseline rather than against zero. The
  // saliency crop is drawn to the red square, so the crop itself skews the
  // channel balance before any grading happens; an absolute threshold here
  // tests composition, not grade strength.
  const gentle = await treatImage(source, { aspect: "wide", width: 1200 }, { brandHex: "#ED1C24", ground: "light" });
  const neutral = await treatImage(source, { aspect: "wide", width: 1200 }, { brandHex: "#808080", ground: "light" });
  const balanceOf = async (buf: Buffer) => {
    const st = await sharp(buf).stats();
    return st.channels[0].mean - st.channels[2].mean;
  };
  const shift = Math.abs((await balanceOf(gentle.webp)) - (await balanceOf(neutral.webp)));
  ok(shift < 6, `default strength shifts balance by only ${shift.toFixed(1)} points against a neutral grade`);
  ok(shift > 0.5, `...but does shift it (${shift.toFixed(1)}), so the grade is doing something`);

  // And it must still be a photograph, not a duotone. sharp's tint() preserves
  // luminance and replaces chroma, which would flatten every image on the page
  // to one hue; a real grade leaves the subject's own colours distinguishable.
  const spread = warmStats.channels.map((c) => c.stdev);
  ok(Math.max(...spread) > 12, `image keeps its own colour (channel stdev ${spread.map((v) => v.toFixed(0)).join("/")}) — a duotone would collapse this`);
}

imageChecks()
  .then(() => {
    console.log(failed ? `\n${failed} check(s) failed\n` : "\nall design engine checks passed\n");
    process.exit(failed ? 1 : 0);
  })
  .catch((error) => {
    console.error("\nimage checks threw:", error);
    process.exit(1);
  });
