// The PRD — one per site, written before a line of code exists.
//
// This is what makes two leads diverge by design rather than by accident. The
// model commits to a specific aesthetic and a specific structure up front, and
// everything downstream serves that commitment: the engines compile its stated
// intent into real values, the media planner works from its section list, and
// the page is authored against both.
//
// Two things it deliberately does NOT contain.
//
// No literal values. It states intent — a hue, a chroma level, a voice, a
// rhythm — and the engines turn that into OKLCH ramps and tracking curves. A
// PRD naming #3a5a45 would be guessing at solved problems.
//
// No layout enums. Section composition is prose, and section kinds are free
// strings in the industry's own vocabulary. The moment those became a closed
// list we would have rebuilt the template system one layer down.

import { z } from "zod";
import { callSmartModel } from "@/lib/generate/model";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { DESIGN_LAW, SECTION_BAND } from "@/lib/design/law";
import { answeredForPrompt, missingForPrompt, type IntakeSpec } from "@/lib/intake-spec";
import type { Entity } from "@/lib/extract-entities";
import type { DesignDna } from "@/lib/design-dna";
import type { VerticalProfile } from "@/lib/verticals/types";
import type { DesignIntent } from "@/lib/design";

const SectionSchema = z.object({
  /** Kebab-case, unique. Per-section repair addresses sections by this. */
  id: z.string().min(2).max(48),
  /** This industry's own word for it: membership-tiers, menu-by-course. */
  kind: z.string().min(2).max(48),
  purpose: z.string().max(240),
  /** Which compiled ground this section sits on. */
  ground: z.enum(["paper", "paper-2", "paper-3", "dark", "dark-2", "brand"]),
  /** Prose, not an enum. How this section is composed and why. */
  composition: z.string().max(320),
  image: z
    .object({
      slot: z.string().min(2).max(48),
      aspect: z.enum(["wide", "square", "portrait", "tall", "cinema"]),
      /** Written for this business. Never a template with a noun dropped in. */
      brief: z.string().min(20).max(400),
      /** Is this the one image that must run at 70vh or taller? */
      hero: z.boolean().default(false),
    })
    .nullable()
    .default(null),
});

export const PrdSchema = z.object({
  /** One sentence. Everything else traces back to it. */
  idea: z.string().min(12).max(240),
  /** Oversized numerals, a seal, marginalia, an index, a marque. */
  editorialDevice: z.string().min(4).max(160),
  colour: z.object({
    chroma: z.enum(["muted", "moderate", "vivid"]),
    warmth: z.enum(["cool", "neutral", "warm"]),
    /** Anchor on the client's own brand colour where one was found. */
    useBrandHex: z.boolean().default(true),
    hue: z.number().min(0).max(360).nullable().default(null),
    rationale: z.string().max(240).default(""),
  }),
  type: z.object({
    displayFamily: z.string().min(2).max(60),
    bodyFamily: z.string().min(2).max(60),
    voice: z.enum(["editorial", "utility", "clinical", "warm", "brutal"]),
    measure: z.number().int().min(60).max(75).default(66),
    rationale: z.string().max(240).default(""),
  }),
  space: z.object({
    rhythm: z.enum(["tight", "generous", "cinematic"]),
    density: z.enum(["dense", "regular", "airy"]),
    maxWidth: z.number().int().min(1000).max(1440).default(1240),
  }),
  motion: z.object({ character: z.enum(["calm", "crisp", "dramatic"]) }),
  radius: z.enum(["sharp", "soft", "rounded"]),
  texture: z.enum(["none", "grain"]).default("grain"),
  sections: z.array(SectionSchema).min(SECTION_BAND[0]).max(SECTION_BAND[1]),
  seo: z.object({ title: z.string().max(70), description: z.string().max(170) }),
});

export type Prd = z.infer<typeof PrdSchema>;

