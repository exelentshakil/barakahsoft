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
//
// WHAT THIS DELIBERATELY NO LONGER DOES: normalise colour. It used to rewrite
// every literal the model produced into a --bs-* token, and its last rule
// replaced EVERY color: declaration in a block. That is why every generated
// page converged on the same palette however good the prompt was — the design
// was being flattened after the fact. Colour is now solved upstream by the
// OKLCH engine, so there is nothing to correct here, and the audit reports a
// literal rather than silently rewriting it.

const BLOCKED_AT_RULES = /@(import|charset|namespace|document|-moz-document)\b/gi;

// url() is the main exfiltration and request vector, so it is allowed only
// where its argument is an asset this build already planned. Neutering it
// outright also killed every CSS background image, which rules out a
// full-bleed hero — one of the ambition floor's requirements — so a blanket
// ban was quietly costing the thing the page is being built for.
const URL_FUNCTION = /url\s*\(\s*(['"]?)([^'")]*)\1\s*\)/gi;

function filterUrls(css: string, allowed: string[]): string {
  const permitted = new Set(allowed.filter(Boolean));
  return css.replace(URL_FUNCTION, (match, _quote: string, href: string) => {
    const target = (href || "").trim();
    // Inline SVG carries no request and cannot exfiltrate; it is how the
    // grain and any decorative mark are drawn.
    if (/^data:image\/(svg\+xml|png|jpeg|webp|avif)[,;]/i.test(target)) return match;
    if (permitted.has(target)) return match;
    return "none";
  });
}

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
      let scoped = scopeSelectorList(prelude);
      if (scoped) {
        // Auto-correct reveal start state: if the model styled [data-reveal] with opacity: 0
        // instead of [data-reveal-armed], rewrite it so SSR / un-armed elements stay visible.
        if (/\[data-reveal\]/i.test(scoped) && !/\[data-reveal-armed\]/i.test(scoped) && /opacity\s*:\s*0/i.test(bodyText)) {
          scoped = scoped.replace(/\[data-reveal\](?!\w)/gi, "[data-reveal-armed]:not([data-revealed])");
        }
        // Auto-expand .is-revealed to also match the [data-revealed] attribute contract.
        if (/\.is-revealed\b/i.test(scoped)) {
          const attrVariant = scoped.replace(/\.is-revealed\b/gi, "[data-revealed]");
          scoped = `${scoped}, ${attrVariant}`;
        }
        out.push(`${scoped} {${bodyText}}`);
      }
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
export function sanitizeGeneratedCss(raw: string, allowedAssets: string[] = []): string {
  if (!raw) return "";

  const stripped = filterUrls(
    raw
      // Comments can hide blocked constructs from the filters below.
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(BLOCKED_AT_RULES, "/* blocked */"),
    allowedAssets
  )
    .replace(DANGEROUS_VALUES, "none")
    // CSS escapes are the standard way to smuggle a blocked keyword past a
    // textual filter.
    .replace(/\\[0-9a-f]{1,6}\s?/gi, "");

  const scoped = scopeBlocks(stripped);

  // A stylesheet that produced no rules means the model returned prose, or
  // markup, or something else that is not CSS.
  return scoped.trim().length < 40 ? "" : scoped.trim();
}
