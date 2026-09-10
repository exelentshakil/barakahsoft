// Engine 5 — motion.
//
// A static page reads as cheap regardless of how well it is set, and the
// ambition floor requires a motion budget. But motion is also the easiest
// thing to get wrong: linear easing, one duration for every distance, and no
// reduced-motion path are all worse than no motion at all.
//
// The model asks for movement through the data-reveal hooks BespokeRuntime
// already implements. The curves, the durations and the accessibility path are
// decided here, once.

export type MotionCharacter = "calm" | "crisp" | "dramatic";

export interface MotionIntent {
  character?: MotionCharacter;
}

export interface MotionSystem {
  tokens: Record<string, string>;
  css: string;
  meta: { character: MotionCharacter; baseMs: number };
}

const BASE_MS: Record<MotionCharacter, number> = { calm: 720, crisp: 420, dramatic: 980 };
const EASE: Record<MotionCharacter, string> = {
  calm: "cubic-bezier(.22,1,.36,1)",
  crisp: "cubic-bezier(.16,1,.3,1)",
  dramatic: "cubic-bezier(.16,1,.3,1)",
};
const TRAVEL: Record<MotionCharacter, number> = { calm: 18, crisp: 12, dramatic: 34 };

export function buildMotion(intent: MotionIntent): MotionSystem {
  const character = intent.character ?? "crisp";
  const base = BASE_MS[character];
  const ease = EASE[character];

  const tokens: Record<string, string> = {
    "--dur-fast": `${Math.round(base * 0.4)}ms`,
    "--dur": `${base}ms`,
    "--dur-slow": `${Math.round(base * 1.5)}ms`,
    "--ease": ease,
    "--ease-out": "cubic-bezier(.33,1,.68,1)",
    "--travel": `${TRAVEL[character]}px`,
    "--stagger": `${Math.round(base * 0.11)}ms`,
  };

  // [data-reveal-armed] rather than [data-reveal] is deliberate: the armed
  // attribute is set by script, so a page rendered without JS — or captured
  // before the runtime boots, which is exactly what the audit screenshot does —
  // shows its content instead of a blank column of invisible sections.
  const css = `
.bespoke-page [data-reveal-armed]:not([data-revealed]){opacity:0;transform:translateY(var(--travel))}
.bespoke-page [data-reveal-armed]{transition:opacity var(--dur) var(--ease),transform var(--dur) var(--ease)}
.bespoke-page [data-revealed]{opacity:1;transform:none}
.bespoke-page a,.bespoke-page button{transition:color var(--dur-fast) var(--ease-out),background-color var(--dur-fast) var(--ease-out),border-color var(--dur-fast) var(--ease-out),transform var(--dur-fast) var(--ease-out),opacity var(--dur-fast) var(--ease-out)}
.bespoke-page :where(a,button):focus-visible{outline:2px solid var(--focus);outline-offset:3px}
@media(prefers-reduced-motion:reduce){
.bespoke-page *,.bespoke-page *::before,.bespoke-page *::after{animation-duration:1ms!important;animation-iteration-count:1!important;transition-duration:1ms!important;scroll-behavior:auto!important}
.bespoke-page [data-reveal-armed]:not([data-revealed]){opacity:1;transform:none}
}`.trim();

  return { tokens, css, meta: { character, baseMs: base } };
}
