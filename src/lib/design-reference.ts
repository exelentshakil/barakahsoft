import { createAdminClient } from "@/lib/supabase/admin";
import type { GeminiImagePart } from "@/lib/gemini-client";
import { PERSONAS } from "@/lib/personas";

// v6 -- loads a real trade's curated design-reference screenshots (resized
// + uploaded once by scripts/upload-design-reference.ts) for use as real
// vision input into selectSectionVariants. Reads from Supabase Storage, not
// local disk -- design-reference/** is never traced/bundled into the
// deployed serverless function, and every other real binary asset in this
// codebase already goes through Storage at runtime.
//
// A persona whose trade folder hasn't been sourced/uploaded yet (most
// trades today -- only roofers is populated) returns [] rather than
// throwing, so callers must treat an empty result as "fall back to
// text-only composition," never as an error.
export async function loadNicheScreenshots(persona: string | null | undefined, limit = 20): Promise<GeminiImagePart[]> {
  if (!persona) return [];
  const admin = createAdminClient();

  const { data: files, error } = await admin.storage.from("design-reference").list(persona, { limit });
  if (error || !files || files.length === 0) return [];

  const results = await Promise.all(
    files.map(async (file) => {
      const { data, error: downloadError } = await admin.storage.from("design-reference").download(`${persona}/${file.name}`);
      if (downloadError || !data) return null;
      const buffer = Buffer.from(await data.arrayBuffer());
      return { mimeType: "image/jpeg", data: buffer.toString("base64") };
    })
  );

  return results.filter((r): r is GeminiImagePart => r !== null);
}

export interface IndustryShowcaseGroup {
  slug: string;
  label: string;
  images: { url: string; alt: string }[];
}

// v6.1 -- public-facing counterpart to loadNicheScreenshots: real design-
// reference screenshots grouped by trade, as public Storage URLs, for the
// landing page's "the caliber we build to" showcase. This is explicitly
// framed as design inspiration/research the team studies, never as
// BarakahSoft's own delivered client work (that's ProofGallery, sourced
// from public/refs/clients/ instead) -- showing a third-party competitor
// site as "our work" would misrepresent authorship.
export async function listIndustryShowcase(limitPerTrade = 6): Promise<IndustryShowcaseGroup[]> {
  const admin = createAdminClient();

  const groups = await Promise.all(
    PERSONAS.filter((p) => p.slug !== "other-trade").map(async (persona) => {
      const { data: files } = await admin.storage.from("design-reference").list(persona.slug, { limit: limitPerTrade });
      const images = (files ?? [])
        .filter((f) => f.name.endsWith(".jpg"))
        .map((f) => {
          const { data } = admin.storage.from("design-reference").getPublicUrl(`${persona.slug}/${f.name}`);
          return { url: data.publicUrl, alt: `Real premium ${persona.label.toLowerCase()} website design` };
        });
      return { slug: persona.slug, label: persona.label, images };
    })
  );

  return groups.filter((g) => g.images.length > 0);
}
