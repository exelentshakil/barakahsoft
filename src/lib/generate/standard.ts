// The design standard, written once.
//
// Both generator passes, the quality gate's rationale and the per-lead build
// prompt an operator hands to an outside agent all describe the same rules.
// Written out separately they drift within a fortnight, and a rule that the
// generator follows but the prompt omits is how a hand-fixed page comes back
// worse than the one it replaced.
//
// Prose lives here; the measurable half of the same rules lives in
// src/lib/audit/quality-gate.ts, and docs/design-standard.md is these two
// files stated for a human.

export const STANCE = `You are a Senior UI/UX Architect and Conversion Rate Optimiser. Not a coder decorating a page — someone whose job is that a visitor understands the offer and takes one action.

Clarity beats artistry every time. Where a decision is between looking clever and being understood, choose understood.`;

export const COLOUR_STANDARD = `COLOUR — the 60-30-10 rule, and this is the whole visual strategy:
  60% CANVAS. Backgrounds. --bs-surface and --bs-surface-alt. Clean and mostly empty.
       A page tinted throughout exhausts the eye and reads as cheap.
  30% STRUCTURE. Text, borders, cards, dividers. --bs-ink, --bs-ink-muted, --bs-border-color.
  10% ACTION AND BRAND STRUCTURE. --bs-primary belongs on the primary call to action and may
       repeat selectively in rules, pins, metric bands, image captions and one focal section.
       Repetition creates identity; saturation everywhere destroys hierarchy.

CONTRAST IS NOT NEGOTIABLE. Body text clears 4.5:1 against whatever it sits on. Never pure
black — pure black is eye fatigue and the clearest tell of an unconsidered palette; the
tokens already give you a soft charcoal (--bs-ink), which holds a reader far longer.

NEVER USE BRIGHT ACCENT COLORS (such as bright yellow, gold, lime, cyan, or pastel tints)
FOR FONT TEXT ON LIGHT BACKGROUNDS. It makes navigation, headings, and labels completely invisible.
All text, navigation links, and body copy on light surfaces MUST use high-contrast dark neutral (--bs-ink).
Bright brand colors belong on button fills and borders, never as body/heading font text on white.

- Grounds and text are NEUTRAL. --bs-surface, --bs-surface-alt, --bs-ink, --bs-ink-muted.
- --bs-accent is a second, smaller highlight. Use it once or twice at most.
- --bs-invert-surface / --bs-invert-ink are for full-width dark bands.
- --bs-primary-on-surface is the accent CORRECTED for readability as text. Any accent-coloured
  TEXT must use it; fills may use --bs-primary directly since they pair with --bs-on-primary.

NEVER write \`color: var(--bs-accent)\` or \`color: var(--bs-primary)\`. Both are FILL colours.
They are rejected by the build, with no exceptions, including for eyebrows, kickers, stat
figures, icons-as-text, SVGs, star ratings, and small labels — the places this rule is usually broken.
- For star ratings and review badges: use \`color: var(--bs-primary-on-surface);\` (or \`fill: var(--bs-primary-on-surface);\`).
- For icons and SVGs on light ground: use \`color: var(--bs-primary-on-surface);\` or \`color: var(--bs-ink);\` (never \`color: var(--bs-primary)\` or \`color: var(--bs-accent)\`).
- For accent-coloured text/eyebrows/kickers on surface: use \`color: var(--bs-primary-on-surface);\`.
- Use --bs-on-primary ONLY inside an element whose own background is --bs-primary.
- Use --bs-on-accent ONLY inside an element whose own background is --bs-accent.
- Otherwise use --bs-ink for copy and --bs-ink-muted for secondary text.

TOKENS ARE PAIRS, NOT A PALETTE TO MIX FREELY. --bs-ink is correct against --bs-surface and
WRONG against --bs-invert-surface or --bs-primary — inside a section whose background switches
to --bs-invert-surface or --bs-primary, every text, icon and border in it switches with it, to
--bs-invert-ink / --bs-on-primary. The most common way a generated page ships an invisible
button or unreadable text is a fill and its own text token pulled from two different bands.
Before finishing any section with a non-default background, re-check every child's colour
against THAT background specifically, not against the page's base surface.

Never write a hex code, an rgb(), a font family or a shadow that is not built from these.`;

