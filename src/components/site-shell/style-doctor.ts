// What is wrong with this page, and the one click that fixes it.
//
// The style inspector started as a property editor: swatches, sliders, a
// selector. That is the right tool once you already know what to change,
// and every real fix so far has failed at the step before — noticing. The
// hero headline shipped navy-on-near-black at 1.0:1 and looked, at a
// glance, like a design choice. The tokens sanitize-css.ts writes into
// pages were never defined, so `color` was dropped as invalid and the text
// inherited whatever its parent had; nothing about that looks like a bug
// either, it just looks like the wrong colour.
//
// So the panel says what is wrong first and offers the fix as a button.
// Everything here is a check with a remedy attached — a finding nobody can
// act on without thinking is not worth showing.

export interface Fix {
  label: string;
  /** Shown after the label, e.g. a contrast ratio. */
  note?: string;
  declarations: Record<string, string>;
}

export interface Finding {
  id: string;
  severity: "bad" | "warn";
  title: string;
  detail: string;
  /** Present when a specific element is at fault. */
  element?: HTMLElement;
  /** The other elements with the identical problem, folded into this row. */
  siblings?: HTMLElement[];
  fixes: Fix[];
}

// ---------------------------------------------------------------------------
// Colour

function parse(value: string): [number, number, number, number] | null {
  const m = value.match(/[\d.]+/g);
  if (!m || m.length < 3) return null;
  return [Number(m[0]), Number(m[1]), Number(m[2]), m[3] === undefined ? 1 : Number(m[3])];
}

