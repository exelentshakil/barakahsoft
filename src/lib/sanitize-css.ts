// The safety boundary for model-authored CSS on a client's public site.
//
// Two jobs, and the second is the one that is easy to forget.
//
// SAFETY. CSS can make network requests (url(), @import), and historically
// could execute script (expression()). None of that is needed to style a
// page, so none of it survives.
//
// CONTAINMENT. Generated CSS must never reach the navigation, the footer,
// the admin, or the client portal that renders a preview of this page. A
// rule like `a { color: red }` would otherwise repaint the operator's own
// interface. Every selector is rewritten to sit under .bespoke-page, so the
// blast radius is exactly the generated body and nothing else.

const BLOCKED_AT_RULES = /@(import|charset|namespace|document|-moz-document)\b/gi;

// url() is the main exfiltration and request vector. Images come from the
// media plan and are placed as <img>, so CSS has no legitimate need for it.
const URL_FUNCTION = /url\s*\(/gi;

const DANGEROUS_VALUES = /(expression\s*\(|javascript\s*:|vbscript\s*:|-moz-binding|behavior\s*:)/gi;

/** At-rules whose contents are themselves rule blocks needing scoping. */
const NESTED_AT_RULE = /^@(media|supports|container|layer)\b/i;

/** At-rules that are self-contained and safe to pass through untouched. */
const STANDALONE_AT_RULE = /^@(keyframes|-webkit-keyframes|font-face|page|property|counter-style)\b/i;

const SCOPE = ".bespoke-page";

/**
 * Rewrite one selector list so every selector sits inside the page scope.
 *
 * `:root` is remapped rather than dropped: a model reasonably declares its
 * custom properties there, and silently discarding that block would leave
 * every var() reference in the stylesheet unresolved.
 */
function scopeSelectorList(selectors: string): string {
  return selectors
    .split(",")
    .map((raw) => {
      const selector = raw.trim();
      if (!selector) return "";

      if (/^(:root|html|body)$/i.test(selector)) return SCOPE;
      if (selector.startsWith(SCOPE)) return selector;

      // A bare element selector still needs scoping, and so does everything
      // else — there is no selector a generated page may apply globally.
      return `${SCOPE} ${selector}`;
    })
    .filter(Boolean)
    .join(", ");
}

/**
 * Normalize and auto-correct token usage and literal colors inside a rule block.
 *
 * Models (especially under varying temperatures or providers) frequently output:
 * 1. `color: var(--bs-primary)` or `color: var(--bs-accent)` on surface elements
 *    (which are fill tokens and violate contrast checks).
 * 2. Literal hex colors (#ffffff, #0f172a, #f59e0b, #e2e8f0, etc.).
 * 3. `rgba(0, 0, 0, 0.12)` shadows and transparent borders.
 *
 * Normalizing these here maps them to the contrast-checked design tokens, preventing
 * build-blocking failures while preserving the designer's intended visual hierarchy.
 */
function normalizeRuleBody(body: string, selector = ""): string {
  let text = body;

  // 1. Identify background context in this rule
  const bgMatch = text.match(/background(?:-color)?\s*:[^;]*var\(\s*(--bs-[a-z-]+)/i);
  const bgToken = bgMatch?.[1];

  const hasPrimaryBg = bgToken === "--bs-primary" || /background(?:-color)?\s*:[^;]*var\(\s*--bs-primary(?![a-z-])/i.test(text);
  const hasAccentBg = bgToken === "--bs-accent" || /background(?:-color)?\s*:[^;]*var\(\s*--bs-accent(?![a-z-])/i.test(text);
  const hasInvertBg = bgToken === "--bs-invert-surface" || /background(?:-color)?\s*:[^;]*var\(\s*--bs-invert-surface(?![a-z-])/i.test(text);

  // 2. Transform box-shadow literals containing rgba or hex into token shadows
  text = text.replace(/\bbox-shadow\s*:[^;]*?(?:rgba?|#[0-9a-f]{3,8}\b)[^;]*/gi, (_match) => {
    if (/hover|focus|lift/i.test(selector)) return "box-shadow: var(--bs-shadow-lift)";
    return "box-shadow: var(--bs-shadow-card)";
  });

  // 3. Star / rating / gold color literals
  text = text.replace(/#f59e0b|#fbbf24|#ffd700|#eab308|#d97706|#facc15|\bgold\b|\bgoldenrod\b/gi, "var(--bs-primary-on-surface)");

  // 4. Fix fill-only tokens (--bs-primary / --bs-accent) used as text, SVG fill, or stroke
  if (!hasPrimaryBg && !hasAccentBg) {
    text = text.replace(/(?<!-)\bcolor\s*:\s*var\(\s*--bs-primary(?![a-z-])(?:\s*,\s*[^)]+)?\s*\)(\s*!important)?/gi, "color: var(--bs-primary-on-surface)$1");
    text = text.replace(/(?<!-)\bcolor\s*:\s*var\(\s*--bs-accent(?![a-z-])(?:\s*,\s*[^)]+)?\s*\)(\s*!important)?/gi, "color: var(--bs-primary-on-surface)$1");
    text = text.replace(/\bfill\s*:\s*var\(\s*--bs-primary(?![a-z-])(?:\s*,\s*[^)]+)?\s*\)(\s*!important)?/gi, "fill: var(--bs-primary-on-surface)$1");
    text = text.replace(/\bfill\s*:\s*var\(\s*--bs-accent(?![a-z-])(?:\s*,\s*[^)]+)?\s*\)(\s*!important)?/gi, "fill: var(--bs-primary-on-surface)$1");
    text = text.replace(/\bstroke\s*:\s*var\(\s*--bs-primary(?![a-z-])(?:\s*,\s*[^)]+)?\s*\)(\s*!important)?/gi, "stroke: var(--bs-primary-on-surface)$1");
    text = text.replace(/\bstroke\s*:\s*var\(\s*--bs-accent(?![a-z-])(?:\s*,\s*[^)]+)?\s*\)(\s*!important)?/gi, "stroke: var(--bs-primary-on-surface)$1");
  } else if (hasPrimaryBg) {
    text = text.replace(/(?<!-)\bcolor\s*:\s*var\(\s*(?:--bs-primary|--bs-ink|--bs-ink-muted|--bs-primary-on-surface|--bs-accent)(?![a-z-])(?:\s*,\s*[^)]+)?\s*\)(\s*!important)?/gi, "color: var(--bs-on-primary)$1");
  } else if (hasAccentBg) {
    text = text.replace(/(?<!-)\bcolor\s*:\s*var\(\s*(?:--bs-accent|--bs-ink|--bs-primary|--bs-ink-muted|--bs-primary-on-surface)(?![a-z-])(?:\s*,\s*[^)]+)?\s*\)(\s*!important)?/gi, "color: var(--bs-on-accent)$1");
  }

  // Fix unreadable token pairs if invert background is present
  if (hasInvertBg) {
    text = text.replace(/(?<!-)\bcolor\s*:\s*var\(\s*(?:--bs-ink|--bs-ink-muted|--bs-surface|--bs-surface-alt|--bs-primary-on-surface|--bs-on-accent)(?![a-z-])(?:\s*,\s*[^)]+)?\s*\)(\s*!important)?/gi, "color: var(--bs-invert-ink)$1");
  }

  // 5. Black rgba/rgb -> token ink rgb
  text = text.replace(/rgba?\(\s*0\s*[, ]\s*0\s*[, ]\s*0(?:\s*[,/]\s*([0-9.]+%?))?\s*\)/gi, (_m, a) => {
    if (!a || a === "1" || a === "1.0" || a === "100%") return "var(--bs-ink)";
    return `rgb(var(--bs-ink-rgb) / ${a})`;
  });

  // 6. White rgba/rgb -> token surface rgb
  text = text.replace(/rgba?\(\s*255\s*[, ]\s*255\s*[, ]\s*255(?:\s*[,/]\s*([0-9.]+%?))?\s*\)/gi, (_m, a) => {
    if (!a || a === "1" || a === "1.0" || a === "100%") return "var(--bs-surface)";
    return `rgb(var(--bs-surface-rgb) / ${a})`;
  });

  // 7. Common named hex codes normalization
  // White / near-whites
  text = text.replace(/(background(?:-color)?\s*:[^;]*)\b(?:#ffffff|#fff|#f8fafc|#f9fafb|#fafafa|#f1f5f9|#f3f4f6|#f4f4f5|white)\b/gi, "$1var(--bs-surface)");
  text = text.replace(/((?<!-)\bcolor\s*:[^;]*)\b(?:#ffffff|#fff|white)\b/gi, (_match, prefix) => {
    if (hasPrimaryBg || hasAccentBg || hasInvertBg) return `${prefix}var(--bs-on-primary)`;
    return `${prefix}var(--bs-surface)`;
  });

  // Dark / Inks / Pure black
  text = text.replace(/((?<!-)\bcolor\s*:[^;]*)\b(?:#000000|#000|#0f172a|#1e293b|#111827|#18181b|#0b0f19|#030712|#27272a|black)\b/gi, "$1var(--bs-ink)");
  text = text.replace(/(background(?:-color)?\s*:[^;]*)\b(?:#000000|#000|#0b0f19|#0f172a|#1e293b|#111827|#18181b|black)\b/gi, "$1var(--bs-invert-surface)");

  // Muted text
  text = text.replace(/((?<!-)\bcolor\s*:[^;]*)\b(?:#64748b|#6b7280|#94a3b8|#475569|#71717a|#737373|#666666|#666|#555555|#555|#777777|#777|#888888|#888|#999999|#999)\b/gi, "$1var(--bs-ink-muted)");

  // Borders
  text = text.replace(/(border(?:-color|-top|-bottom|-left|-right)?\s*:[^;]*)\b(?:#e2e8f0|#e5e7eb|#cbd5e1|#d1d5db|#e4e4e7|#e0e0e0|#eee|#cccccc|#ccc|#dddddd|#ddd)\b/gi, "$1var(--bs-border-color)");

  // 8. 4-arg rgba/rgb with alpha: rgba(r, g, b, a) or rgb(r g b / a) -> primary alpha
  text = text.replace(/rgba?\(\s*\d+\s*[, ]\s*\d+\s*[, ]\s*\d+\s*[,/]\s*([0-9.]+%?)\s*\)/gi, (_m, a) => `rgb(var(--bs-primary-rgb) / ${a})`);

  // 9. 3-arg rgb without alpha: rgb(r, g, b) or rgb(r g b) -> context token
  text = text.replace(/((?<!-)\bcolor\s*:[^;]*)rgba?\(\s*\d+\s*[, ]\s*\d+\s*[, ]\s*\d+\s*\)/gi, "$1var(--bs-primary-on-surface)");
  text = text.replace(/(background(?:-color)?\s*:[^;]*)rgba?\(\s*\d+\s*[, ]\s*\d+\s*[, ]\s*\d+\s*\)/gi, "$1var(--bs-surface-alt)");
  text = text.replace(/(border(?:-color|-top|-bottom|-left|-right)?\s*:[^;]*)rgba?\(\s*\d+\s*[, ]\s*\d+\s*[, ]\s*\d+\s*\)/gi, "$1var(--bs-border-color)");
  text = text.replace(/rgba?\(\s*\d+\s*[, ]\s*\d+\s*[, ]\s*\d+\s*\)/gi, "var(--bs-primary-on-surface)");

  // 10. Any remaining hex values
  text = text.replace(/((?<!-)\bcolor\s*:[^;]*)#[0-9a-f]{3,8}\b/gi, "$1var(--bs-primary-on-surface)");
  text = text.replace(/(\b(?:fill|stroke)\s*:[^;]*)#[0-9a-f]{3,8}\b/gi, "$1var(--bs-primary-on-surface)");
  text = text.replace(/(background(?:-color)?\s*:[^;]*)#[0-9a-f]{3,8}\b/gi, "$1var(--bs-surface-alt)");
  text = text.replace(/(border(?:-color|-top|-bottom|-left|-right)?\s*:[^;]*)#[0-9a-f]{3,8}\b/gi, "$1var(--bs-border-color)");
  text = text.replace(/#[0-9a-f]{3,8}\b/gi, "var(--bs-primary-on-surface)");

  // 11. Final contrast contract
  if (hasPrimaryBg) {
    text = text.replace(/(?<!-)\bcolor\s*:[^;]+/gi, "color: var(--bs-on-primary)");
  } else if (hasAccentBg) {
    text = text.replace(/(?<!-)\bcolor\s*:[^;]+/gi, "color: var(--bs-on-accent)");
  } else if (hasInvertBg) {
    text = text.replace(/(?<!-)\bcolor\s*:[^;]+/gi, "color: var(--bs-invert-ink)");
  }

  return text;
}

/**
 * Walk the stylesheet block by block, scoping rules and recursing into
 * at-rules that contain them.
 *
 * A regex cannot do this correctly: media queries nest, and a naive pass
 * either scopes the at-rule's condition or misses the rules inside it.
 */
function scopeBlocks(css: string, depth = 0): string {
  if (depth > 4) return "";

  const out: string[] = [];
  let index = 0;

  while (index < css.length) {
    const braceStart = css.indexOf("{", index);
    if (braceStart === -1) break;

    const prelude = css.slice(index, braceStart).trim();

    // Find the matching close brace, counting nesting.
    let depthCount = 1;
    let cursor = braceStart + 1;
    while (cursor < css.length && depthCount > 0) {
      if (css[cursor] === "{") depthCount++;
      else if (css[cursor] === "}") depthCount--;
      cursor++;
    }
    const bodyText = css.slice(braceStart + 1, cursor - 1);

    if (!prelude) {
      index = cursor;
      continue;
    }

    if (STANDALONE_AT_RULE.test(prelude)) {
      // Keyframes and font-face carry no selectors that could escape.
      out.push(`${prelude} {${normalizeRuleBody(bodyText, prelude)}}`);
    } else if (NESTED_AT_RULE.test(prelude)) {
      out.push(`${prelude} {\n${scopeBlocks(bodyText, depth + 1)}\n}`);
    } else if (prelude.startsWith("@")) {
      // An at-rule that is neither known-safe nor known-nested is dropped
      // rather than guessed at.
    } else {
      const scoped = scopeSelectorList(prelude);
      if (scoped) out.push(`${scoped} {${normalizeRuleBody(bodyText, scoped)}}`);
    }

    index = cursor;
  }

  return out.join("\n");
}

/**
 * Sanitize and scope a generated stylesheet.
 *
 * Returns an empty string when nothing survives, which callers must treat as
 * a failed generation rather than a page with no styling.
 */
export function sanitizeGeneratedCss(raw: string): string {
  if (!raw) return "";

  const stripped = raw
    // Comments can hide blocked constructs from the filters below.
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(BLOCKED_AT_RULES, "/* blocked */")
    .replace(URL_FUNCTION, "none(")
    .replace(DANGEROUS_VALUES, "none")
    // CSS escapes are the standard way to smuggle a blocked keyword past a
    // textual filter.
    .replace(/\\[0-9a-f]{1,6}\s?/gi, "");

  const scoped = scopeBlocks(stripped);

  // A stylesheet that produced no rules means the model returned prose, or
  // markup, or something else that is not CSS.
  return scoped.trim().length < 40 ? "" : scoped.trim();
}
