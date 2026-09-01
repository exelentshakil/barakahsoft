// The DOM plumbing behind live editing, kept out of the editor component.
//
// The generated page is server-rendered from HTML and CSS stored in the
// database, so every operator edit used to end in window.location.reload():
// save, wait, watch the page flash, find your place again, discover the fix
// was a pixel out, repeat. For the edits this tool actually exists for — a
// heading two sizes too big, a colour that vanished because its token was
// never defined — the reload was most of the cost of the fix.
//
// Everything here changes the page you are already looking at. The save
// still happens, and the server's stored copy is still the source of truth;
// it just stops being the only way to see what you did.

/** The generated stylesheet, rendered by BespokeChrome with a stable marker. */
function generatedSheet(): HTMLStyleElement | null {
  return document.querySelector<HTMLStyleElement>('style[data-href="bespoke-css"]');
}

function liveSheet(): HTMLStyleElement {
  let sheet = document.querySelector<HTMLStyleElement>("style[data-op-live-css]");
  if (!sheet) {
    sheet = document.createElement("style");
    sheet.setAttribute("data-op-live-css", "1");
    // Last in <head> so it also wins ties against the generated sheet.
    document.head.appendChild(sheet);
  }
  return sheet;
}

/**
 * Show `css` as the page's stylesheet, right now.
 *
 * The generated sheet is DISABLED rather than left in place, because the
 * alternative — layering an override sheet on top — can only ever add. Half
 * the fixes made here are deletions: a stray `display:none`, a max-width
 * that crushes a column, the `opacity:0` on an animation that never ran.
 * Those have to be removable, so the draft has to be the whole sheet.
 */
export function applyLiveCss(css: string): void {
  const generated = generatedSheet();
  if (generated) generated.media = "not all";
  liveSheet().textContent = css;
}

/** Hand the page back to its own stylesheet. */
export function clearLiveCss(): void {
  const generated = generatedSheet();
  if (generated) generated.media = "";
  document.querySelector("style[data-op-live-css]")?.remove();
}

/**
 * Swap one section's markup in place.
 *
 * Returns false without touching the page when the draft does not parse to
 * exactly one element — which is the normal state of a textarea someone is
 * halfway through typing into. A half-written tag should look like nothing
 * happening, not like the section was deleted.
 */
export function replaceSection(id: string, html: string): boolean {
  const current = document.getElementById(id);
  if (!current) return false;

  // Cheap balance check first, because the HTML parser is too forgiving to
  // be the guard on its own: it happily closes `<section id="x"><div>` for
  // you, so a draft truncated mid-edit still parses to one element and the
  // section visibly loses everything after the cut. Requiring the draft to
  // begin and end on a tag boundary, with brackets balanced, keeps those
  // states looking like nothing happening.
  const trimmed = html.trim();
  const opens = (trimmed.match(/</g) ?? []).length;
  const closes = (trimmed.match(/>/g) ?? []).length;
  if (!trimmed.startsWith("<") || !trimmed.endsWith(">") || opens !== closes) return false;

  const holder = document.createElement("div");
  holder.innerHTML = trimmed;
  const next = holder.firstElementChild;
  if (!next || holder.children.length !== 1) return false;
  // The id is the handle every later edit is found by; a draft that drops it
  // would apply once and then be unreachable.
  if (!next.id) next.id = id;

  current.replaceWith(next);
  rearmRuntime();
  return true;
}

/**
 * Ask BespokeRuntime to re-bind after the DOM changed under it.
 *
 * Its click handling is delegated from the page root and survives a swap,
 * but anything held per element does not: the reveal observers, the counters,
 * the review slider. Without this a replaced section comes back invisible,
 * because its [data-reveal] elements are still waiting to be observed.
 */
export function rearmRuntime(): void {
  window.dispatchEvent(new CustomEvent("bespoke:rearm"));
}

/** Editing furniture that must never be saved back into the markup. */
const EDIT_ATTRS = ["contenteditable", "data-op-edit", "data-op-picked"];

