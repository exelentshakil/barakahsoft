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
import { callDesignModel } from "@/lib/generate/model";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { DESIGN_LAW, SECTION_BAND } from "@/lib/design/law";
import { answeredForPrompt, missingForPrompt, type IntakeSpec } from "@/lib/intake-spec";
import type { Entity } from "@/lib/extract-entities";
import type { DesignDna } from "@/lib/design-dna";
import type { VerticalProfile } from "@/lib/verticals/types";
import type { DesignIntent } from "@/lib/design";

/**
 * An enum that accepts the answer rather than only the token.
 *
 * A model asked for "muted | moderate | vivid" replies "high-contrast accent";
 * asked for "cool | neutral | warm" it replies "cold and industrial". Both are
 * the RIGHT answer expressed as prose, and rejecting the whole brief over
 * vocabulary throws away a good design because of its packaging. Matched on
 * synonyms, then on substring, then defaulted.
 *
 * Deliberately not solved by adding "reply with exactly one of these words" to
 * the prompt. That instruction is already there; models paraphrase enums under
 * temperature, and a schema that only accepts perfect output is a schema that
 * fails a few per cent of builds for no reason.
 */
function looseEnum<T extends string>(
  values: readonly T[],
  fallback: T,
  synonyms: Record<string, T> = {}
): z.ZodType<T, z.ZodTypeDef, unknown> {
  return z.preprocess((raw) => {
    if (typeof raw !== "string") return fallback;
    const text = raw.toLowerCase().trim();
    const exact = values.find((value) => value === text);
    if (exact) return exact;
    for (const [needle, mapped] of Object.entries(synonyms)) {
      if (text.includes(needle)) return mapped;
    }
    const partial = values.find((value) => text.includes(value));
    return partial ?? fallback;
  }, z.enum(values as unknown as [T, ...T[]]));
}

/**
 * A string with a ceiling it enforces by trimming rather than by rejecting.
 *
 * The whole brief was being thrown away because an editorial device came back
 * at 164 characters against a 160 limit. These caps exist to stop a model
 * writing an essay into a field, not to adjudicate prose by the character —
 * and discarding a good design over four characters is the least defensible
 * failure this pipeline could have.
 */
function text(max: number, min = 0): z.ZodType<string, z.ZodTypeDef, unknown> {
  return z.preprocess((raw) => {
    if (typeof raw !== "string") return raw;
    const trimmed = raw.trim();
    return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
  }, z.string().min(min).max(max));
}

/** An integer that tolerates arriving as "66", "66ch" or "about 66". */
function looseInt(min: number, max: number, fallback: number): z.ZodType<number, z.ZodTypeDef, unknown> {
  return z.preprocess((raw) => {
    const value = typeof raw === "string" ? Number(raw.match(/\d+/)?.[0]) : raw;
    if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, Math.round(value)));
  }, z.number().int().min(min).max(max));
}

/** A number that tolerates arriving as "215" or "215deg". */
const looseNumber = z.preprocess((raw) => {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const match = raw.match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : null;
  }
  return raw ?? null;
}, z.number().min(0).max(360).nullable().default(null));

const SectionSchema = z.object({
  /** Kebab-case, unique. Per-section repair addresses sections by this. */
  id: text(48, 2),
  /** This industry's own word for it: membership-tiers, menu-by-course. */
  kind: text(48, 2),
  purpose: text(240),
  /** Which compiled ground this section sits on. */
  ground: looseEnum(["paper", "paper-2", "paper-3", "dark", "dark-2", "brand"] as const, "paper", {
    light: "paper",
    white: "paper",
    alt: "paper-2",
    tint: "paper-2",
    black: "dark",
    ink: "dark",
    accent: "brand",
  }),
  /** Prose, not an enum. How this section is composed and why. */
  composition: text(320),
  image: z
    .object({
      /**
       * Optional, and assigned from the section id below when absent.
       *
       * This is our own bookkeeping key — the handle a photograph is later
       * swapped by — so asking the model to invent one bought nothing and cost
       * whole briefs when it returned an empty string. Deriving it from the
       * section id also makes it unique by construction.
       */
      slot: text(48).optional().default(""),
      aspect: looseEnum(["wide", "square", "portrait", "tall", "cinema"] as const, "wide", {
        landscape: "wide",
        panoramic: "cinema",
        cinematic: "cinema",
        vertical: "tall",
        full: "tall",
      }),
      /** Written for this business. Never a template with a noun dropped in. */
      brief: text(400, 20),
      /** Is this the one large image, between 45 and 90vh? */
      hero: z.boolean().default(false),
    })
    .nullable()
    .default(null),
});