export interface PrdInput {
  businessName: string;
  industry: string;
  city: string;
  vertical: VerticalProfile;
  entities: Entity[];
  intake: IntakeSpec | null;
  dna: DesignDna | null;
  brandHex: string | null;
  rating: number | null;
  reviewCount: number | null;
  services: string[];
  areas: string[];
  /** What the owner said is wrong with their current site. The argument the page makes. */
  painInstructions: string[];
  /** Photographs actually available, so the section plan can be honest about supply. */
  photoCount: number;
  /** Measured off the reference site rather than described. */
  referenceProfile?: Record<string, unknown> | null;
  band?: [number, number];
}

function entityBlock(entities: Entity[]): string {
  if (!entities.length) return "Nothing verified beyond the basics.";
  const byKind = new Map<string, Entity[]>();
  for (const entity of entities) {
    const list = byKind.get(entity.kind) ?? [];
    list.push(entity);
    byKind.set(entity.kind, list);
  }
  return [...byKind.entries()]
    .map(([kind, list]) => `${kind}:\n${list.map((e) => `  - ${e.label}${e.price ? ` — ${e.price}${e.period ? `/${e.period}` : ""}` : ""}${e.detail ? ` (${e.detail})` : ""}`).join("\n")}`)
    .join("\n");
}

