// The rendered half of the audit.
//
// Static analysis cannot see a page. Contrast depends on what a node actually
// sits on after inheritance and stacking; measure depends on the font that
// actually loaded; alignment depends on where boxes actually landed. All of
// that needs a browser, so this loads the real page and measures it.
//
// Two passes over one render:
//
// SAFETY — the prohibitions. Contrast, measure, tap targets, layout shift.
//
// AMBITION — the requirements. This is the pass that was missing, and its
// absence is why safe, flat, obviously-machine-made pages sailed through. A
// page can satisfy every prohibition and still be timid; timid is a finding.

import { chromium, type Browser } from "playwright";
import type { AuditFinding } from "./audit";
import { BODY_RATIO, DISPLAY_RATIO } from "./colour";
import { MIN_SCALE_CONTRAST, MIN_DISPLAY_PX } from "./type";
import { MIN_SECTION_PAD_PX } from "./space";

export interface RenderedMetrics {
  contrastFailures: Array<{ selector: string; ratio: number; size: number; colour: string; ground: string }>;
  measureChars: number;
  brandAreaShare: number;
  darkAreaShare: number;
  displayPx: number;
  bodyPx: number;
  scaleContrast: number;
  heroVh: number;
  heroWords: number;
  fullBleedCount: number;
  gridBreaks: number;
  largestGapPx: number;
  tallestImageVh: number;
  sectionPadMinPx: number;
  offGridEdges: number;
  motionBound: number;
  hasTexture: boolean;
  smallTapTargets: number;
  overflowsX: boolean;
  /** Which element sticks out, so a repair round has something to act on. */
  widestOffender: string;
}

const VIEWPORT = { width: 1440, height: 900 };