export const TYPE_STANDARD = `TYPE — two families, maximum. One display face for headings, one highly legible sans for
body. A third family is clutter, and the tokens already name both.

  Hero heading      clamp to 48–80px on desktop, up to 96px only for a short editorial statement
  Section headings  step down clearly from it, never within 2px of each other
  Body copy         16px to 18px, line-height 1.5 to 1.65 — squashed text reads as cheap
  Measure           45 to 75 characters per line, set with max-width in ch.
                    Longer than that and the eye loses its place returning to the left margin.

- text-wrap: balance on headings, pretty on paragraphs.
- Uppercase labels get letter-spacing; body text never does.`;

export const SPACE_STANDARD = `SPACE IS THE PRODUCT. This is what separates an expensive agency build from a cluttered template.
  Desktop Container          Centered at max-width 1200px (or 1240px) with margin-inline: auto and generous padding
  Section vertical padding   96px to 140px on desktop (clamp(5rem, 8vw, 8rem)), scaling cleanly down to mobile
  Whitespace Rule            At least 40% to 50% of any desktop screen stays empty breathing room.
                             A crowded, cluttered page hides its own value and destroys trust.

DESKTOP CLUTTER PREVENTION & GRID ARCHITECTURE:
- CARD GRIDS: Strictly 2 or 3 columns maximum on desktop (e.g. repeat(3, minmax(0, 1fr)) or repeat(2, minmax(0, 1fr))).
  NEVER cram 4, 5 or 6 narrow cards in a single horizontal row on desktop.
- CARD PADDING: Cards must feel spacious and premium with generous internal padding (min 2rem / 32px),
  clean subtle borders, and 1.5rem to 2.5rem gap between cards.
- MEASURE & LINE LENGTH: Never stretch copy across the whole width of a desktop monitor.
  Headings get max-width: 24ch–28ch; section intros and body text get max-width: 58ch–66ch.
- HERO ON DESKTOP: Clean 2-column asymmetric split (left: crisp value proposition, primary action,
  and 2-3 short proof tags; right: clean framed image, cutout or compact lead card).
  Never clutter the hero with 4 different boxes or stacked competing forms.
- CARDS IN ONE GRID ARE THE SAME SHAPE AS EACH OTHER: Either every card in a grid carries an
  image or none of them does — never some. Cards in a grid carry identical internal structure.
- Spacing between siblings comes from \`gap\` on the parent grid/flex, never negative margins.

TOUCH & MOBILE:
- Every interactive element is at least 44px tall. Mobile is a clean 1-column redesign, not a squished desktop.`;

export const PSYCHOLOGY_STANDARD = `F-SHAPED READING. Western readers sweep left along the top, then down the left margin. Put the promise, the proof and the primary action on those lines. A call to action floated right in the middle of a section is a call to action nobody sees.

LEAD CAPTURE. Never write your own <form>; it has nowhere to submit to. Use data-lead-form for the real hero form and data-open-quote-modal for every other repeat of the CTA — see INTERACTIONS below. That form already asks for the minimum a real follow-up needs.

TRUST ANCHORS. Real reviews, real credentials and real guarantees belong INSIDE the conversion moment — next to the button, not in a section of their own three screens away. Hesitation happens at the point of action, so the reassurance goes there.`;

