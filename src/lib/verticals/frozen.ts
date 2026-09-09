import { SCHEMA_TYPES, type SchemaType } from "@/lib/verticals/types";

// Reading the profile a page was BUILT with, without loading the registry.
//
// A delivered client site needs exactly two facts from its vertical: which
// schema.org type to declare, and what to call an offering. Both are already
// frozen into artifacts.vertical_profile at build time, so resolving through
// the registry to fetch them means bundling six profiles' prompts, art
// direction, photo templates and FAQ seeds — plus zod — into a route that
// renders one string from them.
//
// That is not a theoretical cost: it pushed /s/[leadSlug] past the 1 MB edge
// ceiling and the deploy failed. The route is on Node now, so the wall is
// gone, but sending a hundred kilobytes of copywriting prompts to render a
// client's homepage was wrong regardless.
//
// It is also the more correct read. The frozen snapshot is what the page was
// generated against; the registry is whatever it says today. Those diverge the
// moment a profile is edited, and a delivered site must not silently change
// its structured data because someone tuned a prompt.

const SCHEMA_TYPE_SET = new Set<string>(SCHEMA_TYPES);
const OFFERING_TYPES = new Set(["Service", "Product", "MenuItem", "Course", "Event"]);

interface FrozenSchema {
  localBusinessType: SchemaType;
  offeringSchemaType: "Service" | "Product" | "MenuItem" | "Course" | "Event";
}

/**
 * The schema.org types a delivered page should declare.
 *
 * Validated against the same allowlists the profile schema uses rather than
 * trusted: this value lands in a client's live structured data, and a snapshot
 * written by an older version of the profile shape must degrade to a correct
 * generic type rather than emit something search engines cannot parse.
 */
export function frozenSchema(artifact: { vertical_profile?: unknown } | null | undefined): FrozenSchema {
  const fallback: FrozenSchema = { localBusinessType: "LocalBusiness", offeringSchemaType: "Service" };

  const schema = (artifact?.vertical_profile as { schema?: Record<string, unknown> } | null)?.schema;
  if (!schema) return fallback;

  const local = typeof schema.localBusinessType === "string" ? schema.localBusinessType : "";
  const offering = typeof schema.offeringSchemaType === "string" ? schema.offeringSchemaType : "";

  return {
    localBusinessType: SCHEMA_TYPE_SET.has(local) ? (local as SchemaType) : fallback.localBusinessType,
    offeringSchemaType: OFFERING_TYPES.has(offering)
      ? (offering as FrozenSchema["offeringSchemaType"])
      : fallback.offeringSchemaType,
  };
}
