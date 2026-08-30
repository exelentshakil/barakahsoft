import { z } from "zod";
import { bestGeminiChain, callGemini } from "@/lib/gemini-client";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { sanitizeGeneratedCss } from "@/lib/sanitize-css";
import { CLASS_VOCABULARY, MOCKUP_RULES, COPY_RULES } from "@/lib/generate/v2/vocabulary";
import type { LayoutDna } from "@/lib/generate/v2/layout-dna";
import type { SiteBrief } from "@/lib/generate-bespoke-site";

// Stage one: one Pro call decides the whole design, and one Pro call writes
// the stylesheet that implements it. Nothing after this stage is allowed to
// change a colour, a radius, a type size or the section rhythm — which is
// what makes it safe to write the sections in parallel.

const SectionSpecSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/).max(40),
  kind: z.string().min(2).max(60),
  label: z.string().min(2).max(120),
  archetype: z.string().min(8).max(1200),
  intent: z.string().min(8).max(600),
  copyPoints: z.array(z.string().min(2).max(600)).max(14).default([]),
  // The art director reliably reaches for the token name it was shown
  // ("surfaceAlt") rather than the role name, so the alias is accepted and
  // normalised instead of failing the whole manifest over vocabulary.
  background: z
    .string()
    .transform((value) => {
      const normalised = value.trim().toLowerCase();
      if (normalised === "surfacealt" || normalised === "surface-alt" || normalised === "alt") return "tint";
      if (normalised === "image" || normalised === "photograph") return "photo";
      if (normalised === "dark" || normalised === "inverted") return "ink";
      return normalised;
    })
    .pipe(z.enum(["surface", "tint", "ink", "photo"]).catch("surface"))
    .default("surface"),
  imageUrl: z.string().nullable().catch(null).default(null),
});

export const PageSystemSchema = z.object({
  systemName: z.string().min(2).max(120),
  rationale: z.string().min(20).max(4000),
  palette: z.object({
    primary: z.string(),
    accent: z.string(),
    ink: z.string(),
    surface: z.string(),
    surfaceAlt: z.string(),
  }),
  typography: z.object({
    displayFamily: z.string().min(2).max(60),
    bodyFamily: z.string().min(2).max(60),
    displayWeight: z.coerce.string().max(10).default("800"),
    // Loose on purpose: a manifest is expensive to produce and losing one to
    // "uppercase" instead of "upper" costs a Pro call and two minutes.
    headingCase: z
      .string()
      .transform((value) => (/^upper/i.test(value.trim()) ? "upper" : "title"))
      .pipe(z.enum(["upper", "title"]))
      .catch("title")
      .default("title"),
  }),
  sections: z.array(SectionSpecSchema).min(12).max(22),
});

export type PageSystem = z.infer<typeof PageSystemSchema>;
export type SectionSpec = z.infer<typeof SectionSpecSchema>;

export interface SystemInputs {
  brief: SiteBrief;
  dna: LayoutDna;
  tokens: Record<string, string>;
  logoUrl: string | null;
  photos: string[];
}

function briefFacts(brief: SiteBrief): string {
  return `- Business: ${brief.businessName}
- Trade: ${brief.industry}
- City: ${brief.city}${brief.areas.length ? `; service areas: ${brief.areas.slice(0, 10).join(", ")}` : ""}
- Owner/founder: ${brief.founder ?? "not supplied — do not invent one"}
- Phone: ${brief.phone ?? "not supplied"}
- Email: ${brief.email ?? "not supplied"}
- Services: ${brief.services.join(" | ") || "not supplied"}
- Primary action: ${brief.intent.primaryLabel}
- Aggregate review proof: ${brief.rating && brief.reviewCount ? `${brief.rating} from ${brief.reviewCount} reviews` : "none supplied — omit rating UI entirely"}
- Real reviews: ${brief.reviews.length ? brief.reviews.slice(0, 6).map((r) => `${r.author} (${r.rating}): ${r.text.slice(0, 240)}`).join(" || ") : "none supplied — omit the reviews section"}
- Licensed/insured: ${brief.licensedInsured ? "supported" : "not supported — do not claim it"}
- Owner-reported problems with their current site: ${brief.painInstructions.join(" | ") || "none supplied"}
- About / story source material: ${(brief.aboutContent ?? "none supplied").slice(0, 2500)}
- Scraped fact digest: ${brief.factsDigest.slice(0, 3500)}`;
}

