// The brief, generated per lead instead of asked as a fixed form.
//
// The Studio asked the same ten questions of a gym, a plumber and a
// restaurant. That is the input-side cause of generic output: a page can only
// be as specific as what it was told, and "Core Services / Products, one per
// line" is not how anyone describes a membership tier or a class timetable.
//
// So the questions are written for this business. One model call answers:
// what does a best-in-class site in this industry always show, and which of
// those do we already have? Everything Firecrawl could not determine comes
// back as a labelled placeholder with an industry-standard example, so the
// operator can see at a glance what to chase.
//
// The load-bearing part is `unlocks`. A blueprint section the client cannot
// evidence used to be struck through and silently dropped, and a page that
// lost enough of them fell back to the vertical's generic list — which is
// exactly how a distinctive reference produced a boring page. Now the missing
// evidence becomes a question, and answering it brings the section back.

import { z } from "zod";
import { callDesignModel } from "@/lib/generate/model";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { entityKinds, type Entity } from "@/lib/extract-entities";
import type { VerticalProfile } from "@/lib/verticals/types";
import type { DesignDna } from "@/lib/design-dna";

/**
 * A list that tolerates being handed one item.
 *
 * Models return `"membership-tiers"` where the schema asks for
 * `["membership-tiers"]` often enough that rejecting it is a self-inflicted
 * failure — the answer was right and the punctuation was not. Coercing at the
 * boundary is cheaper and more honest than another line of prompt telling it
 * to remember the brackets.
 */
const listOf = (item: z.ZodString) =>
  z.preprocess((value) => {
    if (typeof value === "string") return value.trim() ? [value] : [];
    if (value === null || value === undefined) return [];
    return value;
  }, z.array(item));

/** Trims to the cap rather than rejecting the brief over a long label. */
function text(max: number, min = 0): z.ZodType<string, z.ZodTypeDef, unknown> {
  return z.preprocess((raw) => {
    if (typeof raw !== "string") return raw;
    const trimmed = raw.trim();
    return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
  }, z.string().min(min).max(max));
}

export const IntakeFieldSchema = z.object({
  key: text(48, 2),
  label: text(80, 2),
  /** "Pricing", "Facilities", "People" — how the Studio groups the form. */
  group: text(40, 2),
  /** Why a great page needs it. Shown to the operator, and fed back into the PRD. */
  why: text(220).default(""),
  type: z.enum(["text", "longtext", "list", "price-table", "people", "hours", "boolean", "url", "number"]),
  /** A real example in this industry's own words, so the shape is obvious. */
  placeholder: text(240).default(""),
  /** Can a genuinely good page be built without this? */
  blocking: z.boolean().default(false),
  /** Section kinds this field brings back into the page. */
  unlocks: listOf(z.string().max(64)).default([]),
});

export type IntakeField = z.infer<typeof IntakeFieldSchema>;

export const IntakeSpecSchema = z.object({
  fields: z.array(IntakeFieldSchema).min(6).max(24),
});

export type FieldSource = "firecrawl" | "gbp" | "entities" | "operator" | null;

export interface ResolvedField extends IntakeField {
  found: boolean;
  value: string | string[] | null;
  source: FieldSource;
}

export interface IntakeSpec {
  fields: ResolvedField[];
  /** Fields a great page needs that nobody has answered yet. */
  missing: ResolvedField[];
  generatedAt: string;
}

export interface IntakeInput {
  businessName: string;
  industry: string;
  city: string;
  vertical: VerticalProfile;
  entities: Entity[];
  dna: DesignDna | null;
  /** Whatever the operator has already typed, keyed by field key. */
  overrides: Record<string, unknown>;
  /** Scraped facts, for the "do we already have this" pass. */
  facts: Record<string, unknown>;
}

function unmetBlueprintNeeds(dna: DesignDna | null, entities: Entity[]): Array<{ kind: string; needs: string[] }> {
  const have = entityKinds(entities);
  const sections = dna?.blueprint?.sections ?? [];
  return sections
    .map((section) => ({ kind: section.kind, needs: (section.needs ?? []).filter((need) => !have.has(need)) }))
    .filter((entry) => entry.needs.length > 0);
}

