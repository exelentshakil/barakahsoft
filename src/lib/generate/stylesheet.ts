import { callOpenAI, bestModelChain } from "@/lib/openai-client";
import { sanitizeGeneratedCss } from "@/lib/sanitize-css";
import type { DesignDna } from "@/lib/design-dna";
import type { DesignTokens } from "@/lib/design-tokens";

// Pass two: a stylesheet written for this exact page.
//
// The model sees the real markup it is styling, so every class it writes a
// rule for is a class that exists, and every class in the markup gets a
// rule. That symmetry is what the old fixed vocabulary was trying to buy
// and could not: there, a class either existed already or rendered as
// nothing, and layout quality was capped at whatever had been pre-built.
//
// Colour still comes from the compiled tokens rather than from the model.
// That keeps the palette contrast-checked and keeps the operator's
// reference/client colour toggle working — switching it recompiles tokens
// and the whole page rebrands without regenerating a line.

export interface StylesheetResult {
  css: string;
}

export async function generateStylesheet(
  html: string,
  designNotes: string,
  dna: DesignDna,
  tokens: DesignTokens,
  previousFailures?: string
): Promise<StylesheetResult | null> {
  const tokenList = Object.entries(tokens.vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");

  const prompt = `You are a Senior UI/UX Architect writing the complete stylesheet for the page below.

Your job is legibility and goal completion, not decoration. Where a choice is between looking clever and being understood, choose understood.

This page was designed by someone who described their intent as:
"${designNotes || "A premium, conversion-focused homepage."}"

Your job is to make it look like an expensive agency built it. Not decorated — designed. Confident spacing, a real type scale, deliberate contrast between sections, and restraint.

═══ THE TOKENS — already defined on the page root. Use var() and never a literal colour ═══
${tokenList}

COLOUR — the 60-30-10 rule, and this is the whole visual strategy:
  60% CANVAS. Backgrounds. --bs-surface and --bs-surface-alt. Clean and mostly empty.
       A page tinted throughout exhausts the eye and reads as cheap.
  30% STRUCTURE. Text, borders, cards, dividers. --bs-ink, --bs-ink-muted, --bs-border-color.
  10% ACTION. --bs-primary, and almost nowhere but the primary call to action.
       An accent that appears eight times is not an accent, it is a theme, and
       it leaves the button nothing to stand against.

CONTRAST IS NOT NEGOTIABLE. Body text clears 4.5:1 against whatever it sits on. Never pure
#000000 on a dark surface — the tokens already give you a soft charcoal, which holds a reader
far longer without eye fatigue. Never a saturated brand colour as body text.

Colour discipline in detail:
- Grounds and text are NEUTRAL. --bs-surface, --bs-surface-alt, --bs-ink, --bs-ink-muted.
- --bs-primary is the ACCENT. It belongs on the primary call to action and almost nowhere else.
  A page where the brand colour appears eight times has no accent; it has a theme.
- --bs-accent is a second, smaller highlight. Use it once or twice at most.
- --bs-invert-surface / --bs-invert-ink are for full-width dark bands.
- --bs-primary-on-surface is the accent CORRECTED for readability as text. Any accent-coloured
  TEXT must use it; fills may use --bs-primary directly since they pair with --bs-on-primary.

Never write a hex code, an rgb(), a font family or a shadow that is not built from these.

═══ DESIGN DIRECTION ═══
Mood: ${dna.mood} · Rhythm: ${dna.layout.sectionRhythm} · Geometry: ${dna.geometry.radius} corners, ${dna.geometry.elevation} elevation
Motifs to actually build in CSS: ${dna.motifs.join("; ") || "none specified"}

═══ THE MARKUP YOU ARE STYLING ═══
${html.slice(0, 55000)}

═══ WHAT THE STYLESHEET MUST DO ═══

EVERY class in that markup needs a rule. An unstyled element is a visible defect, and there is no fallback stylesheet behind you.

LAYOUT — a 12-column grid on desktop, fluid and effectively 4-column on mobile.
- Modern CSS: grid and flex with gap. No floats, no margin hacks.
- Content sits in a centred container, max-width around 1200px, with a horizontal gutter that
  scales: 1.25rem on mobile, 2.5rem from desktop. Content must never touch the viewport edge.
- Mobile first. Every grid collapses to one column and every layout works from 360px up.

SPACE IS THE PRODUCT. This is what separates an expensive page from an adequate one.
  Section vertical padding   96px to 128px on desktop, via clamp so it scales down cleanly
  Container padding          24px to 32px
  At least 40% of any screen stays empty. Whitespace is what steers the eye to the offer;
  a crowded page hides its own call to action.

TOUCH. Every interactive element is at least 44px tall on mobile. A button a thumb misses is
a conversion lost, and small tap targets are the clearest tell that a page was designed on a
desktop and never tried on a phone.

TYPE — two families, maximum. One display face for headings, one highly legible sans for
body. A third family is clutter, and the tokens already name both.

  Hero heading      clamp so it lands between 40px and 48px on desktop
  Section headings  step down clearly from it, never within 2px of each other
  Body copy         16px to 18px, line-height 1.5 to 1.65 — squashed text reads as cheap
  Measure           45 to 75 characters per line, set with max-width in ch.
                    Longer than that and the eye loses its place returning to the left margin.

- text-wrap: balance on headings, pretty on paragraphs.
- Uppercase labels get letter-spacing; body text never does.

DEPTH AND MOTION
- Shadows from --bs-shadow-card / --bs-shadow-lift. Depth is structural, not decorative.
- Style the reveal states: [data-reveal-armed] starts translated down and transparent,
  [data-revealed] returns to normal with a transition around 700ms and a natural easing curve.
  Elements must be VISIBLE by default so the page reads with script disabled.
- Hover states on anything clickable, and a visible :focus-visible ring on every interactive
  element — keyboard users are real users.
- Wrap every transition and animation in @media (prefers-reduced-motion: no-preference).
- Keep motion subtle and fluid. A page that moves constantly is not premium, it is restless.

THE ACCENT
Make the primary call to action unmissable. It should be the most visually
prominent thing on the first screen after the headline. Give it presence:
generous padding, real weight, a considered hover.

WHAT MAKES IT LOOK EXPENSIVE
- Consistency. The same radius, the same shadow, the same spacing step throughout.
- Restraint. Two type sizes per section, not five. One accent, not four.
- Alternating section grounds so the page has rhythm rather than being one flat wall.
- Detail where the eye lands: the hero, the primary button, the first card in a grid.
${
  previousFailures
    ? `\n═══ A PREVIOUS ATTEMPT WAS REJECTED ═══\n${previousFailures}\n`
    : ""
}
Reply with CSS ONLY. No markdown fences, no commentary, no <style> tag. Do not write @import or url() — both are stripped. Start at the first selector.`;

  const raw = await callOpenAI(prompt, {
    maxTokens: 40000,
    temperature: 0.6,
    modelChain: bestModelChain(),
    system:
      "You are a senior front-end designer who writes production CSS. You use only custom properties for colour, and you write a rule for every class in the markup you are given.",
  });

  if (!raw) return null;

  const stripped = raw
    .replace(/^```(?:css)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .replace(/<\/?style[^>]*>/gi, "")
    .trim();

  const css = sanitizeGeneratedCss(stripped);
  return css ? { css } : null;
}