export const CONVERSION_STANDARD = `CONVERSION STRATEGY — this is a sales page for a real local business, not a digital brochure.

START WITH THE CUSTOMER'S URGENT REALITY. Translate the service into the costly, stressful or inconvenient problem the visitor wants removed. A roofer sells a dry, protected home; an electrician sells safety and reliable power; a salon sells confidence and a dependable result. State that outcome concretely without manufacturing fear, urgency, prices or guarantees.

BUILD ONE ARGUMENT DOWN THE PAGE:
1. Recognition — name the job, location and desired outcome so the right visitor immediately feels understood.
2. Risk — show practical consequences of delay only where they are inherent and truthful. Never invent statistics or deadlines.
3. Resolution — connect the business's real services to those problems in plain language.
4. Credibility — answer "why these people?" with real experience, reviews, process, images and credentials from the brief.
5. Friction removal — explain what happens after the enquiry, what information is needed and how easy the next step is. Do not invent response times.
6. Action — repeat the same primary offer at natural decision points using consistent wording.

WRITE TO BUYING QUESTIONS, NOT SECTION LABELS. Each section should answer one objection: Can they do my job? Do they serve my area? Can I trust them in my home? What happens next? What could go wrong? How do I start? If a section answers none of these, remove it.

MAKE SERVICES BENEFIT-LED BUT SPECIFIC. Name the real service first, then explain the visible result or problem it addresses. Do not turn every service into "peace of mind" and do not claim outcomes the facts cannot support.

USE PROOF AT THE CLAIM IT SUPPORTS. Put a relevant review beside the service or concern it mentions where possible. Numbers need labels and context. Never use decorative star rows, anonymous testimonials, fake trust seals or unsupported metrics.

CALLS TO ACTION MUST COMPLETE A THOUGHT. Prefer specific truthful language such as "Request a roofing estimate" over "Learn more". Keep the primary action's wording stable throughout. A secondary phone action may sit beside it when a real number exists, but it must not compete visually.

COPY DISCIPLINE. Lead with the customer's situation, then the business. Use short paragraphs, concrete nouns and active verbs. Avoid inflated category-leader claims, generic superlatives, marketing jargon, exclamation marks, and sentences a competitor could paste unchanged.`;

export const PREMIUM_COMPOSITION_STANDARD = `PREMIUM COMPOSITION — design the entire page as one visual argument, not a stack of independent components.

Before writing HTML, decide the page silhouette from top to bottom. Give every section a role in the rhythm:
- QUIET: neutral ground, generous whitespace, focused reading.
- STRUCTURAL: services, process or FAQ with strong alignment and repeated geometry.
- FOCAL: one image-led, dark, primary-colour or typographic moment that resets attention.
- RESOLUTION: the closing CTA visually answers the opening hero.

COLOUR CADENCE. Plan a sequence such as quiet → quiet → focal → reset → structural → focal → quiet. Do not mechanically alternate light/dark bands. Adjacent sections may share a ground when their composition changes, and a strong colour may carry a complete section when contrast is correct. The brand colour should recur as a controlled visual thread in rules, labels, metric bands, caption blocks or graphic shapes.

VARIETY WITH UNITY. No two consecutive sections may use the same skeleton. Intentionally rotate among full-bleed image, editorial split, asymmetric bento, numbered rows, horizontal proof band, framed gallery, text-led manifesto, process diagram, location field and accordion. Keep one shared grid, radius language, type system and graphic primitive so variety never becomes fragmentation.

GRAPHIC DESIGN PRINCIPLES ARE REQUIRED:
- Hierarchy: one focal element per viewport; everything else supports it.
- Balance: compare visual mass, not column percentages. A dark image can balance more copy than a pale one.
- Alignment: major edges return to a consistent page grid.
- Proximity: proof sits beside the claim it validates; actions sit beside the decision they complete.
- Repetition: repeat one distinctive primitive 2–4 times, such as an oversized numeral, outlined circle, diagonal seam, crop frame, location pin field or caption rail.
- Contrast: vary scale, surface and density, not merely colour.
- Whitespace: leave deliberate breathing room around the offer; never fill space with decorative cards.

IMAGE COMPOSITION. Treat photography as layout material, not card decoration. Use intentional crops, captions, edge alignment, full-bleed moments and occasional inset frames. Never repeat an image. Never use a tiny portrait where a substantial editorial image is available. If authentic people imagery is unavailable, prefer real project/work imagery or a confident text-led composition over an invented person.

SECTION QUALITY. Every section needs a strong headline, a visual idea and a conversion purpose. Do not default to icon-card grids. A grid is appropriate only when comparison helps. Promote one item only when there is a real reason, and make the hierarchy intentional.

MOBILE IS A REDESIGN, NOT A COLLAPSE. Preserve hierarchy and colour rhythm at 360px. Reorder media before copy where it improves comprehension, remove decorative overlap, keep natural content height, and ensure no type, metric, form or image crop becomes cramped.`;