/** Runs in the page. Everything here must be self-contained. */
/* eslint-disable @typescript-eslint/no-explicit-any */
function collect(): RenderedMetrics {
  const page = document.querySelector(".bespoke-page") as HTMLElement | null;
  const root: HTMLElement = page ?? document.body;

  const luminance = (rgb: number[]): number => {
    const [r, g, b] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const parse = (value: string): number[] | null => {
    const m = value.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length < 3) return null;
    if (parts.length >= 4 && parts[3] === 0) return null;
    return parts.slice(0, 3);
  };
  const ratio = (a: number[], b: number[]): number => {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };
  // The ground a node actually sits on: the nearest ancestor painting an
  // opaque background. Reading background-color off the node itself reports
  // rgba(0,0,0,0) for almost everything and silently passes every pair.
  const groundOf = (el: HTMLElement): number[] => {
    let node: HTMLElement | null = el;
    while (node) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      if (bg) return bg;
      node = node.parentElement;
    }
    return [255, 255, 255];
  };
  const label = (el: Element): string => {
    const id = el.id ? `#${el.id}` : "";
    const cls = typeof el.className === "string" && el.className ? `.${el.className.trim().split(/\s+/)[0]}` : "";
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };

  const contrastFailures: RenderedMetrics["contrastFailures"] = [];
  let displayPx = 0;
  let bodyPx = 0;
  let measureChars = 0;
  let brandArea = 0;
  let darkArea = 0;
  let totalArea = 0;
  let smallTapTargets = 0;

  const viewportArea = window.innerWidth * window.innerHeight;
  const all = Array.from(root.querySelectorAll<HTMLElement>("*"));

  for (const el of all) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (style.display === "none" || style.visibility === "hidden") continue;

    const bg = parse(style.backgroundColor);
    if (bg && rect.width > 40 && rect.height > 40) {
      const area = rect.width * rect.height;
      totalArea += area;
      const lum = luminance(bg);
      const chroma = Math.max(...bg) - Math.min(...bg);
      if (chroma > 40) brandArea += area;
      if (lum < 0.16) darkArea += area;
    }

    const text = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => (n.textContent ?? "").trim())
      .join(" ")
      .trim();

    if (text.length > 1) {
      const size = parseFloat(style.fontSize);
      const weight = Number(style.fontWeight) || 400;
      const colour = parse(style.color);
      if (colour) {
        const ground = groundOf(el);
        const r = ratio(colour, ground);
        // WCAG "large text": 24px, or 18.66px at 700+.
        const isLarge = size >= 24 || (size >= 18.66 && weight >= 700);
        const floor = isLarge ? 4.5 : 7;
        if (r < floor) {
          contrastFailures.push({
            selector: label(el),
            ratio: Math.round(r * 100) / 100,
            size: Math.round(size),
            colour: style.color,
            ground: `rgb(${ground.join(",")})`,
          });
        }
      }
      if (size > displayPx) displayPx = size;
      // Body size: the size most of the running copy is actually set in.
      if (text.length > 90 && (bodyPx === 0 || size < bodyPx)) {
        bodyPx = size;
        // Counted, not estimated. Dividing the box width by half the font size
        // assumes an average glyph width and was reporting 83 characters for a
        // paragraph capped at 66ch. A Range gives one client rect per rendered
        // line, so characters-per-line falls out of the text length directly
        // and is right for any face.
        let lines = 1;
        try {
          const range = document.createRange();
          range.selectNodeContents(el);
          lines = Math.max(1, range.getClientRects().length);
        } catch {
          lines = Math.max(1, Math.round(rect.height / (size * 1.5)));
        }
        measureChars = Math.round(text.length / lines);
      }
    }

    if ((el.tagName === "A" || el.tagName === "BUTTON") && rect.width > 0) {
      if (rect.height < 40 && rect.width < 90) smallTapTargets += 1;
    }
  }

  // ── ambition ──
  const vh = window.innerHeight;
  const sections = Array.from(root.querySelectorAll<HTMLElement>("section, [data-section]"));
  const hero = sections[0] ?? (root.firstElementChild as HTMLElement | null);
  const heroRect = hero?.getBoundingClientRect();
  const heroVh = heroRect ? Math.round((heroRect.height / vh) * 100) : 0;
  const heroHeading = hero?.querySelector("h1");
  const heroWords = heroHeading ? (heroHeading.textContent ?? "").trim().split(/\s+/).filter(Boolean).length : 0;

  let fullBleedCount = 0;
  let gridBreaks = 0;
  let sectionPadMinPx = Number.POSITIVE_INFINITY;
  let offGridEdges = 0;
  const pageWidth = root.getBoundingClientRect().width;

  for (const el of all) {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    if (rect.width >= pageWidth - 2 && rect.height > 80) fullBleedCount += 1;
    const mt = parseFloat(style.marginTop);
    const ml = parseFloat(style.marginLeft);
    if (mt < -8 || ml < -8) gridBreaks += 1;
    if (Math.abs(parseFloat(style.rotate || "0")) > 0.5 || /rotate/.test(style.transform)) gridBreaks += 1;
  }

  for (const section of sections) {
    const style = getComputedStyle(section);
    const pad = Math.min(parseFloat(style.paddingTop), parseFloat(style.paddingBottom));
    if (Number.isFinite(pad) && pad > 0) sectionPadMinPx = Math.min(sectionPadMinPx, pad);
  }
  if (!Number.isFinite(sectionPadMinPx)) sectionPadMinPx = 0;

  // Alignment: how many block edges miss the dominant left edge. A handful is
  // composition; a spread of near-misses is drift.
  const lefts = new Map<number, number>();
  for (const el of all) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 200 || rect.height < 40) continue;
    const key = Math.round(rect.left);
    lefts.set(key, (lefts.get(key) ?? 0) + 1);
  }
  const sorted = [...lefts.entries()].sort((a, b) => b[1] - a[1]);
  const dominant = sorted.slice(0, 3).map(([x]) => x);
  for (const [x, n] of sorted) {
    if (dominant.some((d) => Math.abs(d - x) <= 2)) continue;
    if (dominant.some((d) => Math.abs(d - x) <= 14)) offGridEdges += n;
  }

  // Largest vertical gap between consecutive section boundaries plus padding.
  let largestGapPx = 0;
  for (const section of sections) {
    const style = getComputedStyle(section);
    largestGapPx = Math.max(largestGapPx, parseFloat(style.paddingTop) + parseFloat(style.paddingBottom));
  }

  let tallestImageVh = 0;
  for (const img of Array.from(root.querySelectorAll("img, picture, video"))) {
    const rect = img.getBoundingClientRect();
    tallestImageVh = Math.max(tallestImageVh, Math.round((rect.height / vh) * 100));
  }

  // Which element actually sticks out. "There is horizontal overflow" is not
  // something a repair round can act on; "this element is 84px wider than the
  // viewport" is.
  let widestOffender = "";
  let worstOverhang = 0;
  for (const el of all) {
    const rect = el.getBoundingClientRect();
    const overhang = Math.round(rect.right - window.innerWidth);
    if (overhang > worstOverhang && rect.width > 8) {
      worstOverhang = overhang;
      widestOffender = `${label(el)} +${overhang}px`;
    }
  }

  const motionBound = root.querySelectorAll("[data-reveal], [data-reveal-armed], [data-count-to], [data-review-slider]").length;
  // display:none does not clear backgroundImage, so reading the image alone
  // reports texture on a page whose grain layer has been switched off.
  const pageStyle = getComputedStyle(root, "::after");
  const grainPainted =
    /url\(/.test(pageStyle.backgroundImage) &&
    pageStyle.display !== "none" &&
    pageStyle.content !== "none" &&
    parseFloat(pageStyle.opacity || "1") > 0.005;
  const hasTexture = grainPainted || root.querySelector("[class*=grain],[class*=noise]") !== null;

  return {
    contrastFailures: contrastFailures.slice(0, 25),
    measureChars,
    brandAreaShare: totalArea ? Math.round((brandArea / totalArea) * 100) : 0,
    darkAreaShare: totalArea ? Math.round((darkArea / totalArea) * 100) : 0,
    displayPx: Math.round(displayPx),
    bodyPx: Math.round(bodyPx),
    scaleContrast: bodyPx ? Math.round((displayPx / bodyPx) * 10) / 10 : 0,
    heroVh,
    heroWords,
    fullBleedCount,
    gridBreaks,
    largestGapPx: Math.round(largestGapPx),
    tallestImageVh,
    sectionPadMinPx: Math.round(sectionPadMinPx),
    offGridEdges,
    motionBound,
    hasTexture,
    smallTapTargets,
    overflowsX: document.documentElement.scrollWidth > window.innerWidth + 2,
    widestOffender,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface RenderedAudit {
  metrics: RenderedMetrics;
  mobile: { overflowsX: boolean; smallTapTargets: number; contrastFailures: number };
  findings: AuditFinding[];
  screenshot: Buffer;
}

/**
 * What to measure: a live URL, or a document that does not exist anywhere yet.
 *
 * The build needs the second. The audit runs before the page is persisted —
 * auditing after would mean shipping a failure and repairing it in public —
 * so at that point there is no URL to load.
 */
export type AuditTarget = { url: string } | { html: string };

export async function auditRendered(target: AuditTarget, existing?: Browser): Promise<RenderedAudit> {
  // channel: "chromium" runs the full browser rather than the headless shell.
  // Playwright defaults headless launches to the shell, which is a separate
  // ~95MB download; the full binary is already present for the visual-QA
  // worker, so this reuses it instead of requiring a second one. It also
  // renders identically to what a visitor sees, which for an audit that
  // measures composition is the right engine to be measuring in.
  const browser = existing ?? (await chromium.launch({ headless: true, channel: "chromium" }));
  try {
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    const page = await context.newPage();

    // "load", not "networkidle". networkidle waits for the network to go quiet
    // for half a second, so one slow CDN or one dead image URL stalls the whole
    // audit for the full timeout — and every repair round pays it again. A page
    // being measured for composition does not need every asset settled; it
    // needs layout and fonts, which are waited for explicitly below.
    if ("url" in target) {
      await page.goto(target.url, { waitUntil: "load", timeout: 30_000 }).catch(() => {});
    } else {
      await page.setContent(target.html, { waitUntil: "load", timeout: 30_000 }).catch(() => {});
    }
    // Fonts decide measure and scale contrast; measuring before they land
    // reports the fallback's numbers, which is the wrong page. Bounded, because
    // a webfont that never arrives must not stop the audit either.
    await Promise.race([
      page.evaluate(() => document.fonts.ready.then(() => undefined)),
      page.waitForTimeout(6_000),
    ]);
    // A beat for layout to settle after the fonts swap in.
    await page.waitForTimeout(250);

    // esbuild's keepNames transform (which tsx applies) wraps every function
    // declaration in a __name() call. When collect() is serialised into the
    // page that helper does not exist there and every evaluate throws
    // "__name is not defined".
    //
    // Injected after load rather than through addInitScript, because init
    // scripts only run on navigation and setContent does not trigger one — so
    // the init-script version worked for a URL and failed for a document.
    // Passed as a string so this line is not itself transformed.
    const shim = "globalThis.__name = globalThis.__name || function (fn) { return fn; };";
    await page.evaluate(shim);

    const metrics = (await page.evaluate(collect)) as RenderedMetrics;
    const screenshot = await page.screenshot({ type: "jpeg", quality: 80, fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await page.evaluate(shim);
    const small = (await page.evaluate(collect)) as RenderedMetrics;
    await context.close();

    const findings = judge(metrics, small);
    return {
      metrics,
      mobile: { overflowsX: small.overflowsX, smallTapTargets: small.smallTapTargets, contrastFailures: small.contrastFailures.length },
      findings,
      screenshot,
    };
  } finally {
    if (!existing) await browser.close();
  }
}

function judge(m: RenderedMetrics, mobile: RenderedMetrics): AuditFinding[] {
  const out: AuditFinding[] = [];
  const add = (check: string, severity: AuditFinding["severity"], detail: string) => out.push({ check, severity, detail });

  // ── safety ──
  if (m.contrastFailures.length) {
    const worst = m.contrastFailures.slice().sort((a, b) => a.ratio - b.ratio)[0];
    add(
      "contrast",
      "blocker",
      `${m.contrastFailures.length} text/ground pair(s) below the floor (body ${BODY_RATIO}:1, large ${DISPLAY_RATIO}:1). ` +
        `Worst: ${worst.selector} at ${worst.ratio}:1 — ${worst.colour} on ${worst.ground}, ${worst.size}px.`
    );
  }
  if (m.measureChars > 0 && (m.measureChars < 55 || m.measureChars > 82)) {
    add("measure", "finding", `Body measure is ${m.measureChars} characters; the law wants 60–75.`);
  }
  if (m.brandAreaShare > 22) {
    add("colour-budget", "finding", `Brand colour covers ${m.brandAreaShare}% of painted area. The budget is roughly 10%; past 20% it stops reading as an accent.`);
  }
  if (m.overflowsX || mobile.overflowsX) {
    const where = [m.overflowsX ? `1440px (${m.widestOffender || "unknown"})` : "", mobile.overflowsX ? `390px (${mobile.widestOffender || "unknown"})` : ""]
      .filter(Boolean)
      .join(" and ");
    add("overflow", "blocker", `Horizontal overflow at ${where}.`);
  }
  if (mobile.smallTapTargets > 2) {
    add("tap-targets", "finding", `${mobile.smallTapTargets} interactive element(s) under 40px at 390px.`);
  }
  if (m.offGridEdges > 8) {
    add("alignment", "finding", `${m.offGridEdges} block edge(s) sit within 14px of a dominant column edge without matching it. Near-misses read as drift, not composition.`);
  }

  // ── ambition ──
  // Reported together, because one timid measurement is a choice and five is a
  // page nobody will pay for.
  const timid: string[] = [];
  if (m.scaleContrast < MIN_SCALE_CONTRAST) timid.push(`scale contrast ${m.scaleContrast}x (want ${MIN_SCALE_CONTRAST}x)`);
  if (m.displayPx < MIN_DISPLAY_PX) timid.push(`display type ${m.displayPx}px (want ${MIN_DISPLAY_PX}px)`);
  if (m.heroVh < 85) timid.push(`hero ${m.heroVh}vh (want 85vh)`);
  if (m.heroWords > 12) timid.push(`hero headline ${m.heroWords} words (want 12 or fewer)`);
  if (m.fullBleedCount < 3) timid.push(`${m.fullBleedCount} full-bleed moment(s) (want 3)`);
  if (m.gridBreaks < 1) timid.push("no deliberate grid break");
  if (m.sectionPadMinPx < MIN_SECTION_PAD_PX) timid.push(`tightest section padding ${m.sectionPadMinPx}px (want ${MIN_SECTION_PAD_PX}px)`);
  if (m.largestGapPx < 160) timid.push(`largest whitespace gap ${m.largestGapPx}px (want 160px)`);
  if (m.tallestImageVh < 70) timid.push(`tallest image ${m.tallestImageVh}vh (want 70vh)`);
  if (m.motionBound < 3) timid.push(`${m.motionBound} element(s) bound to motion`);
  if (!m.hasTexture) timid.push("no texture layer — bald flat colour");

  if (timid.length >= 4) {
    add("timid", "finding", `Clears every prohibition and is still a safe, flat page. ${timid.length} ambition floors missed: ${timid.join("; ")}.`);
  } else if (timid.length) {
    add("ambition", "note", `Ambition floors missed: ${timid.join("; ")}.`);
  }

  return out;
}
