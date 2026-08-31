import { z } from "zod";
import { bestGeminiChain, callGemini } from "@/lib/gemini-client";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { sanitizeGeneratedCss } from "@/lib/sanitize-css";
import { CLASS_VOCABULARY, MOCKUP_RULES, COPY_RULES, CONVERSION_RULES } from "@/lib/generate/v2/vocabulary";
import type { LayoutDna } from "@/lib/generate/v2/layout-dna";
import type { PoolPhoto } from "@/lib/generate/v2/photo-pool";
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
  // "brand" is a solid brand-colour band; the stylesheet implements it.
  background: z
    .string()
    .transform((value) => {
      const normalised = value.trim().toLowerCase();
      if (normalised === "surfacealt" || normalised === "surface-alt" || normalised === "alt") return "tint";
      if (normalised === "image" || normalised === "photograph") return "photo";
      if (normalised === "dark" || normalised === "inverted") return "ink";
      if (normalised === "primary" || normalised === "colour" || normalised === "color") return "brand";
      return normalised;
    })
    .pipe(z.enum(["surface", "tint", "ink", "photo", "brand"]).catch("surface"))
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
  photos: PoolPhoto[];
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
- Photographs available (client photos first — prefer those for the hero, the about section and any
  section about this business's own work; the stock ones are for service cards and supporting bands):
${photos.length ? photos.map((photo) => `  [${photo.source}] ${photo.url} — ${photo.caption}`).join("\n") : "  none — the page must work with zero photographs"}

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

${CONVERSION_RULES}

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
- THIS PAGE IS PHOTO-LED. At least eight sections must carry a photograph, and the services section
  must use photo cards (one image per service). Assign an imageUrl only from the list above, each URL
  at most once, never the same one in adjacent sections. A section with no photograph must be
  composed WITHOUT any image frame — an empty frame renders as a grey box.
- COLOUR RHYTHM. The page is LIGHT overall, with colour used decisively: use background "surface"
  or "tint" for most sections, AT MOST TWO "ink" sections in the whole page, and at least one
  "brand" section (solid brand colour, white text) for the emergency or mid-page conversion band.
  A page that is mostly dark grey reads as cheap; a light page with two or three confident colour
  bands reads as expensive.
- Section two is a trust bar: rating, review count, years, and the credential badges. Short.
- The hero always carries the lead-capture form. That is not negotiable and not a section of its own.
- The about section always carries the founder identity: the founder's name and role on a badge over
  the photograph, with the business logo beside it.
- copyPoints are the real, factual points the section must make, drawn from the facts above.

Choose Google-hosted type: a display family with real character for headings and a highly legible
body family. They must not be the same family and must not both be Inter.

Return STRICT JSON only, no prose, no code fence:
{"systemName":"","rationale":"","palette":{"primary":"#","accent":"#","ink":"#","surface":"#","surfaceAlt":"#"},
"typography":{"displayFamily":"","bodyFamily":"","displayWeight":"800","headingCase":"title"},
"sections":[{"id":"hero","kind":"hero","label":"","archetype":"","intent":"","copyPoints":[""],"background":"photo","imageUrl":null}]}

background is one of: surface | tint | ink | brand | photo`;

  const chain = bestGeminiChain();
  const raw = await callGemini(prompt, chain[0], undefined, {
    modelChain: chain,
    maxTokens: 32000,
    temperature: 0.75,
    timeoutMs: 260_000,
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
  const allowed = new Set(photos.map((photo) => photo.url));
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

// generateSystemStylesheet is gone on purpose.
//
// One Pro call used to invent the entire stylesheet on every build. That made
// the look of the page a lottery: the run that shipped mega-menu panels open
// down the top of the page, a hero that never filled the screen and a polite
// type scale was not a bad prompt, it was the inevitable outcome of asking a
// model for six hundred lines of CSS it cannot see the result of.
//
// The design system is hand-written now (base-stylesheet.ts) and this call
// only chooses palette, typefaces and composition. See BASE_STYLESHEET.
