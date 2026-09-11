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
  // Every GROUND token, because a ground used as text is the same slot error
  // whichever end of the scale it sits at. The paper family was missing and
  // cost a whole build: `color: var(--paper-2)` on a light section measured
  // rgb(247,248,249) on rgb(246,251,255) — 1.02:1, white on white.
  //
  // All of them resolve to --muted rather than to a fixed token. --muted is
  // set by whichever ground the element actually sits in and is solved to
  // clear the body floor there, so it is right on a light section and a dark
  // one alike. --dark and --dark-2 used to map to var(--ink), which is only
  // correct over paper and painted dark-on-dark everywhere else.
  "--paper": "var(--muted)",
  "--paper-2": "var(--muted)",
  "--paper-3": "var(--muted)",
  "--dark": "var(--muted)",
  "--dark-2": "var(--muted)",
};

/** Below this, text is not readable at any contrast ratio. */
const MIN_FONT_PX = 11;

/**
 * The ground contract, as code.
 *
 * A ground is a PAIR — a background and the four things that have to change
 * with it: the text colour, and the three custom properties every supporting
 * colour reads through. The system ships that pair as utility classes
 * (.on-dark, .on-paper, .on-brand); a model that instead writes
 * `background: var(--dark)` on a class of its own gets the background and
 * none of the rest, so `--muted` still resolves to the LIGHT ground's ink and
 * paints 2.3:1 grey on near-black.
 *
 * That is not a design decision that went wrong. It is half a pair, and the
 * other half is entirely determined by which background was painted — so it
 * belongs here, settled for free, rather than in a 25k-token repair round
 * that has better things to look at.
 */
interface Ground {
  /** Text colour for this ground. */
  color: string;
  muted: string;
  onGround: string;
  rule: string;
  /** Text tokens that actually read on this ground. Anything else is the wrong pair. */
  legalText: string[];
}

const DARK: Ground = {
  color: "var(--on-dark)",
  muted: "var(--on-dark-2)",
  onGround: "var(--brand-on-dark)",
  rule: "var(--line-on-dark)",
  legalText: ["--on-dark", "--on-dark-2", "--brand-on-dark", "--paper", "--paper-2", "--paper-3"],
};

const PAPER: Ground = {
  color: "var(--ink)",
  muted: "var(--ink-2)",
  onGround: "var(--brand-ink)",
  rule: "var(--line)",
  legalText: ["--ink", "--ink-2", "--ink-3", "--brand-ink", "--brand-ink-lg", "--accent-ink", "--dark", "--dark-2"],
};

const BRAND: Ground = {
  color: "var(--on-brand-ground)",
  muted: "var(--brand-ground-muted)",
  onGround: "var(--on-brand-ground)",
  rule: "var(--brand-ground-muted)",
  legalText: ["--on-brand-ground", "--brand-ground-muted"],
};

/** Which ground a background token paints. */
const GROUND_OF: Record<string, Ground> = {
  "--dark": DARK,
  "--dark-2": DARK,
  "--ink": DARK,
  "--paper": PAPER,
  "--paper-2": PAPER,
  "--paper-3": PAPER,
  "--brand-ground": BRAND,
};

/**
 * The three properties are set by the ground the element sits in, so they read
 * correctly whichever ground that turns out to be. Never the wrong pair.
 */
const INHERITED_TEXT = ["--muted", "--on-ground", "--rule"];

function groundPainted(value: string): Ground | null {
  const tokens = [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1]);
  const grounds = tokens.filter((token) => token in GROUND_OF);
  // Exactly one, or this is a gradient or a layered background and which
  // ground the text ends up over is a real design question, not a slot error.
  if (grounds.length !== 1) return null;
  return GROUND_OF[grounds[0]];
}

/**
 * Complete the pair on any rule that paints a ground itself.
 *
 * Only ever ADDS the halves that are missing, and only ever REPLACES a text
 * colour that belongs to a different ground's pair — a literal colour, or a
 * token this ground can carry, is the author's decision and is left alone.
 */
function completeGrounds(root: postcss.Root, changes: string[]): void {
  root.walkRules((rule) => {
    let ground: Ground | null = null;
    rule.walkDecls(/^background(-color|-image)?$/, (decl) => {
      ground = ground ?? groundPainted(decl.value);
    });
    if (!ground) return;
    const pair: Ground = ground;

    const declared = new Set<string>();
    let colourDecl: Declaration | null = null;
    rule.walkDecls((decl) => {
      declared.add(decl.prop);
      if (decl.prop === "color") colourDecl = decl;
    });

    if (!colourDecl) {
      rule.append({ prop: "color", value: pair.color });
      changes.push(`${rule.selector}: paints a ground without a text colour → color: ${pair.color}`);
    } else {
      const decl = colourDecl as Declaration;
      const token = decl.value.match(/var\(\s*(--[\w-]+)/)?.[1];
      if (token && !pair.legalText.includes(token) && !INHERITED_TEXT.includes(token)) {
        changes.push(`${rule.selector}: color: var(${token}) is the wrong ground's pair → ${pair.color}`);
        decl.value = pair.color;
      }
    }

    for (const [prop, value] of [
      ["--muted", pair.muted],
      ["--on-ground", pair.onGround],
      ["--rule", pair.rule],
    ] as const) {
      if (declared.has(prop)) continue;
      rule.append({ prop, value });
    }
    changes.push(`${rule.selector}: ground painted directly → supporting colours repointed to its own pair`);
  });
}

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

  // After the per-declaration fixes, so a colour this pass repoints is judged
  // against the ground its own rule paints rather than the one it inherited.
  completeGrounds(root, changes);

  return { css: root.toString(), changes };
}
