import { callBestModel, type GenerationProvider } from "@/lib/generate/model";
import { sanitizeGeneratedCss } from "@/lib/sanitize-css";
import type { DesignDna } from "@/lib/design-dna";
import type { DesignTokens } from "@/lib/design-tokens";
import { STANCE, COLOUR_STANDARD, TYPE_STANDARD, SPACE_STANDARD } from "@/lib/generate/standard";

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
  previousFailures?: string,
  provider: GenerationProvider = "openai"
): Promise<StylesheetResult | null> {
  const tokenList = Object.entries(tokens.vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");

  const prompt = `${STANCE}

Write the complete stylesheet for the page below.

This page was designed by someone who described their intent as:
"${designNotes || "A premium, conversion-focused homepage."}"

Your job is to make it look like an expensive agency built it. Not decorated — designed as one cohesive canvas. Execute the stated colour cadence, composition changes, recurring graphic primitive, confident spacing, real type scale and controlled contrast.

═══ THE TOKENS — already defined on the page root. Use var() and never a literal colour ═══
${tokenList}

${COLOUR_STANDARD}

═══ DESIGN DIRECTION ═══
Mood: ${dna.mood} · Rhythm: ${dna.layout.sectionRhythm} · Geometry: ${dna.geometry.radius} corners, ${dna.geometry.elevation} elevation
Motifs to actually build in CSS: ${dna.motifs.join("; ") || "none specified"}

═══ THE MARKUP YOU ARE STYLING ═══
${html.slice(0, 55000)}

═══ WHAT THE STYLESHEET MUST DO ═══

EVERY class in that markup needs a rule. An unstyled element is a visible defect, and there is no fallback stylesheet behind you.

LAYOUT
- Modern CSS: grid and flex with gap. No floats, no margin hacks.
- Content sits in a centred container, max-width around 1200px, with a horizontal gutter that
  scales: 1.25rem on mobile, 2.5rem from desktop. Content must never touch the viewport edge.
- Mobile first. Every grid collapses to one column and every layout works from 360px up.
- The About section must execute the specific archetype in the design notes with comparable visual mass between story, media and proof. Do not reduce authentic imagery to an avatar, stretch copy across dead space, or let metrics dominate the story. Preserve its hierarchy on mobile with natural content height.

${SPACE_STANDARD}

${TYPE_STANDARD}

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

THE LEAD FORM, if the markup contains [data-lead-form]
This is the conversion mechanism and it must look like the most valuable thing
on the page — not a bare stack of browser-default inputs. Style the fields
themselves: real height (44px minimum), token borders, a clear :focus-visible
state, and a submit button matching the primary call to action above.
The application sets a data-state attribute on the form as it submits, so:
- [data-lead-form][data-state="submitting"] — show it is working (a dimmed or
  busy submit button); the button is also disabled, so style :disabled.
- [data-lead-form][data-state="success"] — HIDE the fields and the button, and
  show [data-lead-form-message] as a clear confirmation. Leaving the fields
  visible after a successful send reads as though nothing happened.
- [data-lead-form][data-state="error"] — keep the fields visible so the visitor
  can retry, and show [data-lead-form-message] in a warning tone.
- [data-lead-form-message] is empty until there is something to say, so give it
  no height or spacing when it is empty (:empty).

WHAT MAKES IT LOOK EXPENSIVE
- Consistency. The same radius, the same shadow, the same spacing step throughout.
- Restraint. Two type sizes per section, not five. One accent, not four.
- Planned quiet/focal/reset section grounds so the page has rhythm without mechanical zebra striping.
- Detail where the eye lands: the hero, the primary button, the first card in a grid.
${
  previousFailures
    ? `\n═══ A PREVIOUS ATTEMPT WAS REJECTED ═══\n${previousFailures}\n`
    : ""
}
Reply with CSS ONLY. No markdown fences, no commentary, no <style> tag. Do not write @import or url() — both are stripped. Start at the first selector.`;

  const raw = await callBestModel(
    prompt,
    {
      maxTokens: 40000,
      temperature: 0.6,
      system:
        "You are a senior front-end designer who writes production CSS. You use only custom properties for colour, and you write a rule for every class in the markup you are given.",
    },
    provider
  );

  if (!raw) return null;

  const stripped = raw
    .replace(/^```(?:css)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .replace(/<\/?style[^>]*>/gi, "")
    .trim();

  const css = sanitizeGeneratedCss(stripped);
  return css ? { css } : null;
}