function buildPrompt(input: PrdInput): string {
  const band = input.band ?? SECTION_BAND;
  const answered = answeredForPrompt(input.intake);
  const missing = missingForPrompt(input.intake);
  const blueprint = input.dna?.blueprint?.sections ?? [];

  return [
    `Write the design brief for one real local business homepage. It will be built exactly as you specify, so decide, do not describe options.`,
    ``,
    `THE BUSINESS`,
    `${input.businessName} — ${input.industry} in ${input.city}.`,
    input.rating ? `Rated ${input.rating} from ${input.reviewCount ?? 0} reviews.` : "",
    input.services.length ? `Offers: ${input.services.slice(0, 12).join(", ")}.` : "",
    input.areas.length ? `Serves: ${input.areas.slice(0, 10).join(", ")}.` : "",
    ``,
    `WHAT THEY ACTUALLY HAVE — verified against the pages it came from. Real. Use it by name, print prices exactly as written.`,
    entityBlock(input.entities),
    answered ? `\nSUPPLIED BY THE OPERATOR\n${answered}` : "",
    missing ? `\nSTILL UNKNOWN — design around these. Do NOT invent a value to fill one.\n${missing}` : "",
    ``,
    input.painInstructions.length
      ? `WHAT THE OWNER SAYS IS WRONG WITH THEIR CURRENT SITE\nThis is the argument the page has to make.\n${input.painInstructions.map((p) => `- ${p}`).join("\n")}\n`
      : "",
    blueprint.length
      ? `HOW A LEADING SITE IN THIS INDUSTRY IS STRUCTURED\nStructure only — never their words, claims or numbers.\n${blueprint.map((s) => `- ${s.kind}: ${s.purpose}`).join("\n")}\n`
      : "",
    input.referenceProfile
      ? `MEASURED OFF THAT REFERENCE, not described: ${JSON.stringify(input.referenceProfile)}\n`
      : "",
    input.brandHex ? `THEIR REAL BRAND COLOUR: ${input.brandHex}\n` : "",
    `PHOTOGRAPHS AVAILABLE: ${input.photoCount}. Plan image slots you can actually fill.`,
    ``,
    DESIGN_LAW,
    ``,
    `WHAT YOU DECIDE`,
    `You state INTENT, never values. You do not choose hex codes, pixel sizes or durations — an OKLCH colour engine, a font-metric type engine and a spacing engine turn your intent into real numbers, and they are better at it than either of us.`,
    ``,
    `1. The organising idea, in one sentence. Specific to this business. "Nobody is watching you here" is an idea; "modern and professional" is not.`,
    `2. The editorial device carried through the page.`,
    `3. Colour intent: chroma level, ground warmth, and whether to anchor on their brand colour.`,
    `4. Type: two Google font families and a voice. Pick families that suit this trade, not the safe default.`,
    `5. Rhythm, density, motion character, radius, texture.`,
    `6. Between ${band[0]} and ${band[1]} sections, in THIS industry's vocabulary — "membership-tiers", not "pricing"; "menu-by-course", not "services". Order them. For each, name its ground, and describe in prose how it is composed and why that serves the idea.`,
    `7. For each section that needs a photograph, an art-direction brief written for THIS business in real sentences. Never a template with a noun dropped into it.`,
    ``,
    `Return JSON only, matching this shape:`,
    `{"idea","editorialDevice","colour":{"chroma","warmth","useBrandHex","hue","rationale"},"type":{"displayFamily","bodyFamily","voice","measure","rationale"},"space":{"rhythm","density","maxWidth"},"motion":{"character"},"radius","texture","sections":[{"id","kind","purpose","ground","composition","image":{"slot","aspect","brief","hero"}|null}],"seo":{"title","description"}}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function writePrd(input: PrdInput): Promise<Prd | null> {
  const raw = await callSmartModel(
    buildPrompt(input),
    {
      system:
        "You are an art director briefing a build. You decide rather than describe, you state intent rather than values, and you return valid JSON only.",
      maxTokens: 12000,
      temperature: 0.85,
    },
    "gemini"
  );

  const parsed = raw ? parseJsonResponse(raw) : null;
  const result = parsed ? PrdSchema.safeParse(parsed) : null;
  if (!result?.success) {
    console.warn("[prd] model did not return a usable brief", result?.error?.issues?.slice(0, 3));
    return null;
  }

  // Section ids address sections for per-section repair, so duplicates would
  // make two different blocks the same target.
  const seen = new Set<string>();
  const sections = result.data.sections.map((section, index) => {
    let id = section.id.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!id || seen.has(id)) id = `${id || "section"}-${index + 1}`;
    seen.add(id);
    return { ...section, id };
  });

  return { ...result.data, sections };
}

/** The PRD's intent, in the shape the compiler wants. */
export function intentFrom(prd: Prd, brandHex: string | null): DesignIntent {
  return {
    colour: {
      brandHex: prd.colour.useBrandHex ? brandHex : null,
      hue: prd.colour.hue,
      chroma: prd.colour.chroma,
      warmth: prd.colour.warmth,
    },
    type: {
      displayFamily: prd.type.displayFamily,
      bodyFamily: prd.type.bodyFamily,
      voice: prd.type.voice,
      measure: prd.type.measure,
    },
    space: { rhythm: prd.space.rhythm, density: prd.space.density, maxWidth: prd.space.maxWidth },
    motion: { character: prd.motion.character },
    radius: prd.radius,
    texture: prd.texture,
  };
}

/** The PRD as something an operator can read in the Studio. */
export function prdToMarkdown(prd: Prd): string {
  const lines = [
    `## ${prd.idea}`,
    ``,
    `**Editorial device** — ${prd.editorialDevice}`,
    ``,
    `**Colour** — ${prd.colour.chroma} chroma on a ${prd.colour.warmth} ground${prd.colour.useBrandHex ? ", anchored on their own brand colour" : ""}. ${prd.colour.rationale}`,
    `**Type** — ${prd.type.displayFamily} over ${prd.type.bodyFamily}, ${prd.type.voice} voice, ${prd.type.measure}ch measure. ${prd.type.rationale}`,
    `**Space** — ${prd.space.rhythm} rhythm, ${prd.space.density} density, ${prd.space.maxWidth}px column.`,
    `**Motion** — ${prd.motion.character}. **Radius** — ${prd.radius}. **Texture** — ${prd.texture}.`,
    ``,
    `### The page — ${prd.sections.length} sections`,
    ``,
  ];
  for (const [index, section] of prd.sections.entries()) {
    lines.push(`**${String(index + 1).padStart(2, "0")}. ${section.kind}** \`${section.id}\` · on ${section.ground}`);
    lines.push(`${section.purpose}`);
    lines.push(`*Composition:* ${section.composition}`);
    if (section.image) lines.push(`*Image (${section.image.slot}, ${section.image.aspect}):* ${section.image.brief}`);
    lines.push("");
  }
  return lines.join("\n");
}