export async function generatePageSystem(input: SystemInputs): Promise<PageSystem | null> {
  const { brief, dna, tokens, logoUrl, photos } = input;

  const prompt = `You are the art director and information architect for a single, bespoke, high-ticket
local-business website. This page has to look like a studio designed it for this one client and
nobody else. Its first screen and its about section will be screenshotted onto a laptop mockup and
posted publicly, so it has to be genuinely beautiful, not merely correct.

BUSINESS FACTS
${briefFacts(brief)}

REAL ASSETS AVAILABLE (these exact URLs, no others, no placeholders)
- Logo: ${logoUrl ?? "none — do not render a logo image anywhere; set the business name in the display face instead"}
- Photographs, in order of quality: ${photos.length ? photos.map((url, index) => `[${index}] ${url}`).join("\n  ") : "none — the page must work with zero photographs, using colour, type and motif instead"}

ASSIGNED LAYOUT DNA — this lead's structural identity. You must design INTO it, not around it.
- Chrome: ${dna.chrome.name} — ${dna.chrome.spec}
- Hero: ${dna.hero.name} — ${dna.hero.spec}
- About: ${dna.about.name} — ${dna.about.spec}
- Footer: ${dna.footer.name} — ${dna.footer.spec}
- Section rhythm: ${dna.rhythm}
- Recurring motif: ${dna.motif}
- Corner language: ${dna.cornerStyle}
- Contrast strategy: ${dna.contrastStrategy}

STARTING COLOUR TOKENS (derived from the client's own brand; keep them unless one is
unusable for contrast, in which case adjust the minimum amount and say so in the rationale)
- primary ${tokens["--bs-primary"]}
- accent ${tokens["--bs-accent"]}
- ink ${tokens["--bs-ink"]}
- surface ${tokens["--bs-surface"]}
- surface-alt ${tokens["--bs-surface-alt"]}

${COPY_RULES}

${MOCKUP_RULES}

YOUR JOB
Produce the section manifest for the whole homepage: 14 to 20 sections, in order, that make one
continuous commercial argument for THIS business. Requirements:
- Produce at least 14 sections. Twelve is a failure; the page must be substantial.
- The first section is the hero and uses the assigned hero archetype.
- An about section using the assigned about archetype.
- Services, service areas, an FAQ, and a substantial closing contact/CTA section all appear.
- A reviews section appears ONLY if real review text was supplied above.
- No two adjacent sections share a background value or a shape.
- Every section must earn its place by answering a real buying question for this trade. Do not
  pad with filler sections; if you cannot justify twenty, produce fourteen strong ones.
- Give each section an archetype description concrete enough that another designer could build
  it without seeing the rest of the page: describe the composition, what is on the left, what is
  on the right, what overlaps what, what the focal element is.
- Assign an imageUrl only from the supplied list, and use each photograph at most once. Sections
  with no photograph must be composed to look deliberate, not empty.
- copyPoints are the real, factual points the section must make, drawn from the facts above.

Choose Google-hosted type: a display family with real character for headings and a highly legible
body family. They must not be the same family and must not both be Inter.

Return STRICT JSON only, no prose, no code fence:
{"systemName":"","rationale":"","palette":{"primary":"#","accent":"#","ink":"#","surface":"#","surfaceAlt":"#"},
"typography":{"displayFamily":"","bodyFamily":"","displayWeight":"800","headingCase":"title"},
"sections":[{"id":"hero","kind":"hero","label":"","archetype":"","intent":"","copyPoints":[""],"background":"photo","imageUrl":null}]}`;

  const chain = bestGeminiChain();
  const raw = await callGemini(prompt, chain[0], undefined, {
    modelChain: chain,
    maxTokens: 32000,
    temperature: 0.75,
    timeoutMs: 420_000,
    system:
      "You are a senior art director. You make decisive, specific design choices, you never invent facts about a business, and you return valid JSON only.",
  });
  if (!raw) return null;

  const parsed = PageSystemSchema.safeParse(parseJsonResponse(raw));
  if (!parsed.success) {
    console.error("[page-system] invalid manifest", parsed.error.flatten().fieldErrors);
    return null;
  }

  // A photograph the model hallucinated is a broken image on the live page.
  const allowed = new Set(photos);
  const used = new Set<string>();
  const sections = parsed.data.sections.map((section) => {
    const url = section.imageUrl;
    if (!url || !allowed.has(url) || used.has(url)) return { ...section, imageUrl: null };
    used.add(url);
    return section;
  });

  // Ids must be unique — they are the anchor targets and the CSS escape hatch.
  // A planned "footer" or "nav" section is dropped: the chrome is built by its
  // own dedicated call, and keeping the planned one shipped the page with two
  // footers.
  const seen = new Set<string>();
  const unique = sections.filter((section) => {
    const chrome = /^(footer|nav|navigation|header)$/.test(section.id) || /^(footer|nav|header)$/.test(section.kind);
    if (chrome || seen.has(section.id)) return false;
    seen.add(section.id);
    return true;
  });

  return { ...parsed.data, sections: unique };
}

