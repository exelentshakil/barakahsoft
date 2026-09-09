import { createAdminClient } from "@/lib/supabase/admin";
import { callSmartModel } from "@/lib/generate/model";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { PROFILES, getCuratedProfile } from "@/lib/verticals/index";
import {
  SCHEMA_TYPES,
  VerticalProfileSchema,
  type VerticalProfile,
} from "@/lib/verticals/types";

// A profile for a business nothing curated recognises.
//
// Six curated verticals cover most local businesses and none of the long tail:
// a driving instructor, a dog groomer, a piano teacher, a funeral director, a
// tattoo studio. Every one of those used to fall back to home-services and get
// a page about job sites, warranties and service areas — the single biggest
// reason the engine felt bound to the trades.
//
// So an unrecognised industry gets its own profile written once, cached, and
// reused by every business in that industry afterwards.
//
// The safety comes from generating a DELTA, never a whole profile. Structure —
// which sections exist, in what order, whether lists may be padded — and the
// art direction are inherited from the nearest curated base and are not
// offered to the model at all. The worst a bad generation can do is give a
// business odd nouns; it cannot reorder a page, disable ten sections, invent a
// schema.org type or downgrade the design.

/** One profile per industry, not per lead. Two Bristol dog groomers share one. */
export function industryKey(industry: string): string {
  return industry
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Fields the model may set. Everything absent here is inherited, silently. */
const WRITABLE = [
  "label",
  "nouns",
  "cta",
  "copy",
  "media",
  "schema",
  "lists",
  "glyphs",
] as const;

/**
 * The closest curated profile to start from.
 *
 * Keyword overlap rather than embeddings: it only has to land in the right
 * neighbourhood, because everything structural is inherited either way and the
 * model rewrites the vocabulary regardless.
 */
function nearestBase(industry: string): VerticalProfile {
  const text = industry.toLowerCase();
  const scored = PROFILES.map((profile) => {
    const hits = profile.match.reduce(
      (total, source) => total + (new RegExp(source, "i").test(text) ? 1 : 0),
      0
    );
    return { profile, hits };
  }).sort((a, b) => b.hits - a.hits);

  if (scored[0]?.hits) return scored[0].profile;
  // Nothing matched at all. Professional services is the least trade-specific
  // structure we have, so it is the safest place for an unknown business to
  // start — home-services would reintroduce exactly the bias this fixes.
  return getCuratedProfile("professional-services") ?? PROFILES[0];
}

function prompt(industry: string, base: VerticalProfile): string {
  const shape = {
    label: base.label,
    nouns: base.nouns,
    lists: { offeringCount: base.lists.offeringCount, areaCount: base.lists.areaCount },
    cta: { intent: base.cta.intent, primaryLabel: base.cta.primaryLabel, guidance: base.cta.guidance },
    copy: {
      persona: base.copy.persona,
      sectionBriefs: base.copy.sectionBriefs,
      voiceRules: base.copy.voiceRules,
      forbiddenSlop: base.copy.forbiddenSlop,
      faqSeeds: base.copy.faqSeeds,
    },
    media: base.media,
    schema: base.schema,
    glyphs: base.glyphs,
  };

  return `A local business describes itself as: "${industry}".

Below is the closest profile we have. It describes how to write and illustrate a
homepage for a DIFFERENT kind of business. Rewrite the parts that are wrong for
"${industry}" and return ONLY those parts.

${JSON.stringify(shape, null, 2)}

RULES
- Return strict JSON. Only keys you are changing. No commentary, no markdown fence.
- You may change: ${WRITABLE.join(", ")}.
- nouns.offeringPath and nouns.areaPath are URL segments: lowercase letters and hyphens only.
- cta.intent must be one of: call-now, quote-form, book-appointment, shop, consultation, enquiry.
  Pick what this business's customer actually does. A driving instructor is booked, a
  funeral director is called, a gallery is visited.
- schema.localBusinessType must be one of: ${SCHEMA_TYPES.join(", ")}. Pick the closest.
  Use LocalBusiness if nothing fits — never invent one.
- lists.areaCount is 0 for a business customers travel TO, and 4-8 for one that
  travels to the customer.
- copy.sectionBriefs says what each page section MEANS for this business. This
  matters most: without it a gym gets a "recent projects" gallery and a warranty
  on its workmanship. Write one plain sentence per section you change.
- copy.faqSeeds: the questions a real customer of THIS business asks before
  getting in touch. Between six and twelve.
- media.* are stock-photo queries and image descriptions. {industry} {city}
  {item} {business} are substituted; keep the placeholders you use.
- Never mention the business we started from.`;
}

/**
 * Write, validate and cache a profile for an industry.
 *
 * Returns the base unchanged if anything fails — a bad generation must produce
 * a slightly generic page, never a broken one.
 */
export async function generateProfileFor(industry: string): Promise<VerticalProfile> {
  const base = nearestBase(industry);
  const slug = `gen:${industryKey(industry)}`;

  let raw: string | null = null;
  try {
    raw = await callSmartModel(prompt(industry, base), {
      system:
        "You adapt a website-generation profile to a different kind of local business. You return strict JSON containing only the fields that change.",
      maxTokens: 3000,
      temperature: 0.4,
    });
  } catch (error) {
    console.warn(`[verticals] profile generation failed for "${industry}"`, error);
    return base;
  }

  const delta = raw ? parseJsonResponse(raw) : null;
  if (!delta || typeof delta !== "object") return base;

  // Only the writable keys are taken, so a model that returns `sections` or
  // `artDirection` anyway has them ignored rather than honoured.
  const merged: Record<string, unknown> = { ...base };
  for (const key of WRITABLE) {
    const value = (delta as Record<string, unknown>)[key];
    if (value && typeof value === "object") {
      merged[key] = { ...(base[key] as object), ...(value as object) };
    }
  }
  merged.slug = slug;
  merged.origin = "generated";
  merged.basedOn = base.slug;
  merged.match = [];

  const parsed = VerticalProfileSchema.safeParse(merged);
  if (!parsed.success) {
    console.warn(
      `[verticals] generated profile for "${industry}" failed validation: ` +
        parsed.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join("; ")
    );
    return base;
  }

  try {
    const admin = createAdminClient();
    await admin
      .from("playbooks")
      .upsert({ slug, industry_label: parsed.data.label, content: parsed.data }, { onConflict: "slug" });
  } catch (error) {
    // Caching is an optimisation. A profile that generated fine but could not
    // be stored still builds this lead correctly.
    console.warn(`[verticals] could not cache profile "${slug}"`, error);
  }

  return parsed.data;
}

/** A previously generated profile, if one exists and still validates. */
export async function loadGeneratedProfile(slug: string): Promise<VerticalProfile | null> {
  if (!slug.startsWith("gen:")) return null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("playbooks")
      .select("content")
      .eq("slug", slug)
      .maybeSingle<{ content: unknown }>();
    if (!data?.content) return null;

    // Validated on read as well as on write: a row stored by an older shape
    // must fall through to a curated profile rather than break a build.
    const parsed = VerticalProfileSchema.safeParse(data.content);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
