import { z } from "zod";
import { scrapeWithFirecrawl } from "@/lib/scrape/firecrawl";
import { callOpenAI } from "@/lib/openai-client";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { SECTION_IDS } from "@/lib/section-ids";

// Inspiration Design DNA — the operator researches the best site in the
// lead's industry, drops its URL in the Studio, and this distils it into a
// structured design spec the generator executes against.
//
// The hard rule this module exists to enforce: ONLY visual direction
// crosses over from the reference. Never its copy, its claims, its
// reviews, its service names, its numbers. The reference answers "how
// should this look"; the lead's own scraped facts answer "what does it
// say". Those two inputs stay in separate columns and separate prompt
// sections for exactly that reason.
//
// Why a rigid enum schema instead of free-form notes: a design spec that
// is a closed vocabulary can be compiled deterministically into CSS custom
// properties (see design-tokens.ts). Free-form adjectives can't be, and
// that was the old failure mode -- the model was told in prose to "use the
// brand color" and simply didn't.

export const DesignDnaSchema = z.object({
  sourceName: z.string().max(120).describe("The reference brand's name, for operator reference only"),
  /** How the reference reads at a glance. Drives overall surface treatment. */
  mood: z.enum(["dark-premium", "light-editorial", "bold-utility", "warm-craft", "clinical-trust"]),
  palette: z.object({
    primary: z.string(),
    accent: z.string(),
    surface: z.string(),
    surfaceAlt: z.string(),
    ink: z.string(),
    inkMuted: z.string(),
    onPrimary: z.string(),
  }),
  typography: z.object({
    displayFamily: z.string().max(60),
    bodyFamily: z.string().max(60),
    displayWeight: z.enum(["600", "700", "800", "900"]),
    scale: z.enum(["compact", "balanced", "dramatic"]),
    headingCase: z.enum(["sentence", "upper"]),
  }),
  geometry: z.object({
    radius: z.enum(["sharp", "soft", "rounded", "pill"]),
    elevation: z.enum(["flat", "soft", "dramatic"]),
    borderTreatment: z.enum(["hairline", "solid", "none"]),
  }),
  layout: z.object({
    heroTreatment: z.enum(["full-bleed-image", "split-editorial", "dark-utility-band", "gradient-statement"]),
    sectionRhythm: z.enum(["tight", "generous", "cinematic"]),
    imageDensity: z.enum(["hero-led", "balanced", "gallery-led"]),
    serviceLayout: z.enum(["feature-grid", "editorial-list", "bento-grid", "numbered-rows"]),
    proofStyle: z.enum(["quote-cards", "logo-strip", "stat-band", "review-carousel"]),
  }),
  /** Concrete, executable visual devices. The spice that stops sites looking identical. */
  motifs: z.array(z.string().max(80)).max(6),
  rationale: z.string().max(400),

  /**
   * What sections the reference page actually has, in order.
   *
   * The prompt below has always handed the model the reference's full page
   * markdown and told it to "judge section rhythm, content density, and which
   * layout archetypes it uses" — and then thrown all of that away in favour of
   * six hex codes and five enums. A best-in-class site in the lead's own
   * industry already knows what that industry's homepage needs and in what
   * order; nothing has to invent it.
   *
   * The boundary above is unchanged and governs this on the same terms:
   * STRUCTURE and DIRECTION cross over, COPY and CLAIMS never do. We learn
   * that a gym page leads with membership tiers; we do not learn what the
   * reference charges.
   *
   * Optional because every DesignDna stored before this existed must still
   * validate, and because a page composes perfectly well from the vertical's
   * own section list when no reference was supplied.
   */
  blueprint: z
    .object({
      sections: z
        .array(
          z.object({
            /**
             * Free string, deliberately not an enum: a gym reference yields
             * "membership-tiers", a restaurant "menu-by-course", a solicitor
             * "practice-areas". The moment this becomes a closed list we have
             * rebuilt the per-vertical section table one layer down.
             */
            kind: z.string().max(40),
            /** What the section is for, in the reference's own terms. */
            purpose: z.string().max(200),
            /** What the CLIENT must actually have for this to be worth rendering. */
            needs: z.array(z.string().max(40)).max(6).default([]),
            /** Closest existing renderer id, or null when none of them fits. */
            nearest: z.string().max(30).nullable().default(null),
          })
        )
        .min(3)
        .max(16),
      rationale: z.string().max(400).default(""),
    })
    .optional(),
});

export type DesignDna = z.infer<typeof DesignDnaSchema>;

