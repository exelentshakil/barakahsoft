import { createAdminClient } from "@/lib/supabase/admin";
import type { GeminiImagePart } from "@/lib/gemini-client";

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