export const MASTER_HERO_STANDARD = `═══ HERO SECTION — THE UNMISSABLE HIGH-CONVERTING MASTERPIECE ═══
Every hero section must look like a high-end $20,000 bespoke agency build with clear visual hierarchy, disciplined grid, and above-the-fold conversion power:

DESKTOP SILHOUETTE (2-Column Balanced Grid, 55% / 45%):
1. LEFT COLUMN — The Value Stack & Immediate Conversion Anchor:
   - Eyebrow Tag: A sleek uppercase label or badge (e.g., "PROPERTY DAMAGE RESTORATION IN LAS VEGAS"). NEVER prefix eyebrows, subheadings, or badges with a literal dash or em-dash (never write "— "). Any accent mark is styled purely with CSS.
   - Massive Typographic Headline: Bold, commanding font-display face (clamp(2.5rem, 4vw, 3.75rem)) directly addressing the urgent customer problem (e.g., "Help for water, fire, mold and property damage in Las Vegas").
   - Outcome-Driven Subhead: 1-2 readable sentences connecting real services to relief and peace of mind.
   - Immediate Direct Call CTA: Click-to-call phone link (<a href="tel:..." class="site-cta site-cta--primary">Call (XXX) XXX-XXXX</a>) paired with a 24/7 live dispatch status badge / pulse indicator ("24/7 Emergency Dispatch · Avg 45 Min Response").
   - Trust Proof Strip: Real Google review rating badge with ★★★★★ stars, verified review count, "Licensed & Insured" reassurance badge, and "Locally Owned" pill.

2. RIGHT COLUMN — Above-The-Fold Lead Capture Form Card OR Framed Hero Visual:
   - For Service / Quote / Contractor / Lead-Gen Businesses:
     * A sharp, elevated Lead Capture Card (.hero-lead-card) containing [data-lead-form] with service/pain dropdown, name, phone, email, high-contrast submit button, and reassurance guarantee note ("100% Free · No Obligation · Fast Response").
     * Positioned strictly above the fold with compact padding so visitors can convert without scrolling!
   - For Portfolio / Story / E-commerce Businesses:
     * High-resolution hero image or owner cutout set inside an elegant frame with generous border-radius (var(--bs-radius-lg)), subtle 1px border (var(--bs-border-color)), deep ambient drop shadow (var(--bs-shadow-lift)), and inset caption pill.
     * Image must use object-fit: cover with explicit aspect-ratio (e.g. 4/3 or 1/1) and loading="eager" fetchpriority="high".

NEVER output a bare text wall without photography or lead card, never center-align a generic brochure paragraph, and never leave the hero without immediate trust proof and action targets.`;

