import { SECTION_IDS, isSectionId, type SectionId } from "@/lib/section-ids";
import type { DesignDna } from "@/lib/design-dna";
import type { VerticalProfile } from "@/lib/verticals/types";
import type { Entity } from "@/lib/extract-entities";

// Which sections this page has, and in what order.
//
// This used to be a literal array in templates/index.ts, then a per-vertical
// list in the profile. Both answer the question "what does a page of this kind
// look like" by hand, in advance, for every business at once — which is why a
// gym got a "Recent projects" gallery and a workmanship guarantee.
//
// Now two things that were already being paid for decide it:
//
//   the BLUEPRINT   a best-in-class site in the lead's own industry, scraped
//                   for its section sequence. It knows a gym page leads with
//                   membership tiers because it IS a gym page. Nothing has to
//                   guess.
//
//   the ENTITIES    what THIS client actually has, read from their own site
//                   and verified against the page each fact came from.
//
// A section renders when the reference wanted it AND the client can fill it.
// A section the client cannot fill is dropped, never padded — an empty
// membership table is bad, and an invented one is worse. What gets dropped is
// recorded, because the components worth building next are the ones references
// keep asking for and we keep dropping, measured rather than guessed.

export interface ComposedSection {
  id: SectionId;
  /** The reference's own name for it: "membership-tiers", "menu-by-course". */
  kind: string;
  /** What the reference used it for. Reaches the copy prompt. */
  purpose: string;
}

export interface Composition {
  sections: ComposedSection[];
  /** One line per dropped section, written to qa_notes. */
  notes: string[];
  source: "blueprint" | "vertical";
}

/**
 * What the page can actually evidence.
 *
 * Entity kinds plus the facts the brief already carries. Reviews, photographs
 * and service areas never became entities — they arrive through Places and the
 * media plan — so a blueprint asking for them must be able to match on them.
 */
export interface Capability {
  entities: Entity[];
  hasReviews: boolean;
  hasPhotos: boolean;
  areaCount: number;
  serviceCount: number;
}

/**
 * Fold a need or an entity kind onto one word.
 *
 * The blueprint and the extractor are both free-text by design, so they meet
 * here rather than in a shared enum: a reference may ask for "pricing" and the
 * client's site may yield "pricing-tier"; one says "staff", the other "person".
 * Matching on the stem keeps both sides free to use their own industry's
 * vocabulary, which was the whole point of not making them enums.
 */
function stem(word: string): string {
  const base = word
    .toLowerCase()
    .trim()
    .replace(/[^a-z]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/s$/, "");

  const FOLD: Record<string, string> = {
    "pricing": "price",
    "pricing-tier": "price",
    "price-tier": "price",
    "membership": "price",
    "membership-tier": "price",
    "package": "price",
    "plan": "price",
    "tier": "price",
    "cost": "price",
    "class": "class",
    "session": "class",
    "course": "class",
    "timetable": "class",
    "schedule": "class",
    "person": "person",
    "people": "person",
    "staff": "person",
    "team": "person",
    "coach": "person",
    "trainer": "person",
    "instructor": "person",
    "therapist": "person",
    "practitioner": "person",
    "review": "review",
    "testimonial": "review",
    "rating": "review",
    "photo": "photo",
    "image": "photo",
    "gallery": "photo",
    "picture": "photo",
    "location": "area",
    "area": "area",
    "branch": "area",
    "venue": "area",
    "premise": "area",
    "service": "offering",
    "offering": "offering",
    "treatment": "offering",
    "product": "offering",
    "dish": "offering",
    "menu-item": "offering",
    "certification": "certification",
    "accreditation": "certification",
    "award": "certification",
    "credential": "certification",
    "qualification": "certification",
    "policy": "policy",
    "guarantee": "policy",
    "warranty": "policy",
    "opening-hour": "hours",
    "hour": "hours",
    "opening-time": "hours",
    "amenity": "amenity",
    "facility": "amenity",
    "equipment": "amenity",
    "differentiator": "differentiator",
    "usp": "differentiator",
  };
  return FOLD[base] ?? base;
}

/** Everything this lead can evidence, as folded stems. */
function availableStems(capability: Capability): Set<string> {
  const stems = new Set(capability.entities.map((entity) => stem(entity.kind)));
  if (capability.hasReviews) stems.add("review");
  if (capability.hasPhotos) stems.add("photo");
  if (capability.areaCount > 0) stems.add("area");
  if (capability.serviceCount > 0) stems.add("offering");
  return stems;
}

/**
 * Sections that stand on their own.
 *
 * A hero, a contact block, a conversion band, an about and an FAQ need no
 * scraped evidence — they are the page's entry, exit and voice, built from the
 * business's name, phone, address and story, which every lead has by
 * definition. Gating them on entities would let a thin scrape produce a page
 * with no way to get in touch.
 *
 * Deliberately short. `process`, `trust` and `why-us` also render from copy
 * alone, but when a reference says one of them needs classes or people, a page
 * without classes or people should not print that section generically — it
 * should drop it and say so. If enough drops out, the whole composition falls
 * back to the vertical's list, which is the safe floor.
 */