export const PrdSchema = z.object({
  /** One sentence. Everything else traces back to it. */
  idea: text(240, 12),
  /** Oversized numerals, a seal, marginalia, an index, a marque. */
  editorialDevice: text(160, 4),
  colour: z.object({
    chroma: looseEnum(["muted", "moderate", "vivid"] as const, "moderate", {
      "high-contrast": "vivid",
      saturated: "vivid",
      bold: "vivid",
      intense: "vivid",
      punchy: "vivid",
      desaturated: "muted",
      soft: "muted",
      subtle: "muted",
      restrained: "muted",
    }),
    warmth: looseEnum(["cool", "neutral", "warm"] as const, "neutral", {
      cold: "cool",
      clinical: "cool",
      industrial: "cool",
      blue: "cool",
      earth: "warm",
      amber: "warm",
      cream: "warm",
      substitute: "neutral",
    }),
    /** Anchor on the client's own brand colour where one was found. */
    useBrandHex: z.boolean().default(true),
    hue: looseNumber,
    rationale: text(240).default(""),
  }),
  type: z.object({
    displayFamily: text(60, 2),
    bodyFamily: text(60, 2),
    voice: looseEnum(["editorial", "utility", "clinical", "warm", "brutal"] as const, "editorial", {
      industrial: "brutal",
      raw: "brutal",
      bold: "brutal",
      functional: "utility",
      technical: "utility",
      medical: "clinical",
      precise: "clinical",
      friendly: "warm",
      human: "warm",
    }),
    measure: looseInt(60, 75, 66).default(66),
    rationale: text(240).default(""),
  }),
  space: z.object({
    rhythm: looseEnum(["tight", "generous", "cinematic"] as const, "generous", {
      compact: "tight",
      spacious: "cinematic",
      dramatic: "cinematic",
      expansive: "cinematic",
    }),
    density: looseEnum(["dense", "regular", "airy"] as const, "regular", {
      compact: "dense",
      tight: "dense",
      open: "airy",
      spacious: "airy",
    }),
    maxWidth: looseInt(1000, 1440, 1240).default(1240),
  }),
  motion: z.object({
    character: looseEnum(["calm", "crisp", "dramatic"] as const, "crisp", {
      subtle: "calm",
      gentle: "calm",
      slow: "calm",
      snappy: "crisp",
      quick: "crisp",
      bold: "dramatic",
      cinematic: "dramatic",
    }),
  }),
  radius: looseEnum(["sharp", "soft", "rounded"] as const, "soft", {
    square: "sharp",
    "0": "sharp",
    none: "sharp",
    subtle: "soft",
    pill: "rounded",
    full: "rounded",
  }),
  texture: looseEnum(["none", "grain"] as const, "grain", { noise: "grain", film: "grain", flat: "none", clean: "none" }).default("grain"),
  sections: z.array(SectionSchema).min(SECTION_BAND[0]).max(SECTION_BAND[1]),
  seo: z.object({ title: text(70), description: text(170) }),
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
    `{"idea","editorialDevice","colour":{"chroma","warmth","useBrandHex","hue","rationale"},"type":{"displayFamily","bodyFamily","voice","measure","rationale"},"space":{"rhythm","density","maxWidth"},"motion":{"character"},"radius","texture","sections":[{"id","kind","purpose","ground","composition","image":{"aspect","brief","hero"}|null}],"seo":{"title","description"}}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Why a response could not be used, in enough detail to act on.
 *
 * "did not return a usable brief" with an undefined issue list is what a
 * failed JSON.parse looks like, and it says nothing about whether the model
 * refused, wrapped the object in prose, or was cut off mid-object. The tail
 * matters most: a response that ends without its closing brace was truncated,
 * which is a token budget problem, not a prompt problem.
 */
function describeFailure(raw: string | null, issues?: unknown): string {
  if (!raw) return "no response from the model";
  const trimmed = raw.trim();
  if (issues) return `schema: ${JSON.stringify(issues)}`;
  const truncated = !/[}\]]\s*$/.test(trimmed);
  return [
    truncated ? "TRUNCATED — the response does not end on a closing brace, so raise maxTokens" : "did not parse as JSON",
    `${trimmed.length} chars`,
    `starts: ${trimmed.slice(0, 120).replace(/\s+/g, " ")}`,
    `ends: ${trimmed.slice(-120).replace(/\s+/g, " ")}`,
  ].join(" · ");
}

export interface PrdResult {
  prd: Prd | null;
  /** Why it failed, in words an operator can act on. */
  reason: string | null;
}

/**
 * Write the brief, and try twice.
 *
 * One malformed or truncated response used to end the whole build — the
 * operator saw "the design brief could not be written" and the actual cause
 * sat in a log they were not looking at. A second attempt costs one call
 * against a build that is otherwise thrown away, and the two attempts are not
 * equivalent: the retry drops the temperature and states the failure, so it is
 * a different sample rather than the same dice roll.
 */
export async function writePrdWithReason(input: PrdInput): Promise<PrdResult> {
  const prompt = buildPrompt(input);
  let lastReason = "no response from the model";

  for (const attempt of [0, 1]) {
    const raw = await callDesignModel(
      attempt === 0 ? prompt : `${prompt}\n\nYour previous reply could not be used: ${lastReason}\nReturn the complete JSON object and nothing else.`,
      {
        system:
          "You are an art director briefing a build. You decide rather than describe, you state intent rather than values, and you return valid JSON only.",
        maxTokens: 16000,
        temperature: attempt === 0 ? 0.85 : 0.55,
        timeoutMs: 120_000,
        label: "prd",
      }
    );

    const parsed = raw ? parseJsonResponse(raw) : null;
    const result = parsed ? PrdSchema.safeParse(parsed) : null;

    if (result?.success) {
      // Section ids address sections for per-section repair, so duplicates would
      // make two different blocks the same target. Image slots are derived from the
      // settled id rather than taken from the model, which makes them unique for
      // free and removes an entire class of validation failure.
      //
      // The chrome call renders the navigation and the footer. A PRD that also
      // lists one as a body section ships the page two of them, which is the exact
      // double-header the old sanitizer used to strip markup to prevent.
      const CHROME_KINDS = /^(footer|nav|navigation|header|site-footer|site-header)$/i;
      const seen = new Set<string>();
      const sections = result.data.sections
        .filter((section) => !CHROME_KINDS.test(section.kind.trim()) && !CHROME_KINDS.test(section.id.trim()))
        .map((section, index) => {
          let id = section.id.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
          if (!id || seen.has(id)) id = `${id || "section"}-${index + 1}`;
          seen.add(id);
          const image = section.image ? { ...section.image, slot: section.image.slot?.trim() || id } : null;
          return { ...section, id, image };
        });

      if (sections.length >= SECTION_BAND[0] - 2) {
        return { prd: { ...result.data, sections }, reason: null };
      }
      lastReason = `only ${sections.length} usable sections after filtering; the band starts at ${SECTION_BAND[0]}`;
    } else {
      lastReason = describeFailure(raw, result?.error?.issues?.slice(0, 3));
    }

    console.warn(`[prd] attempt ${attempt + 1} unusable — ${lastReason}`);
  }

  return { prd: null, reason: lastReason };
}

/** Backwards-compatible wrapper for callers that only need the brief. */
export async function writePrd(input: PrdInput): Promise<Prd | null> {
  return (await writePrdWithReason(input)).prd;
}

/** The PRD's intent, in the shape the compiler wants. */
export function intentFrom(prd: Prd, brandHex: string | null): DesignIntent {
  // The loose enums above validate to exactly the engines' unions, but zod's
  // inferred type for a preprocessed enum widens to string, so the engine
  // types are reasserted here rather than loosened at the other end. Anything
  // reaching this point has already been through looseEnum's fallback.
  return {
    colour: {
      brandHex: prd.colour.useBrandHex ? brandHex : null,
      hue: prd.colour.hue,
      chroma: prd.colour.chroma as DesignIntent["colour"]["chroma"],
      warmth: prd.colour.warmth as DesignIntent["colour"]["warmth"],
    },
    type: {
      displayFamily: prd.type.displayFamily,
      bodyFamily: prd.type.bodyFamily,
      voice: prd.type.voice as DesignIntent["type"]["voice"],
      measure: prd.type.measure,
    },
    space: {
      rhythm: prd.space.rhythm as DesignIntent["space"]["rhythm"],
      density: prd.space.density as DesignIntent["space"]["density"],
      maxWidth: prd.space.maxWidth,
    },
    motion: { character: prd.motion.character as DesignIntent["motion"]["character"] },
    radius: prd.radius as DesignIntent["radius"],
    texture: prd.texture as DesignIntent["texture"],
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