function prompt(input: IntakeInput): string {
  const unmet = unmetBlueprintNeeds(input.dna, input.entities);
  const have = [...entityKinds(input.entities)];

  return [
    `Write the intake brief for one local business, so that a designer who has never met them could build a homepage that could not belong to anyone else.`,
    ``,
    `THE BUSINESS`,
    `${input.businessName} — ${input.industry} in ${input.city}.`,
    input.vertical.nouns ? `They call their offerings "${JSON.stringify(input.vertical.nouns)}".` : "",
    ``,
    `WHAT WE ALREADY VERIFIED FROM THEIR OWN SITE`,
    have.length ? have.map((kind) => `- ${kind}`).join("\n") : "- nothing beyond the basics",
    ``,
    unmet.length
      ? [
          `SECTIONS THE REFERENCE SITE LEADS WITH THAT WE CANNOT YET FILL`,
          `Each of these is a section this page should have and currently cannot, because the evidence is missing.`,
          `Write a field for each so the operator can supply it. Set "unlocks" to the section kind.`,
          ...unmet.map((entry) => `- ${entry.kind} — needs ${entry.needs.join(", ")}`),
          ``,
        ].join("\n")
      : "",
    `WHAT TO RETURN`,
    `Between 8 and 18 fields. Ask for what a genuinely best-in-class ${input.industry} site always shows, in THIS industry's own vocabulary.`,
    `A gym is asked for membership tiers and prices, a class timetable, trainer names and specialisms, facilities and equipment, whether there is a free trial, and staffed hours.`,
    `A restaurant is asked for menu highlights, cuisine, how booking works, covers, and dietary provision.`,
    `A roofer is asked for emergency callout, response time, certifications, and what the guarantee actually covers.`,
    `Never ask for "core services, one per line". Ask for the thing itself.`,
    ``,
    `Every field carries a "placeholder" written as a real example in their industry, so the operator can see the expected shape without guessing.`,
    `Mark "blocking" true only where a genuinely good page cannot be built without it.`,
    ``,
    `Return JSON: {"fields":[{"key","label","group","why","type","placeholder","blocking","unlocks"}]}`,
    `"type" is one of: text, longtext, list, price-table, people, hours, boolean, url, number.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Answer what we can before asking the operator.
 *
 * Order matters: an operator override always wins, because it is the only
 * source that has seen the business. Verified entities beat scraped facts for
 * the same reason they are extracted separately — they carry a source page.
 */
function resolve(field: IntakeField, input: IntakeInput): ResolvedField {
  const override = input.overrides[field.key];
  if (override !== undefined && override !== null && override !== "") {
    return { ...field, found: true, value: override as string | string[], source: "operator" };
  }

  const matching = input.entities.filter(
    (entity) => entity.kind === field.key || field.unlocks.includes(entity.kind) || entity.kind.replace(/-/g, "") === field.key.replace(/-/g, "")
  );
  if (matching.length) {
    return {
      ...field,
      found: true,
      value: matching.map((entity) => [entity.label, entity.price, entity.detail].filter(Boolean).join(" — ")),
      source: "entities",
    };
  }

  const fact = input.facts[field.key] ?? input.facts[field.key.replace(/-/g, "_")];
  if (typeof fact === "string" && fact.trim()) {
    return { ...field, found: true, value: fact.trim(), source: "firecrawl" };
  }

  return { ...field, found: false, value: null, source: null };
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

export async function buildIntakeSpec(input: IntakeInput): Promise<IntakeSpec | null> {
  const raw = await callDesignModel(
    prompt(input),
    {
      system: "You write intake briefs for local business websites. You ask for what the industry actually shows, never for generic web-form fields. You return valid JSON only.",
      maxTokens: 6000,
      temperature: 0.5,
      // Short call: a provider that has stopped answering should be found in a
      // minute, not after a full chain walk. Observed live at 939s.
      timeoutMs: 70_000,
      label: "intake",
    }
  );

  const parsed = raw ? parseJsonResponse(raw) : null;
  const result = parsed ? IntakeSpecSchema.safeParse(parsed) : null;
  if (!result?.success) {
    console.warn(`[intake-spec] unusable — ${describeFailure(raw, result?.error?.issues?.slice(0, 3))}`);
    return null;
  }

  const fields = result.data.fields.map((field) => resolve(field, input));
  return {
    fields,
    missing: fields.filter((field) => !field.found),
    generatedAt: new Date().toISOString(),
  };
}

/** Everything the operator has answered, as prose for the PRD. */
export function answeredForPrompt(spec: IntakeSpec | null): string {
  if (!spec) return "";
  const answered = spec.fields.filter((field) => field.found);
  if (!answered.length) return "";
  return answered
    .map((field) => `- ${field.label}: ${Array.isArray(field.value) ? field.value.join(" | ") : field.value}`)
    .join("\n");
}

/**
 * The holes, stated plainly.
 *
 * Given to the model on purpose. A page that knows what it does not know
 * designs around the gap; a page that is not told invents a price to balance a
 * layout, which is the one failure that cannot ship to a real client.
 */
export function missingForPrompt(spec: IntakeSpec | null): string {
  if (!spec?.missing.length) return "";
  return spec.missing.map((field) => `- ${field.label}${field.blocking ? " (needed for a strong page)" : ""}`).join("\n");
}