function luminance(r: number, g: number, b: number): number {
  const f = (v: number) => {
    const n = v / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(...a), luminance(...b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Composite `over` (which may be translucent) onto `under`. */
function blend(over: [number, number, number, number], under: [number, number, number]): [number, number, number] {
  const a = over[3];
  return [0, 1, 2].map((i) => Math.round(over[i] * a + under[i] * (1 - a))) as [number, number, number];
}

export interface Backdrop {
  rgb: [number, number, number];
  /** A photograph is somewhere in the stack, so the number is indicative only. */
  overImage: boolean;
}

/**
 * What is actually behind this element's text.
 *
 * Walks up compositing translucent layers rather than taking the first
 * background it finds, because the hero's readable panel IS a translucent
 * layer — `rgb(0 0 0 / .46)` over a photograph — and treating it as opaque
 * black or skipping it both give the wrong answer. When a photo is in the
 * stack the ratio cannot be exact, and saying so is better than a
 * confident number that is wrong for half the headline.
 */
export function backdropOf(el: HTMLElement): Backdrop {
  const layers: [number, number, number, number][] = [];
  let overImage = false;
  let node: HTMLElement | null = el;

  while (node) {
    const cs = getComputedStyle(node);
    if (cs.backgroundImage && cs.backgroundImage !== "none") overImage = true;
    const rgba = parse(cs.backgroundColor);
    if (rgba && rgba[3] > 0) {
      layers.push(rgba);
      if (rgba[3] >= 0.999) break;
    }
    // A sibling photograph filling the section counts as the backdrop too.
    if (node.querySelector(":scope > figure > img, :scope > img")) overImage = true;
    node = node.parentElement;
  }

  let base: [number, number, number] = [255, 255, 255];
  for (const layer of layers.reverse()) base = blend(layer, base);
  return { rgb: base, overImage };
}

// Brand tokens first, because the point of a palette is to be used. Ranking
// purely by contrast buries the client's own colour under white every time
// and quietly turns every page monochrome.
const TOKEN_CANDIDATES = ["--bs-accent", "--bs-primary", "--bs-ink", "--bs-surface"] as const;

/**
 * The ratio this particular text has to clear.
 *
 * WCAG asks 4.5:1 of body copy and 3:1 of large text, and the difference is
 * not pedantry here: a hero headline in the client's orange sits around
 * 3.0:1 on a dark slab. Held to the body-copy number it is reported as
 * broken and the only "fixes" offered are white and black — so the tool
 * would spend its life talking operators out of using the brand colour on
 * exactly the element the brand colour is for.
 */
export function requiredRatio(cs: CSSStyleDeclaration): number {
  const px = parseFloat(cs.fontSize) || 16;
  const bold = Number(cs.fontWeight) >= 700 || cs.fontWeight === "bold";
  return px >= 24 || (bold && px >= 18.66) ? 3 : 4.5;
}

function tokenRgb(root: HTMLElement, name: string): [number, number, number] | null {
  const raw = getComputedStyle(root).getPropertyValue(name).trim();
  if (!raw) return null;
  if (raw.startsWith("#")) {
    const hex = raw.slice(1);
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    if (full.length < 6) return null;
    return [0, 2, 4].map((o) => parseInt(full.slice(o, o + 2), 16)) as [number, number, number];
  }
  const rgba = parse(raw);
  return rgba ? [rgba[0], rgba[1], rgba[2]] : null;
}

/**
 * Every colour worth offering for this element, best contrast first.
 *
 * Tokens rather than hexes, so a fix applied today survives the client
 * changing their brand colour tomorrow — and so the page keeps expressing
 * its palette rather than accumulating literals.
 */
export function colourFixes(el: HTMLElement, root: HTMLElement): Fix[] {
  const backdrop = backdropOf(el);
  const need = requiredRatio(getComputedStyle(el));
  const options: { token: string; label: string; ratio: number; rgb: [number, number, number]; brand: boolean }[] = [];

  for (const token of TOKEN_CANDIDATES) {
    const rgb = tokenRgb(root, token);
    if (!rgb) continue;
    options.push({ token: `var(${token})`, label: token.replace("--bs-", ""), ratio: contrast(rgb, backdrop.rgb), rgb, brand: true });
  }
  options.push({ token: "#ffffff", label: "white", ratio: contrast([255, 255, 255], backdrop.rgb), rgb: [255, 255, 255], brand: false });
  options.push({ token: "#16181d", label: "near-black", ratio: contrast([22, 24, 29], backdrop.rgb), rgb: [22, 24, 29], brand: false });

  // --bs-surface is white on nearly every build, so offering both "surface"
  // and "white" is two buttons that do the same thing and one wasted slot.
  const seenColour = new Set<string>();
  const unique = options.filter((o) => {
    const key = o.rgb.join(",");
    return seenColour.has(key) ? false : (seenColour.add(key), true);
  });

  return unique
    .sort((a, b) => {
      const aOk = a.ratio >= need;
      const bOk = b.ratio >= need;
      if (aOk !== bOk) return aOk ? -1 : 1;          // readable first
      if (aOk && a.brand !== b.brand) return a.brand ? -1 : 1; // then the brand's own
      return b.ratio - a.ratio;
    })
    .slice(0, 4)
    .map((o) => ({
      label: o.label,
      note: `${backdrop.overImage ? "~" : ""}${o.ratio.toFixed(1)}:1`,
      declarations: { color: o.token },
      ok: o.ratio >= need - 0.05,
    }))
    // Failing options survive only when nothing passes, where they are at
    // least the least-bad — offering the colour that is already broken as a
    // fix is how a panel loses your trust on its first use.
    //
    // Two deliberate softenings, both learned from the hero this was built
    // for. The threshold gets a hair of tolerance because the brand orange
    // landed at 2.98 against a 3.0 bar and was struck out by 0.02 — on the
    // one element the client's own colour most belongs. And over a photo
    // nothing is filtered at all: the ratio there is an estimate against a
    // guessed backdrop, and an estimate has no business overruling the
    // operator's eyes about which colour to offer.
    .filter((o, _i, all) => (backdrop.overImage || !all.some((x) => x.ok) ? true : o.ok))
    .map(({ label, note, declarations }) => ({ label, note, declarations }));
}

// ---------------------------------------------------------------------------
// Per-element checks

// Form controls animate their own opacity, hide honeypots, and float their
// own labels. Every one of those looked like a finding, and four identical
// "nearly invisible" rows for hidden inputs is how a list like this stops
// being read.
const NOT_OUR_PROBLEM = new Set(["INPUT", "SELECT", "TEXTAREA", "OPTION", "BR", "HR", "SCRIPT", "STYLE"]);

export function inspect(el: HTMLElement, root: HTMLElement): Finding[] {
  if (NOT_OUR_PROBLEM.has(el.tagName)) return [];

  const findings: Finding[] = [];
  const cs = getComputedStyle(el);
  const text = (el.textContent ?? "").trim();
  const ownText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent?.trim());

  if (text && ownText) {
    const fg = parse(cs.color);
    const backdrop = backdropOf(el);
    const need = requiredRatio(cs);
    if (fg) {
      const ratio = contrast([fg[0], fg[1], fg[2]], backdrop.rgb);
      if (ratio < need) {
        findings.push({
          id: "contrast",
          severity: ratio < need * 0.6 ? "bad" : "warn",
          title: ratio < need * 0.6 ? "You can barely read this" : "This is harder to read than it should be",
          detail: backdrop.overImage
            ? `About ${ratio.toFixed(1)}:1 against what is behind it. It sits over a photo, so treat the number as a guide and trust your eyes.`
            : `${ratio.toFixed(1)}:1 against its background. This size of text wants ${need}:1 or better.`,
          element: el,
          fixes: colourFixes(el, root),
        });
      }
    }
  }

  // Small uppercase labels — stat captions, weekday chips, eyebrow text — are
  // a deliberate idiom, not a mistake, and this check first reported 26 of
  // them on one page. A list of 26 things you are supposed to ignore is a
  // list nobody opens twice, so the bar is now genuinely-unreadable only.
  const size = parseFloat(cs.fontSize);
  const microLabel = cs.textTransform === "uppercase" && parseFloat(cs.letterSpacing) > 0;
  if (text && ownText && size && size < 10 && !microLabel) {
    findings.push({
      id: "tiny",
      severity: "warn",
      title: "Too small to read",
      detail: `${size.toFixed(1)}px.`,
      element: el,
      fixes: [
        { label: "12px", declarations: { "font-size": "12px" } },
        { label: "14px", declarations: { "font-size": "14px" } },
      ],
    });
  }

  if (text && cs.opacity !== "1" && Number(cs.opacity) < 0.35) {
    findings.push({
      id: "faded",
      severity: "bad",
      title: "Nearly invisible",
      detail: `Opacity ${cs.opacity}. Usually a reveal animation that never ran.`,
      element: el,
      fixes: [{ label: "Make it visible", declarations: { opacity: "1" } }],
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Whole-page checks

/**
 * Tokens the stylesheet asks for and the page never defines.
 *
 * The failure that started all of this. An unresolvable var() in `color` is
 * invalid at computed-value time, so the browser drops the declaration and
 * the element silently inherits its parent's colour — white text on a white
 * card, with nothing in the stylesheet that looks wrong.
 */
export function undefinedTokens(css: string, root: HTMLElement): string[] {
  const used = new Set((css.match(/var\(\s*(--bs-[a-z0-9-]+)/gi) ?? []).map((m) => m.replace(/var\(\s*/i, "")));
  // A token DECLARED somewhere in the sheet resolves for the elements that
  // matter even when it does not inherit down to the page root — --bs-nav-bg
  // is declared on the nav and reported as missing by a root-only check,
  // which is a false alarm that sends you hunting a bug that is not there.
  const declared = new Set((css.match(/(--bs-[a-z0-9-]+)\s*:/gi) ?? []).map((m) => m.replace(/\s*:$/, "").trim().toLowerCase()));
  const style = getComputedStyle(root);
  return [...used]
    .filter((name) => !style.getPropertyValue(name).trim() && !declared.has(name.toLowerCase()))
    .sort();
}

/** A sensible literal for a token the page is missing, derived from its palette. */
export function suggestToken(name: string, root: HTMLElement): string {
  const style = getComputedStyle(root);
  const has = (n: string) => style.getPropertyValue(n).trim();
  const map: Record<string, string> = {
    "--bs-primary-on-surface": has("--bs-primary-strong") ? "var(--bs-primary-strong)" : "var(--bs-primary)",
    "--bs-accent-on-surface": has("--bs-accent-strong") ? "var(--bs-accent-strong)" : "var(--bs-accent)",
    "--bs-ink-muted": "var(--bs-muted, rgb(0 0 0 / 0.66))",
    "--bs-border-color": "var(--bs-line, rgb(0 0 0 / 0.1))",
    "--bs-border-width": "1px",
    "--bs-surface-rgb": "255 255 255",
    "--bs-invert-surface": "var(--bs-ink)",
    "--bs-invert-ink": "#ffffff",
    "--bs-shadow-card": "var(--bs-shadow, 0 18px 48px rgb(0 0 0 / 0.13))",
    "--bs-shadow-lift": "var(--bs-shadow-lg, 0 32px 80px rgb(0 0 0 / 0.22))",
    "--bs-radius-sm": "calc(var(--bs-r, 12px) / 2)",
    "--bs-radius-md": "var(--bs-r, 12px)",
    "--bs-radius-lg": "var(--bs-r-lg, 20px)",
    "--bs-radius-pill": "999px",
  };
  return map[name] ?? "var(--bs-ink)";
}

/**
 * Sweep the page for the things that make a build unsendable.
 *
 * Deliberately short. A check nobody acts on is noise, and noise is how a
 * list like this stops being read.
 */
export function scanPage(root: HTMLElement, css: string): Finding[] {
  const findings: Finding[] = [];

  const missing = undefinedTokens(css, root);
  if (missing.length) {
    findings.push({
      id: "tokens",
      severity: "bad",
      title: `${missing.length} colour${missing.length > 1 ? "s" : ""} point at nothing`,
      detail: `${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""} — the stylesheet uses these and the page never defines them, so anything styled with one falls back to inheriting its parent. This is what makes text turn up invisible.`,
      fixes: [
        {
          label: "Define them",
          declarations: Object.fromEntries(missing.map((name) => [name, suggestToken(name, root)])),
        },
      ],
    });
  }

  const seen = new Set<HTMLElement>();
  for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    if (findings.length > 24) break;
    if (el.closest("[data-operator-ui]")) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;

    for (const finding of inspect(el, root)) {
      // One finding per element keeps the list about places, not properties.
      if (seen.has(el)) break;
      seen.add(el);
      findings.push(finding);
    }
  }

  for (const img of Array.from(root.querySelectorAll("img"))) {
    if (img.complete && img.naturalWidth === 0) {
      findings.push({
        id: "image",
        severity: "bad",
        title: "An image did not load",
        detail: img.getAttribute("src")?.slice(0, 80) ?? "no src",
        element: img as HTMLElement,
        fixes: [],
      });
    }
  }

  // Only when the DOCUMENT actually scrolls sideways. Measuring elements
  // against the viewport instead reported the reviews carousel, whose track
  // is meant to be wider than the screen and is clipped by its parent —
  // a real overflow is one you can scroll to, and nothing else.
  const doc = document.documentElement;
  const scrollsSideways = doc.scrollWidth > doc.clientWidth + 2;
  const overflowing = scrollsSideways
    ? Array.from(root.querySelectorAll<HTMLElement>("*")).find((el) => {
        const cs = getComputedStyle(el);
        if (cs.position === "fixed") return false;
        if (el.getBoundingClientRect().right <= window.innerWidth + 2) return false;
        // The parent clips it, so it cannot be what is scrolling the page.
        return !el.parentElement || getComputedStyle(el.parentElement).overflowX === "visible";
      })
    : undefined;
  if (overflowing) {
    findings.push({
      id: "overflow",
      severity: "warn",
      title: "Something is wider than the screen",
      detail: "Causes a sideways scrollbar, which reads as broken on a phone.",
      element: overflowing,
      fixes: [{ label: "Contain it", declarations: { "max-width": "100%", overflow: "hidden" } }],
    });
  }

  return group(findings).sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "bad" ? -1 : 1));
}

/**
 * Collapse repeats of the same problem into one row.
 *
 * Six cards with the same washed-out label is one decision, not six, and a
 * list that makes you scroll is a list that gets closed. The first offender
 * keeps the "go to it" link; the count says how many others go with it, and
 * fixing it from here applies to all of them.
 */
function group(findings: Finding[]): Finding[] {
  const byKind = new Map<string, Finding[]>();
  for (const finding of findings) {
    const key = `${finding.id}|${finding.title}`;
    byKind.set(key, [...(byKind.get(key) ?? []), finding]);
  }

  return [...byKind.values()].map(([first, ...rest]) =>
    rest.length === 0
      ? first
      : {
          ...first,
          title: `${first.title} (${rest.length + 1} places)`,
          siblings: rest.map((f) => f.element).filter(Boolean) as HTMLElement[],
        }
  );
}