// Used when no inspiration URL is set, or when extraction fails. Deliberately
// a real, confident direction rather than a washed-out neutral -- a lead
// generated without inspiration should still look intentional.
export const DEFAULT_DESIGN_DNA: DesignDna = {
  sourceName: "House standard",
  mood: "bold-utility",
  palette: {
    primary: "#1D4ED8",
    accent: "#F59E0B",
    surface: "#FFFFFF",
    surfaceAlt: "#F1F5F9",
    ink: "#0F172A",
    inkMuted: "#475569",
    onPrimary: "#FFFFFF",
  },
  typography: {
    displayFamily: "Outfit",
    bodyFamily: "Inter",
    displayWeight: "800",
    scale: "balanced",
    headingCase: "upper",
  },
  geometry: { radius: "soft", elevation: "soft", borderTreatment: "hairline" },
  layout: {
    heroTreatment: "split-editorial",
    sectionRhythm: "generous",
    imageDensity: "balanced",
    serviceLayout: "feature-grid",
    proofStyle: "stat-band",
  },
  motifs: ["full-width dark CTA band", "oversized section numerals"],
  rationale: "House default direction used when no inspiration reference was supplied.",
};

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Firecrawl reports real computed colors but not always six-digit hex, and
 * occasionally misses a role entirely. Coercing here keeps every downstream
 * consumer (token compiler, generator prompt) able to assume valid hex.
 */
function coerceHex(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (HEX.test(trimmed)) return trimmed.toUpperCase();
  const short = trimmed.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toUpperCase();
  const rgb = trimmed.match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i);
  if (rgb) {
    const hex = [rgb[1], rgb[2], rgb[3]]
      .map((n) => Math.min(255, parseInt(n, 10)).toString(16).padStart(2, "0"))
      .join("");
    return `#${hex}`.toUpperCase();
  }
  return fallback;
}

function normalise(dna: DesignDna): DesignDna {
  const p = dna.palette;
  const d = DEFAULT_DESIGN_DNA.palette;
  return {
    ...dna,
    palette: {
      primary: coerceHex(p.primary, d.primary),
      accent: coerceHex(p.accent, d.accent),
      surface: coerceHex(p.surface, d.surface),
      surfaceAlt: coerceHex(p.surfaceAlt, d.surfaceAlt),
      ink: coerceHex(p.ink, d.ink),
      inkMuted: coerceHex(p.inkMuted, d.inkMuted),
      onPrimary: coerceHex(p.onPrimary, d.onPrimary),
    },
  };
}

export interface DesignDnaResult {
  dna: DesignDna;
  sourceUrl: string;
  /** Surfaced in the Studio so the operator knows whether it really read the site. */
  warnings: string[];
}

/**
 * Scrape a reference site and distil its visual system.
 *
 * Firecrawl supplies the objective half (real computed colors, real font
 * families, real logo). The model supplies the interpretive half (what
 * layout archetype and rhythm this design is using), reading the page's
 * real markdown structure. Handing the model the measured colors rather
 * than asking it to imagine them is what keeps the palette faithful to
 * the actual reference instead of a plausible-sounding invention.
 */