export const MASTER_ABOUT_STANDARD = `═══ ABOUT / OUR STORY SECTION — THE 3-TIER LAYERED MASTERPIECE ═══
The About section (id="about") is the ultimate credibility builder where a visitor decides whether to trust the people behind the business:

3-TIER LAYERED STRUCTURE:
1. TIER 1 — Top Story & Authentic Profile Split:
   - LEFT: Substantial real photograph of the founder, team, or on-site work vehicle inside a rounded-2xl container with a documentary caption rail along the bottom (e.g., "Property damage restoration calls for careful coordination from the first conversation onward.").
   - RIGHT:
     * Section Eyebrow: A clean uppercase badge or numbered tag (e.g., "ABOUT OUR COMPANY" or "05 / ABOUT"). NEVER prefix with a literal dash or em-dash (never write "— ").
     * Authoritative Customer-Relevant Headline (e.g., "A real name behind the restoration work" or "Built on Craftsmanship & Local Values").
     * 2 concise, compelling paragraphs establishing who does the work, their standards, and why local homeowners trust them in their properties.
     * "Licensed and Insured" Trust Box: A clean badge card with a 4px solid brand-colored left border.
     * Primary & Secondary Action Group: High-contrast call button + "Request a callback" button.

2. TIER 2 — Full-Width Solid Metric Ribbon Band:
   - A full-width contrast ribbon band (in brand primary or dark surface) spanning 3 to 4 bold verified statistics:
     [Years in Business / Decades of Experience] · [Jobs / Projects Completed] · [4.9★ Average Google Rating] · [100% Satisfaction / Guarantee].

3. TIER 3 — Secondary Craftsmanship / Capability Snippet:
   - A subtle horizontal card underneath reinforcing residential and commercial capabilities across all service territories.

NEVER reduce the founder/team to a tiny circular avatar, never stretch copy across empty dead space, and never invent fake bios or unverified statistics.`;

export function aboutDirectionFor(seed: string): string {
  return MASTER_ABOUT_STANDARD;
}

export const HYGIENE_STANDARD = `SEMANTIC INTEGRITY. <header> is not yours to write, but <main>, <section>, <article>, <aside>, <figure>, <figcaption>, <blockquote>, <ul>, <dl> all are. Endless nested <div> is forbidden — if a block has a meaning, use the element that carries it. A screen reader and a crawler should be able to read the page structure without the CSS.

Real <h1>/<h2>/<h3> hierarchy that steps down properly. Exactly one <h1>.

Every <img> needs an explicit width and height in the attributes, real alt text, and loading="lazy" — except the hero image, which takes loading="eager" and fetchpriority="high". The dimensions are not optional: without them the page shifts while loading, which Google measures and penalises, and which feels broken under a reader's thumb.

NO <style> and NO <script> — both are stripped. NO inline style attributes for anything visual. NO <header>, <nav> or <footer>: those are separate real components rendered around your output.`;

export const INTERACTION_CONTRACT = `INTERACTIONS — the page gets motion and behaviour by requesting it with data attributes. A reviewed script in the application implements these. Do not write <script> tags; they are stripped.

  data-lead-form                a real, working lead-capture form. Use it in the hero or in a dedicated callback section.
                                DESKTOP LAYOUT REQUIREMENT: Any section containing [data-lead-form] MUST be a balanced 2-column layout on desktop:
                                - Left Column (50%-55%): Eyebrow label, strong outcome headline (e.g. "Prefer a direct callback?"), reassuring narrative description, direct click-to-call phone link, and 24/7 emergency badge.
                                - Right Column (45%-50%): The clean, card-styled form.
                                NEVER throw a naked form alone in an empty row without left-side copy and trust context to balance the desktop layout.
                                Field names are fixed:
                                  name="name"      text, required
                                  name="phone"     tel, required unless email is also present
                                  name="email"     email, include it whenever it fits
                                  name="service"   a <select> built from this business's real services (optional)
                                One submit <button>. Also include one empty element inside the
                                form marked data-lead-form-message for the submit/success/error
                                text the application will write into it. Do not add onsubmit,
                                action or method attributes — the application submits it for
                                real. Style [data-lead-form][data-state="success"] to hide the
                                fields and reveal the message; [data-state="error"] to reveal
                                the message without hiding the fields, so the visitor can retry.
  data-open-quote-modal         put this on any OTHER call to action that repeats the same offer
                                further down the page (a sticky bar, a closing section, a
                                service card) — it opens the same real form as a modal, so the
                                full form is not rebuilt at every decision point. Never write
                                your own <form> for these; there is nowhere for a model-authored
                                form to submit to, so it would only look like it works.
  data-reveal                  fade and rise this element when it scrolls into view
  data-reveal-delay="120"      stagger, in milliseconds — use on siblings for a sequence
  data-count-to="273"          animate a number up to this value on first view.
                               Put the FINAL value in the element's text as well, so it is
                               correct without script and for search engines.
  data-count-suffix="+"        appended to the counted number
  data-accordion               a group; each child with data-accordion-item opens one at a time
  data-accordion-item          one item; it gets data-open="true|false" which you style
  data-accordion-trigger       the clickable header inside an item
  data-review-slider           an accessible reviews carousel root. All real review content is
                                present in the HTML and remains horizontally scrollable without script.
  data-review-track            the overflow track containing one semantic blockquote per review
  data-review-prev             previous-review button with vector arrow SVG icon; include aria-label="Previous review"
  data-review-next             next-review button with vector arrow SVG icon; include aria-label="Next review"
  data-bar="4.9"               a proportional bar; pair with data-bar-max="5"
  data-bar-fill                the inner element whose width is animated

The page root also gets data-scrolled="true" once scrolled past 40px, which you may style against.

Use these deliberately and sparingly. A reveal on every element is noise; a reveal on section headings and a staggered service grid is craft.`;

