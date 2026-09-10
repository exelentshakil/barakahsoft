// Deterministic repair of mechanical token misuse, before a model call.
//
// This is NOT the colour normaliser that was deleted. That one rewrote every
// colour the model wrote, blindly, which is why every page converged on one
// palette however good the prompt was. This rewrites a short, closed list of
// declarations that are wrong by construction rather than by taste: a border
// token used as a text colour, a fill token used as a text colour. Those are
// not design decisions the model made and lost — they are the wrong slot.
//
// Doing it here rather than in the repair round matters for cost and for
// focus. A build that spends a 25k-token model call re-colouring a caption has
// spent it on the one class of problem code can settle exactly, and the model
// arrives at the real findings — composition, ambition, balance — with its
// attention undivided.

import postcss, { type Declaration } from "postcss";

/**
 * Tokens that exist, but never as `color`.
 *
 * Each maps to what the author almost certainly meant. `--muted` and
 * `--on-ground` are ground-relative custom properties, so the substitution
 * stays correct on a light section and a dark one alike.
 */
const NOT_TEXT: Record<string, string> = {
  "--line": "var(--muted)",
  "--line-strong": "var(--muted)",
  "--line-on-dark": "var(--muted)",
  "--rule": "var(--muted)",
  "--brand": "var(--on-ground)",
  "--brand-ground": "var(--on-ground)",
  "--brand-wash": "var(--on-ground)",
  "--dark": "var(--ink)",
  "--dark-2": "var(--ink)",
};

/** Below this, text is not readable at any contrast ratio. */
const MIN_FONT_PX = 11;

export interface Remediation {
  css: string;
  changes: string[];
}

export function remediateCss(css: string): Remediation {
  const changes: string[] = [];
  let root: postcss.Root;
  try {
    root = postcss.parse(css);
  } catch {
    return { css, changes };
  }

  root.walkDecls((decl: Declaration) => {
    const selector = (decl.parent as { selector?: string } | undefined)?.selector ?? "";

    if (decl.prop === "color" || decl.prop === "fill") {
      const match = decl.value.match(/var\(\s*(--[\w-]+)/);
      const token = match?.[1];
      if (token && NOT_TEXT[token]) {
        changes.push(`${selector}: ${decl.prop}: var(${token}) → ${NOT_TEXT[token]}`);
        decl.value = NOT_TEXT[token];
      }
    }

    // A literal font-size under 11px is unreadable whatever it is painted in,
    // and no compiled step of the scale goes there — so it is always a
    // hand-typed value and always wrong.
    if (decl.prop === "font-size" && !decl.value.includes("var(")) {
      const px = decl.value.match(/^(\d+(?:\.\d+)?)px$/);
      if (px && Number(px[1]) < MIN_FONT_PX) {
        changes.push(`${selector}: font-size: ${decl.value} → var(--fs-0)`);
        decl.value = "var(--fs-0)";
      }
    }
  });

  return { css: root.toString(), changes };
}