const NEEDS_NO_EVIDENCE = new Set<SectionId>(["hero", "contact", "cta-band", "about", "faq"]);

/**
 * Resolve a blueprint section to a renderer.
 *
 * `nearest` is what the model was asked for and is usually right. When it is
 * absent or nonsense, the section's own `kind` is tried against the id list,
 * because "faq" and "process" arrive under their own names often enough to be
 * worth catching before the section is dropped.
 */
function rendererFor(kind: string, nearest: string | null): SectionId | null {
  if (nearest && isSectionId(nearest)) return nearest;
  const folded = kind.toLowerCase().replace(/[^a-z]+/g, "-");
  if (isSectionId(folded)) return folded;
  const hit = SECTION_IDS.find((id) => folded.includes(id) || id.includes(folded));
  return hit ?? null;
}

/**
 * The vertical's own section list, plus anything the client's facts earn.
 *
 * No curated profile lists `pricing` or `people` — they were written before
 * either renderer existed, and rewriting six profiles to add sections most of
 * their businesses cannot fill would put an empty table on every page in the
 * vertical. So the evidence adds them instead: a client with real priced tiers
 * gets a price table whether or not a reference asked for one, and a client
 * without them sees no difference at all.
 */
function fromVertical(vertical: VerticalProfile, capability: Capability): ComposedSection[] {
  const sections: ComposedSection[] = vertical.sections
    .filter((section) => section.enabled)
    .map((section) => ({ id: section.id, kind: section.id, purpose: "" }));

  const have = availableStems(capability);
  const insertAfter = (id: SectionId, after: SectionId[], kind: string) => {
    if (sections.some((section) => section.id === id)) return;
    const at = after
      .map((target) => sections.findIndex((section) => section.id === target))
      .filter((index) => index >= 0)
      .pop();
    const position = at === undefined ? sections.length - 1 : at + 1;
    sections.splice(Math.max(position, 1), 0, { id, kind, purpose: "" });
  };

  // Prices belong straight after what they are prices for.
  if (have.has("price")) insertAfter("pricing", ["services"], "pricing");
  // The team reads best once the business has introduced itself.
  if (have.has("person")) insertAfter("people", ["about", "why-us"], "people");

  return sections;
}

export function composePage(args: {
  vertical: VerticalProfile;
  design: DesignDna | null;
  capability: Capability;
}): Composition {
  const { vertical, design, capability } = args;
  const blueprint = design?.blueprint;

  // No reference was researched for this lead, so there is nothing better to
  // compose from than the vertical's own list. This is the pre-blueprint
  // behaviour exactly, and it stays correct.
  if (!blueprint || blueprint.sections.length === 0) {
    return { sections: fromVertical(vertical, capability), notes: [], source: "vertical" };
  }

  const have = availableStems(capability);
  const sections: ComposedSection[] = [];
  const notes: string[] = [];
  const used = new Set<SectionId>();

  for (const section of blueprint.sections) {
    const id = rendererFor(section.kind, section.nearest);
    if (!id) {
      // The honest outcome, and the valuable one: a reference asked for
      // something this engine cannot build. Counted rather than approximated.
      notes.push(`[blueprint] dropped "${section.kind}" — no renderer fits it (${section.purpose})`);
      continue;
    }
    if (used.has(id)) {
      notes.push(`[blueprint] dropped "${section.kind}" — ${id} is already on the page`);
      continue;
    }

    const needs = section.needs.map(stem).filter(Boolean);
    const missing = NEEDS_NO_EVIDENCE.has(id) ? [] : needs.filter((need) => !have.has(need));
    if (missing.length > 0 && needs.length > 0) {
      notes.push(
        `[blueprint] dropped "${section.kind}" — this business has no ${missing.join(", ")} on their site`
      );
      continue;
    }

    used.add(id);
    sections.push({ id, kind: section.kind, purpose: section.purpose });
  }

  // A page must have a way in and a way to get in touch, whatever the
  // reference happened to do. Everything else is genuinely optional.
  for (const required of ["hero", "contact"] as const) {
    if (!used.has(required)) {
      const at = required === "hero" ? 0 : sections.length;
      sections.splice(at, 0, { id: required, kind: required, purpose: "" });
      used.add(required);
      notes.push(`[blueprint] added ${required} — the reference had none and a page needs one`);
    }
  }

  // A blueprint that resolved to almost nothing is a bad extraction, not a
  // minimal page. Fall back rather than ship three sections.
  if (sections.length < 5) {
    notes.push(
      `[blueprint] only ${sections.length} section(s) survived; using the ${vertical.slug} section list instead`
    );
    return { sections: fromVertical(vertical, capability), notes, source: "vertical" };
  }

  return { sections, notes, source: "blueprint" };
}