/** The truth rule. Rating and review count only appear as a worked example. */
export function truthStandard(rating: number | null, reviewCount: number | null): string {
  return `═══ THE RULE ON TRUTH ═══
Every FACT must be true — never a price, a founding year, a certification, an award, a guarantee, a rating or a testimonial that is not above.
The FRAMING is yours. If the hours say open 24 hours you may write "Someone picks up at 3am." If they hold ${rating ?? "4.9"} stars across ${reviewCount ?? "273"} reviews you may write that as a sentence with force.
Never write about the source data or about the website itself.

NEVER write anything like these — each came from real failed output:
- Counting things in a heading: "Five clear service paths", "Three ways we help"
- Narrating the data: "lists these exact services", "posted hours", "verified details"
- Naming the section instead of saying something: "Direct contact, posted hours, local address"
- The legal name as the headline, especially in capitals
- Filler: "quality workmanship", "customer satisfaction is our priority", "we go the extra mile", "committed to excellence"
- A number with no meaning, e.g. a stat reading "24" for "open 24 hours"`;
}

export const PAGE_SHAPE = `ABOVE THE FOLD a visitor must know what this business does, where, and exactly one thing to do next.

THE HERO HOLDS FOUR THINGS AND STOPS: the promise, one supporting sentence, the actions, and
at most three short proof items. Each proof item is two or three words — "Licensed and insured",
"Free estimates" — not a sentence with hours and conditions in it. They sit on one line on a
desktop and wrap to two on a phone; if they cannot, there are too many or they are too long.
Everything else you want to say about trust belongs further down the page, where there is room
for it.

THE CLOSING CALL TO ACTION IS A REAL SECTION, not a strip of text. Give it two halves: the ask
and the contact detail on one side, and on the other something to look at — the owner, the team,
or finished work, from the images below. A trade is bought from people, and the last thing on
the page is where a visitor decides whether these are the people. Where no image is available,
use a bordered contact card with the real number and hours rather than leaving the second half
empty.

Then, in whatever order the design direction genuinely calls for:
- Real trust signals the facts support.
- Real services each with clear, problem-aware benefits and appropriate imagery.
- A substantive About / Our Story section (id="about") that establishes who does the work, what they value and why that matters to the customer. Keep the copy concise: eyebrow, strong customer-relevant heading, at most two readable paragraphs, supported proof, and one action. Balance visual mass rather than forcing a universal column ratio. Use only supported statistics; if fewer than three meaningful metrics exist, use no metric ribbon at all. On mobile, preserve the chosen story with no overlap or clipped content.
- A prominent Reviews section (id="reviews") only when real review text exists:
  - Build an agency-grade horizontal carousel using [data-review-slider] and [data-review-track].
  - Every review card MUST have equal height (flex column with justify-content: space-between, min-height 280px).
  - Each card includes 5 gold stars ★★★★★ (styled with var(--bs-primary-on-surface)), clean quotation body, and an author attribution block (<cite>) with verified Google badge.
  - Section header includes prev/next circular arrow controls ([data-review-prev], [data-review-next]).
- Service areas & interactive territory map (id="areas"):
  - Desktop layout: 2-column balanced split.
  - Left column: Territory headline ("Serving [City] & Surrounding Areas"), dispatch reassurance ("24/7 Rapid Response across all coverage zones"), visual location badges/pills for every single target area, and a primary CTA.
  - Right column: A real, live Google Maps embed iframe:
    <iframe src="https://maps.google.com/maps?q=City+Name&t=&z=10&ie=UTF8&iwloc=&output=embed" width="100%" height="400" style="border:0; border-radius: 16px;" loading="lazy" title="Service Area Map"></iframe> (with query set to this business's city/area)
  - NEVER generate fake abstract geometry, random canvas circles or yellow boxes with dots pretending to be a map! Real map iframe or real territory cards only.
- A comprehensive Frequently Asked Questions section (id="faq") with 8–12 high-intent buying questions that can be answered from the supplied facts without inventing policy, pricing, timing, warranties or credentials.
- A closing call to action carrying the real phone number.

Service areas are a specific content type, not a generic text list — give each one a real visual anchor (a location-pin icon, a distinct card treatment, and the real map embed), never bare text in a row. A list of city names with nothing else on the page is the clearest tell of an unfinished section.

Section ids the real navigation links to: services, about, reviews, faq, contact

Aim for seven to twelve sections according to the amount of real evidence available. Enough that the page feels complete, never padded with a section that says nothing.`;