export async function generateSystemStylesheet(
  system: PageSystem,
  dna: LayoutDna,
  tokens: Record<string, string>
): Promise<string> {
  const prompt = `Write the complete stylesheet for one bespoke local-business homepage.

THE DESIGN THIS IMPLEMENTS
- System name: ${system.systemName}
- Rationale: ${system.rationale}
- Palette: primary ${system.palette.primary}, accent ${system.palette.accent}, ink ${system.palette.ink}, surface ${system.palette.surface}, surface-alt ${system.palette.surfaceAlt}
- Display face: ${system.typography.displayFamily} at weight ${system.typography.displayWeight}, headings ${system.typography.headingCase}
- Body face: ${system.typography.bodyFamily}
- Corner language: ${dna.cornerStyle}
- Recurring motif: ${dna.motif}
- Section rhythm: ${dna.rhythm}
- Contrast strategy: ${dna.contrastStrategy}

${CLASS_VOCABULARY}

CUSTOM PROPERTIES THAT ALREADY EXIST — the application emits this block before your stylesheet.
These are the ONLY variables that are defined for you:
${Object.keys(tokens).sort().join(", ")}

RULES
- Output CSS ONLY. No markdown fence, no commentary, no <style> tag.
- Do NOT write @import or @font-face; the font link is added by the application.
- NEVER reference a custom property that is not in the list above unless you define it yourself
  in this same file with a LITERAL value. A var() pointing at an undefined name renders as
  nothing, which is how a previous build shipped with beige text on beige buttons.
- Do not redefine the variables above. Derive from them with color-mix() or rgb(var(--x-rgb) / a)
  where you need a tint, and give every such rule a literal fallback.
- Implement EVERY class in the vocabulary above. A class that is used by a section but has no rule renders as nothing —
  so implement all of them, including the ones you personally would not have chosen.
- Fluid type with clamp() for .bs-display, .bs-h2, .bs-h3, .bs-lede. The display size must be
  genuinely large on desktop (clamp floor no lower than 2.4rem, ceiling around 5rem) and must not
  overflow its column at any width: set overflow-wrap and a sensible line-height near 1.02.
- .bs-section vertical rhythm uses clamp() too, generous on desktop (around 100px) and tighter on
  mobile. .bs-section--ink flips text, headings, links and muted colour to the inverted palette.
- Real responsive behaviour at 1200px, 900px and 620px. Grids collapse, splits stack, the image
  column comes FIRST on mobile in .bs-split--reverse, type steps down, section padding tightens.
- Every interactive element gets a visible :hover and a :focus-visible outline.
- Buttons: substantial padding, a real weight, a transform or shadow shift on hover, and never a
  transparent primary button. .bs-btn--light is for ink backgrounds.
- .bs-media forces its <img> to width:100%, height:100%, object-fit:cover, display:block.
- Include the mockup-safety rules as real CSS: html/body overflow-x hidden is not allowed as a
  fix — instead nothing may exceed 100%; .bs-nav gets z-index:100; .bs-founder-badge and any
  overlapping chip get their own z-index above their image but below the nav; images never
  stretch.
- Add restrained CSS-only motion: transitions on cards and buttons, and a subtle reveal on
  [data-reveal] elements. No keyframe animation on text that would be caught mid-animation in a
  screenshot.
- Aim for 600 to 1100 lines. Quality of the visual result is what is being judged.`;

  const chain = bestGeminiChain();
  const raw = await callGemini(prompt, chain[0], undefined, {
    modelChain: chain,
    maxTokens: 60000,
    temperature: 0.4,
    timeoutMs: 600_000,
    system: "You are a senior CSS engineer writing production stylesheets. You output CSS and nothing else.",
  });
  if (!raw) return "";

  const stripped = raw
    .replace(/^```[a-z]*\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return sanitizeGeneratedCss(stripped);
}
