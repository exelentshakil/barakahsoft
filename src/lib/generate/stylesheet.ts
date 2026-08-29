import { callSmartModel, callBestModel, type GenerationProvider } from "@/lib/generate/model";
import { sanitizeGeneratedCss } from "@/lib/sanitize-css";
import type { DesignDna } from "@/lib/design-dna";
import type { DesignTokens } from "@/lib/design-tokens";
import { STANCE, COLOUR_STANDARD, TYPE_STANDARD, SPACE_STANDARD, EYEPATH_ICONOGRAPHY_SEO_STANDARD } from "@/lib/generate/standard";

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
  provider: GenerationProvider = "openai",
  // The site plan picks a signature graphic motif and, until this argument
  // existed, nothing ever told the stylesheet what it was — so the one
  // decision meant to tie the page together was made and then discarded.
  recurringPrimitive?: string,
  model?: string
): Promise<StylesheetResult | null> {
  const tokenList = Object.entries(tokens.vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");

  // The rejection notice leads the prompt rather than trailing it.
  //
  // It used to sit after roughly a hundred and seventy lines of general
  // guidance, immediately before "reply with CSS only" — the position least
  // likely to change behaviour. A repair attempt has one job, and it should
  // be the first thing read.
  const rejection = previousFailures
    ? `═══ YOUR PREVIOUS ATTEMPT WAS REJECTED — FIX THESE FIRST ═══
${previousFailures}

These are release blockers, not suggestions. The stylesheet is discarded
again if any remain. Everything below still applies, but fixing the above is
the reason you are being asked a second time.

`
    : "";

  const prompt = `${rejection}${STANCE}

Write the complete stylesheet for the page below.

This page was designed by someone who described their intent as:
"${designNotes || "A premium, conversion-focused homepage."}"

Your job is to make it look like an expensive agency built it. Not decorated — designed as one cohesive canvas. Execute the stated colour cadence, composition changes, recurring graphic primitive, confident spacing, real type scale and controlled contrast.

═══ THE TOKENS — already defined on the page root. Use var() and NEVER a literal colour. No #hex, no rgba(). The release check will fail if you use literal colours. ═══
${tokenList}

${COLOUR_STANDARD}

═══ DESIGN DIRECTION ═══
Mood: ${dna.mood} · Rhythm: ${dna.layout.sectionRhythm} · Geometry: ${dna.geometry.radius} corners, ${dna.geometry.elevation} elevation
Motifs to actually build in CSS: ${dna.motifs.join("; ") || "none specified"}
Recurring graphic primitive — the one shape or mark that repeats down the page and makes it feel authored: ${recurringPrimitive || "choose one and use it in at least four sections"}

═══ SIGNATURE, SHAPES AND DESIGN ELEMENTS ═══
This is what separates a styled page from a designed one, and it is the part
that is usually missing. A page of neat rectangles with correct spacing is
competent and forgettable. Build real geometry, in CSS, with no images:

- SECTION SILHOUETTES. Sections must not all be plain rectangles stacked.
  Give at least three of them a shaped edge or an offset ground — an angled
  or curved boundary with clip-path, a ground that stops short so the next
  section overlaps it, a full-bleed band that breaks the container, or a
  panel that sits half-outside its section. Vary which sections get this.
- THE PRIMITIVE, REPEATED. Build the recurring primitive above as an actual
  CSS construct (::before / ::after, a border treatment, a numbered marker,
  a rule that starts each heading) and repeat it in at least four sections so
  the page reads as one authored system.
- DECORATIVE LAYERS, EARNED. Behind or beside focal content: a token-tinted
  gradient wash, a dot or grid field via repeating-linear-gradient or
  radial-gradient, an oversized outlined numeral or letterform, a soft blurred
  colour orb. Low contrast, always behind the content, never competing with
  text, and never on more than about a third of the sections.
- DEPTH AS STRUCTURE. Layer cards over bands, overlap an image and a panel,
  let one element cross a section boundary. Flat stacking is the default look
  this page is trying not to have.
- EDGE AND CORNER DETAIL. Where the eye lands — hero, first card, primary
  button, the review track — add one considered detail: an inset hairline, a
  corner cut, a two-tone border, a caption pill anchored to an image edge.

Constraints that keep this from becoming noise: every colour still comes from
a token; decoration is always pointer-events: none and aria-hidden in effect;
nothing decorative may reduce text contrast; and if a shape would push content
off-screen at 360px wide, simplify it in the mobile branch instead of dropping
the section.

═══ HOW MUCH CSS ═══
Every section gets its own substantial block — its layout, its internal
rhythm, its states, its decorative layer where it has one, and its mobile
branch. A section styled in three declarations has not been designed. Expect
a real stylesheet for a real page: on the order of 12,000 characters or more,
because there are typically eight or nine sections and each one earns its
space. Do not pad it with repetition; earn the length with per-section
composition.

═══ THE MARKUP YOU ARE STYLING ═══
${html.slice(0, 90000)}

═══ WHAT THE STYLESHEET MUST DO ═══

EVERY class in that markup needs a rule. An unstyled element is a visible defect, and there is no fallback stylesheet behind you.

LAYOUT & MASTER SECTIONS
- Modern CSS: grid and flex with gap. No floats, no margin hacks.
- Content sits in a centred container, max-width around 1200px (1240px max), with a horizontal gutter:
  1.25rem on mobile, 2.5rem on desktop. Content must never touch the viewport edge.
- Mobile first. Every grid collapses cleanly to 1 column on mobile and expands to a maximum of 2 or 3 columns on desktop.
  NEVER render 4 or 5 cramped columns on desktop for service cards or testimonials.
- Section vertical padding: clamp(4.5rem, 7.5vw, 7.5rem) so desktop view has elite breathing room and never feels cluttered.
- Text measure limits: max-width: 26ch on major headings, max-width: 60ch–66ch on body copy and section subtitles.
- HERO SECTION STYLING:
  * 2-column balanced grid on desktop (55% left / 45% right).
  * Vertical padding: compact clamp(2rem, 3.5vw, 3.5rem) to ensure the entire hero and lead capture card fit strictly above the fold on desktop viewports.
  * Left: Eyebrow label, massive bold heading (clamp(2.5rem, 4vw, 3.75rem)), outcome subheadline, direct click-to-call button (.site-cta--primary), 24/7 live dispatch status badge, and verified rating trust strip.
  * Right: Elevated Lead Capture Card (.hero-lead-card) with crisp background, subtle border, shadow (var(--bs-shadow-card)), and 44px+ inputs OR framed hero image with radius and lift shadow.
- ABOUT SECTION STYLING (3-TIER LAYERED MASTERPIECE):
  * Tier 1: Asymmetric split with a framed documentary team/work photograph on the left and an editorial story block on the right (with eyebrow, headline, 2 paragraphs, 4px solid left-border guarantee box, and primary action buttons).
  * Tier 2: Full-width solid metric ribbon band with 3-4 high-contrast stats (Experience, Projects, Rating, Satisfaction) in --bs-primary or dark surface.
  * Tier 3: Subtle secondary craftsmanship/capability snippet strip.
- About and proof images use object-fit: cover with an explicit aspect-ratio; never set both an arbitrary fixed width and fixed height that distorts the source.
- Long credentials such as “Licensed and insured” are not equal numeric stats. Give reassurance copy enough width or move it to a separate trust line so it cannot stack into a tall narrow column.
- Every .site-cta--primary has one identical fill, text pairing, radius, weight, padding and hover/focus treatment everywhere. Use --bs-primary with --bs-on-primary. Do not recolour it by section.
- Every .site-cta--secondary uses one consistent subordinate treatment. Do not introduce red, blue or section-specific button colours.
- Every .site-cta has white-space: nowrap, flex-shrink: 0 and a minimum height of 44px. CTA groups wrap as whole buttons on narrow screens; individual labels never collapse into one word per line.
- [data-review-track] is a horizontal overflow track with scroll-snap and touch scrolling.
- ICON BADGES & FLOATING TRUST ELEMENTS:
  * .site-icon-badge / .site-step-badge / .site-feature-icon: style as soothing vector badge containers (display: inline-flex; align-items: center; justify-content: center; width: 2.75rem; height: 2.75rem; border-radius: var(--bs-radius-md, 0.75rem); background: var(--bs-surface-alt); border: 1px solid var(--bs-border-color); color: var(--bs-primary-on-surface); flex-shrink: 0; box-shadow: var(--bs-shadow-card);).
  * .site-floating-badge: position: absolute; border-radius: 9999px; background: var(--bs-surface); border: 2px solid var(--bs-primary); box-shadow: var(--bs-shadow-lift); text-align: center; z-index: 10;
  * strong: font-weight: 700; color: var(--bs-ink); (ensures bold lead keyword anchors pop out clearly for visual scanning). Review cards visibly prioritise rating, quote and attribution in that order; do not leave an unexplained empty rail beside quotes.

${SPACE_STANDARD}

${TYPE_STANDARD}

${EYEPATH_ICONOGRAPHY_SEO_STANDARD}

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

PREMIUM FINISHING TOUCHES (Mandatory for "$20,000 Agency" feel):
- Do not leave empty voids. Use soft, ambient background light glows (backdrop-filter or ultra-low opacity gradients between 2% and 5%) to give sections depth.
- Embed subtle, minimalist SVG geometric lines or abstract wave accents behind the text blurbs to serve as high-end visual anchors.
- Every image and major section must feature a clean, premium content blurb.
- Structure text with a clear visual hierarchy: a tiny, uppercase, bold category label over a powerful short headline, followed by a crisp 2-sentence description.
- Use premium typography pairs (e.g., an elegant, sharp serif for headers and a high-readability geometric sans-serif for blurbs).

THE LEAD FORM, if the markup contains [data-lead-form]
This is the conversion mechanism and it must look like the most valuable thing
on the page — not a bare stack of browser-default inputs. On desktop, any callback/contact
section containing [data-lead-form] must be a 2-column balanced grid with copy/contact info
on the left and the form card on the right (never a centered floating orphan form). Style the fields
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
  no height or spacing when it is empty (:empty). When styling its filled state with a background like --bs-surface-alt, use its paired readable text color (e.g. --bs-ink). Never use a fill color like --bs-on-primary for text on a surface background.

WHAT MAKES IT LOOK EXPENSIVE
- Consistency. The same radius, the same shadow, the same spacing step throughout.
- Restraint. Two type sizes per section, not five. One accent, not four.
- Planned quiet/focal/reset section grounds so the page has rhythm without mechanical zebra striping.
- Detail where the eye lands: the hero, the primary button, the first card in a grid.

Reply with CSS ONLY. No markdown fences, no commentary, no <style> tag. Do not write @import or url() — both are stripped. Start at the first selector.`;

  const raw = await callSmartModel(
    prompt,
    {
      maxTokens: 24000,
      temperature: 0.6,
      system:
        `You are a senior front-end designer who writes production CSS. You use only custom properties for colour, and you write a rule for every class in the markup you are given.

STRICT DESIGN GUARDRAILS (YOU MUST FOLLOW THESE OR FAIL):
1. TYPOGRAPHY VIOLENCE: You are forbidden from using boring header sizes. The Hero H1 MUST be massive using clamp (e.g., font-size: clamp(3.5rem, 8vw, 7rem); line-height: 1; letter-spacing: -0.04em;). Conversely, eyebrows and category labels MUST be tiny, bold, and heavily tracked (e.g., font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase;). Maximize contrast. Body text must be 16px to 18px with line-height: 1.6.
2. OVERLAPPING SECTIONS (NEGATIVE SPACE): You MUST use negative margins (e.g., margin-top: -100px) or CSS Grid overlapping to pull a secondary section (like Trust Badges or Service Cards) UP into the bottom of the Hero section. Do not let sections just sit flat on top of each other. Break the grid.
3. EDITORIAL MEDIA: Never drop a naked image into a div. Every image MUST have object-fit: cover and a strict aspect-ratio (e.g., 4/5, 1/1, or 16/9). Furthermore, at least one major image on the page (like the About section) MUST have an offset decorative pseudo-element (e.g., a ::before block of solid background color that sits 20px behind and offset from the image) to create physical depth.
4. AMBIENT LIGHTING: For dark sections, do not use flat colors. You MUST use ultra-subtle radial gradients to create ambient lighting behind the text. (e.g., background: radial-gradient(circle at 50% 0%, rgba(255,255,255, 0.05) 0%, transparent 60%), var(--bs-surface-dark);). Make it look like a spotlight is hitting the background.
5. SHAPING CONSTRUCTS (DESTROY THE RECTANGLE): You MUST apply a clip-path (like a 4-degree diagonal slant 'polygon(0 0, 100% 4vw, 100% 100%, 0 100%)') to frame the Hero and Footer. Or, use massive border-radius (e.g., 100px or 50%) on specific containers to create arches or circles. Do not build plain stacked rectangles.

6. Buttons: Buttons must have perfect visual balance. Always use flexbox for buttons: display: inline-flex; align-items: center; justify-content: center. Apply padding explicitly. Set line-height: 1 to prevent text clipping.
7. Hero Overlays: Whenever a section has a background image, you MUST apply an overlay (e.g. background: rgba(0,0,0,0.5)) to ensure text contrast.
8. VARIABLE RULES: NEVER use 'color: var(--bs-primary)' for text or links. '--bs-primary' is a background fill. For text that matches the brand color, you MUST use 'color: var(--bs-primary-on-surface)'.
9. HERO HEIGHT: The #hero section MUST have 'min-height: clamp(80vh, 800px, 100vh); display: flex; align-items: center;' to ensure it looks massive.
10. ABOUT SECTION: The .about section MUST use 'display: grid; align-items: stretch;' on desktop so the image perfectly matches the height of the text column.

`,
      model,
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