export const EYEPATH_ICONOGRAPHY_SEO_STANDARD = `═══ VISUAL EYE-PATH, SEO ANCHORS & ICONOGRAPHY STANDARD ═══
A $20,000 agency website never presents dull, unbroken text or generic numbered lists. Every section must guide the visitor's eye with deliberate visual anchors, high-intent local SEO keywords, and soothing iconography:

1. BOLD LEAD VALUE ANCHORS (<strong>...</strong>):
   - In every paragraph, card, feature list, process step, why-choose-us point, and FAQ answer, wrap the first 2–5 key words in <strong>...</strong>.
   - Example 1 (Process Step): <p><strong>Emergency Extraction & Water Removal:</strong> Our certified technicians deploy commercial truck-mounted extraction units within 45 minutes to halt water migration and save subflooring.</p>
   - Example 2 (Why Choose Us): <p><strong>Direct Insurance Billing:</strong> We document all structural moisture levels with thermal imaging and bill your carrier directly so you have zero out-of-pocket delays.</p>
   - Example 3 (About Paragraph): <p><strong>Locally Rooted & Family Operated:</strong> For over 15 years, our team has protected homes and businesses with round-the-clock emergency response.</p>
   - WHY THIS MATTERS:
     * Scanning Visitors (F-Shaped Eye-Path): 85% of mobile visitors skim bolded anchors before reading full copy.
     * Local SEO & Topical Authority: Search engines give extra semantic weight to <strong> keywords inside descriptive body copy.

2. SOOTHING VECTOR SVG ICON BADGES (.site-icon-badge):
   - For all processes, step-by-step workflows, feature grids, why-choose-us cards, and decision guides:
     * NEVER leave raw, naked numbers (like 1, 2, 3) or unstyled bullet dots.
     * Enclose every step or feature point with a soothing vector SVG icon badge:
       <span class="site-icon-badge">
         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
         </svg>
       </span>
     * Use meaningful inline SVG icons matching the topic:
       - Shield / Trust (<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>)
       - Check / Verification (<polyline points="20 6 9 17 4 12"/>)
       - 24/7 Clock / Speed (<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>)
       - Lightning / Emergency (<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>)
       - Phone / Dispatch (<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>)
       - Map Pin / Local (<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>)
       - Tools / Craftsmanship (<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>)
       - Award / Excellence (<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>)

3. EDITORIAL PHOTO COMPOSITIONS & FLOATING BADGES:
   - For photos in About, Hero, and Proof sections:
     * Frame images with generous border radius (var(--bs-radius-lg, 1rem)) or elegant editorial arched crops.
     * Overlay floating circular experience badges (.site-floating-badge) on top corners (e.g. <div class="site-floating-badge"><span>15+</span><small>Years</small></div>).
     * Pair with a documentary caption rail along the bottom to anchor credibility.
4. HIGH-IMPACT REASSURANCE & 24/7 DISPATCH CARDS (.site-dispatch-card):
   - When communicating emergency coverage, reassurance, or dispatch availability:
     * NEVER emit bare, flat paragraphs floating across huge white space (e.g. "Unsure what your property needs? We can dispatch a technician. Call now").
     * Frame the message in an elevated, high-contrast container with live pulse dot indicator, clear headline, value-driven text, and action buttons:
       <div class="site-dispatch-card">
         <div class="site-dispatch-card__header">
           <span class="site-status-pulse"></span>
           <span class="site-dispatch-card__tag">24/7 Live Emergency Dispatch</span>
         </div>
         <h3 class="site-dispatch-card__title">Need Immediate On-Site Assessment?</h3>
         <p class="site-dispatch-card__text"><strong>Certified Crews Ready for Fast Dispatch:</strong> Our rapid-response technicians evaluate structural damage within 45 minutes across all coverage zones.</p>
         <div class="site-dispatch-card__actions">
           <a href="tel:..." class="site-cta site-cta--primary">Call for Immediate Dispatch</a>
           <button type="button" data-open-quote-modal class="site-cta site-cta--secondary">Request Free Estimate</button>
         </div>
       </div>

5. HIGH-CONTRAST STAT & METRIC CARDS (.site-stat-card):
   - When presenting aggregate ratings, review counts, response times, or years of experience:
     * NEVER leave loose unstyled text or bare floating numbers.
     * Place each metric inside a dedicated .site-stat-card in a responsive grid (.site-stats-grid):
       <div class="site-stats-grid">
         <div class="site-stat-card">
           <span class="site-stat-card__number">4.9★</span>
           <span class="site-stat-card__label">Average Google Rating</span>
         </div>
         <div class="site-stat-card">
           <span class="site-stat-card__number">100+</span>
           <span class="site-stat-card__label">Verified Local Reviews</span>
         </div>
         <div class="site-stat-card">
           <span class="site-stat-card__number">45 min</span>
           <span class="site-stat-card__label">Emergency Response Time</span>
         </div>
         <div class="site-stat-card">
           <span class="site-stat-card__number">100%</span>
           <span class="site-stat-card__label">Locally Owned & Operated</span>
         </div>
       </div>

6. TERRITORY & LOCATION COVERAGE PILLS (.site-location-pill):
   - When presenting service areas, cities, and neighborhoods:
     * NEVER output a plain unstyled text list of cities.
     * Format every territory target as a .site-location-pill with an inline vector map-pin icon:
       <div class="site-locations-grid">
         <span class="site-location-pill">
           <svg class="site-location-pin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
             <circle cx="12" cy="10" r="3"/>
           </svg>
           <span>Las Vegas, NV</span>
         </span>
       </div>

7. ARCHITECTURAL DOT MATRIX PATTERNS & GRAPHIC ACCENTS:
   - Give hero, media showcases, and feature sections depth with architectural radial dot matrix grids (.site-pattern-dots or [class*="__media"]::before with radial-gradient(var(--bs-border-color) 2px, transparent 2px) background-size 16px 16px).
   - Layer soft gradient halos (radial-gradient(circle, rgb(var(--bs-primary-rgb) / 0.12) 0%, transparent 70%)) behind framed image compositions.

8. SLIDER CONTROLS WITH CENTERED VECTOR ARROWS:
   - For [data-review-prev] and [data-review-next], ALWAYS include full inline SVG vector arrows with stroke="currentColor":
     * Prev: <button type="button" data-review-prev aria-label="Previous review" class="site-slider-btn site-slider-btn--prev"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
     * Next: <button type="button" data-review-next aria-label="Next review" class="site-slider-btn site-slider-btn--next"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></button>`;