/** Read an element back out of the DOM with the editing furniture removed. */
export function serialiseElement(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement;
  for (const node of [clone, ...Array.from(clone.querySelectorAll<HTMLElement>("*"))]) {
    for (const attr of EDIT_ATTRS) node.removeAttribute(attr);
    node.style.removeProperty("outline");
    node.style.removeProperty("outline-offset");
    if (node.getAttribute("style") === "") node.removeAttribute("style");
  }
  return clone.outerHTML;
}

/**
 * A CSS selector that reaches the clicked element and as little else.
 *
 * Anchored on the nearest ancestor with an id — which on a generated page is
 * always the section — so a rule written here cannot escape the section it
 * was written in. Classes are preferred over positions because they survive
 * the section being rebuilt; :nth-of-type is added only where a tag would
 * otherwise be ambiguous among its siblings.
 */
export function selectorFor(el: HTMLElement): { selector: string; matches: number } {
  const parts: string[] = [];
  let node: HTMLElement | null = el;

  while (node && node !== document.body && parts.length < 6) {
    if (node.id) {
      parts.unshift(`#${CSS.escape(node.id)}`);
      break;
    }

    const classes = Array.from(node.classList).filter((c) => !c.startsWith("op-"));
    let part = node.tagName.toLowerCase();
    if (classes.length) part += classes.map((c) => `.${CSS.escape(c)}`).join("");

    const twins = Array.from(node.parentElement?.children ?? []).filter((s) => s.tagName === node!.tagName);
    if (twins.length > 1 && classes.length === 0) part += `:nth-of-type(${twins.indexOf(node) + 1})`;

    parts.unshift(part);
    node = node.parentElement;
  }

  const selector = `.bespoke-page ${parts.join(" ")}`.replace(/\s+/g, " ").trim();
  let matches = 0;
  try {
    matches = document.querySelectorAll(selector).length;
  } catch {
    matches = 0;
  }
  return { selector, matches };
}

/**
 * The same selector, widened to every element that looks like this one.
 *
 * Drops the id anchor and the positional steps and keeps the class list, so
 * `#services … div.bs-card:nth-of-type(2)` becomes `.bespoke-page .bs-card`.
 * Fixing one card and then hunting its five siblings by hand is what makes a
 * tool like this tiring on the second day.
 */
export function broadSelector(selector: string): string {
  const last = selector.trim().split(/\s+/).pop() ?? "";
  const classes = last.replace(/:nth-of-type\(\d+\)/g, "").match(/\.[A-Za-z0-9_-]+/g);
  if (!classes?.length) return selector;
  return `.bespoke-page ${classes.join("")}`;
}

export interface Override {
  selector: string;
  declarations: Record<string, string>;
}

const BLOCK_START = "/* operator overrides — written by the on-page inspector */";

/**
 * Fold the inspector's rules into the stylesheet as one clearly marked block
 * at the end.
 *
 * Kept as a single re-written block rather than appended rules so that
 * nudging the same heading four times leaves one rule behind instead of
 * four, and so an operator reading the stylesheet later can see exactly
 * which rules came from clicking rather than from the generator.
 */
export function withOverrides(baseCss: string, overrides: Override[]): string {
  const base = baseCss.split(BLOCK_START)[0].trimEnd();
  const live = overrides.filter((o) => Object.keys(o.declarations).length > 0);
  if (live.length === 0) return base;

  const block = live
    .map((o) => {
      const body = Object.entries(o.declarations)
        .map(([prop, value]) => `  ${prop}: ${value};`)
        .join("\n");
      return `${o.selector} {\n${body}\n}`;
    })
    .join("\n");

  return `${base}\n\n${BLOCK_START}\n${block}\n`;
}

/** Read back the rules the inspector wrote, so reopening resumes them. */
export function readOverrides(css: string): Override[] {
  const block = css.split(BLOCK_START)[1];
  if (!block) return [];

  const out: Override[] = [];
  const rule = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = rule.exec(block))) {
    const declarations: Record<string, string> = {};
    for (const decl of match[2].split(";")) {
      const colon = decl.indexOf(":");
      if (colon < 1) continue;
      declarations[decl.slice(0, colon).trim()] = decl.slice(colon + 1).trim();
    }
    if (Object.keys(declarations).length) out.push({ selector: match[1].trim(), declarations });
  }
  return out;
}