export async function extractDesignDna(url: string): Promise<DesignDnaResult> {
  const warnings: string[] = [];
  const scraped = await scrapeWithFirecrawl(url);

  if (!scraped) {
    warnings.push("Could not reach that URL — using house default direction. Check the URL or Firecrawl credits.");
    return { dna: DEFAULT_DESIGN_DNA, sourceUrl: url, warnings };
  }

  const branding = scraped.branding ?? {};
  const measured = {
    primary: coerceHex(branding.colors?.primary, DEFAULT_DESIGN_DNA.palette.primary),
    secondary: coerceHex(branding.colors?.secondary, DEFAULT_DESIGN_DNA.palette.surfaceAlt),
    accent: coerceHex(branding.colors?.accent, DEFAULT_DESIGN_DNA.palette.accent),
    background: coerceHex(branding.colors?.background, DEFAULT_DESIGN_DNA.palette.surface),
    displayFamily: branding.typography?.fontFamilies?.primary?.split(",")[0]?.replace(/['"]/g, "").trim() || "",
    bodyFamily: branding.typography?.fontFamilies?.secondary?.split(",")[0]?.replace(/['"]/g, "").trim() || "",
  };

  if (!branding.colors?.primary) warnings.push("Reference site exposed no primary color — inferred one from the page.");

  const structure = (scraped.markdown ?? "").slice(0, 14000);

  const prompt = `You are a senior creative director reverse-engineering the VISUAL SYSTEM of a reference website so a different business can be designed to the same caliber.

CRITICAL BOUNDARY: You are extracting design direction ONLY — palette, type, geometry, layout rhythm, visual motifs. You must NEVER carry over this reference's copy, headlines, service names, claims, statistics, reviews, certifications, or contact details. Those belong to a different company. Your output is a style specification, not content.

REFERENCE: ${scraped.title || url}
URL: ${url}

MEASURED VALUES (real computed values scraped from the live site — treat these as ground truth and use them for the palette unless a value is obviously a placeholder):
- primary: ${measured.primary}
- secondary: ${measured.secondary}
- accent: ${measured.accent}
- background: ${measured.background}
- display font: ${measured.displayFamily || "(not detected)"}
- body font: ${measured.bodyFamily || "(not detected)"}

PAGE STRUCTURE (real markdown from the live site — read it to judge section rhythm, content density, and which layout archetypes it uses):
${structure || "(no markdown captured)"}

Return ONLY a JSON object in exactly this shape:
{
  "sourceName": "the reference brand name",
  "mood": "dark-premium|light-editorial|bold-utility|warm-craft|clinical-trust",
  "palette": {
    "primary": "#RRGGBB", "accent": "#RRGGBB", "surface": "#RRGGBB",
    "surfaceAlt": "#RRGGBB", "ink": "#RRGGBB", "inkMuted": "#RRGGBB", "onPrimary": "#RRGGBB"
  },
  "typography": {
    "displayFamily": "a real Google Font name that matches the reference's display face",
    "bodyFamily": "a real Google Font name that matches the reference's body face",
    "displayWeight": "600|700|800|900",
    "scale": "compact|balanced|dramatic",
    "headingCase": "sentence|upper"
  },
  "geometry": {
    "radius": "sharp|soft|rounded|pill",
    "elevation": "flat|soft|dramatic",
    "borderTreatment": "hairline|solid|none"
  },
  "layout": {
    "heroTreatment": "full-bleed-image|split-editorial|dark-utility-band|gradient-statement",
    "sectionRhythm": "tight|generous|cinematic",
    "imageDensity": "hero-led|balanced|gallery-led",
    "serviceLayout": "feature-grid|editorial-list|bento-grid|numbered-rows",
    "proofStyle": "quote-cards|logo-strip|stat-band|review-carousel"
  },
  "motifs": ["up to 6 short, concrete, executable visual devices this design uses, e.g. 'diagonal section dividers', 'oversized outlined numerals', 'full-bleed dark CTA band'"],
  "rationale": "one or two sentences on what makes this design read as premium",
  "blueprint": {
    "sections": [
      {
        "kind": "short-hyphenated-name-for-this-kind-of-section, e.g. membership-tiers, class-timetable, coach-roster, menu-by-course, practice-areas",
        "purpose": "what this section is for, in one sentence",
        "needs": ["what a business must actually have for this section to be worth building, e.g. pricing-tier, class, person, location"],
        "nearest": "the closest of these existing section ids, or null if none of them fits: ${SECTION_IDS.join(", ")}"
      }
    ],
    "rationale": "one sentence on why this page is ordered the way it is"
  }
}

Rules:
- ink must have strong contrast against surface, and onPrimary must have strong contrast against primary. Fix them if the measured values would produce unreadable text.
- displayFamily and bodyFamily must be real Google Fonts that are actually available, since they will be loaded from Google Fonts at render time. If the reference uses a proprietary face, name the closest real Google Font.
- motifs must be things that can literally be built in HTML and CSS, not vague adjectives.

BLUEPRINT — read the page structure above and list the sections this reference page ACTUALLY has, in the order they appear, from the top of the page to the bottom. This is the most valuable thing you will produce: it is how a business in this industry gets the page its industry actually needs instead of a generic template.
- Report what is there, not what you think ought to be there. If the page has no reviews section, do not list one.
- Between 3 and 16 sections. Skip the navigation bar and the footer; those are built separately.
- "kind" names the section in this industry's own vocabulary. A gym's pricing block is "membership-tiers", not "pricing". A restaurant's is "menu-by-course". Name it the way someone in that trade would.
- "needs" is the crucial field, and it is about the CLIENT, not the reference: what facts must a business have on hand before this section is worth building for them? Use short singular nouns — pricing-tier, class, person, location, photo, review, certification, opening-hours. A section whose needs cannot be met will be dropped rather than filled with invented content.
- "nearest" is how the section gets rendered. Pick the existing id that would do the least violence to the intent, or null when there is genuinely no fit — null is a useful, honest answer and is recorded rather than guessed around.
- Say nothing about what the reference's sections CONTAIN. "membership-tiers" is structure and crosses over; "three tiers at 25, 40 and 60 a month" is that company's pricing and must not.`;

  const raw = await callOpenAI(prompt, {
    json: true,
    temperature: 0.4,
    maxTokens: 12000,
    system: "You are a precise design systems analyst. You return valid JSON only.",
  });

  if (!raw) {
    warnings.push("Design model call failed — falling back to the measured colors with a default layout direction.");
    return {
      dna: normalise({
        ...DEFAULT_DESIGN_DNA,
        sourceName: scraped.title || url,
        palette: { ...DEFAULT_DESIGN_DNA.palette, primary: measured.primary, accent: measured.accent },
      }),
      sourceUrl: url,
      warnings,
    };
  }

  const parsed = parseJsonResponse(raw);
  const result = parsed ? DesignDnaSchema.safeParse(parsed) : null;

  if (!result?.success) {
    warnings.push("Design model returned an unexpected shape — falling back to measured colors.");
    return {
      dna: normalise({
        ...DEFAULT_DESIGN_DNA,
        sourceName: scraped.title || url,
        palette: { ...DEFAULT_DESIGN_DNA.palette, primary: measured.primary, accent: measured.accent },
      }),
      sourceUrl: url,
      warnings,
    };
  }

  return { dna: normalise(result.data), sourceUrl: url, warnings };
}
