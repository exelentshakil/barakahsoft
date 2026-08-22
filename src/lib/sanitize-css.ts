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
      out.push(`${prelude} {${bodyText}}`);
    } else if (NESTED_AT_RULE.test(prelude)) {
      out.push(`${prelude} {\n${scopeBlocks(bodyText, depth + 1)}\n}`);
    } else if (prelude.startsWith("@")) {
      // An at-rule that is neither known-safe nor known-nested is dropped
      // rather than guessed at.
    } else {
      const scoped = scopeSelectorList(prelude);
      if (scoped) out.push(`${scoped} {${bodyText}}`);
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
