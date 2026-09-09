import { fill } from "@/lib/verticals/fill";
import type { VerticalProfile } from "@/lib/verticals/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { mirrorToStorage, describeImages, saveDescriptions, type MediaSubject } from "@/lib/media/ingest";
import { generateSiteImage, type ImageShape } from "@/lib/media/generate-image";

// Decides which image goes where, before a single line of markup is
// written.
//
// The prior approach handed the generator a flat list of URLs and let it
// choose. With no captions it chose by position, which is how an
// electrical contractor's homepage opened on a photograph of a chandelier
// and how photos of buildings ended up captioned with staff names.
//
// Here every slot states what it needs, real photography is matched against
// that need by what it actually depicts, and only genuinely unfilled slots
// are generated. Real photos always win when they fit: a client's own van
// outside their own shop is worth more than any generated image.

export interface MediaSlot {
  key: string;
  /** Subjects that genuinely satisfy this slot, best first. */
  prefers: MediaSubject[];
  shape: ImageShape;
  /** Scene description used if this slot has to be generated. */
  fallbackSubject: string;
}

export interface PlannedImage {
  slot: string;
  url: string;
  caption: string;
  origin: "real" | "generated";
}

export type MediaPlan = PlannedImage[];

interface StoredAsset {
  id: string;
  public_url: string;
  caption: string | null;
  subject: MediaSubject | null;
  usable: boolean;
  width: number | null;
  height: number | null;
  source: string;
}

/**
 * Bring every real image this lead has into Storage and describe it.
 *
 * Idempotent: assets already mirrored are not fetched again, so a repeat
 * generation costs nothing here. This is also the step that eliminates
 * credential-bearing Google Places URLs from the system entirely.
 */
export async function ingestRealPhotos(
  leadId: string,
  urls: string[],
  industry: string
): Promise<StoredAsset[]> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("media_assets")
    .select("id, public_url, caption, subject, usable, width, height, source")
    .eq("lead_id", leadId)
    .returns<StoredAsset[]>();

  const already = existing ?? [];

  // Only mirror when this lead has nothing stored yet. Re-running a
  // generation should not duplicate the client's photo library.
  if (already.length === 0) {
    const results = await Promise.all(
      urls.slice(0, 24).map((url) => {
        const source = url.includes("googleapis.com") || url.includes("googleusercontent.com") ? "gbp" : "site";
        return mirrorToStorage(leadId, url, source);
      })
    );
    const stored = results.filter((r): r is NonNullable<typeof r> => r !== null);

    if (stored.length > 0) {
      const verdicts = await describeImages(
        stored.map((s) => ({ id: s.id, url: s.publicUrl })),
        industry
      );
      await saveDescriptions(verdicts);
    }

    const { data: refreshed } = await admin
      .from("media_assets")
      .select("id, public_url, caption, subject, usable, width, height, source")
      .eq("lead_id", leadId)
      .returns<StoredAsset[]>();
    return refreshed ?? [];
  }

  // Anything uploaded through the Studio since the last run has no vision
  // verdict yet.
  const undescribed = already.filter((a) => a.subject === null);
  if (undescribed.length > 0) {
    const verdicts = await describeImages(
      undescribed.map((a) => ({ id: a.id, url: a.public_url })),
      industry
    );
    await saveDescriptions(verdicts);

    const { data: refreshed } = await admin
      .from("media_assets")
      .select("id, public_url, caption, subject, usable, width, height, source")
      .eq("lead_id", leadId)
      .returns<StoredAsset[]>();
    return refreshed ?? [];
  }

  return already;
}

/**
 * The slots a premium page actually needs filled.
 *
 * The subjects are written per vertical rather than here. They used to describe
 * a job site and a work van for every business on earth, so a florist's
 * generated hero was "a florist professional at work on a real job site, seen
 * mid-task with real tools and equipment" — which is how a page stops looking
 * expensive before a word of copy is written.
 */
export function buildSlots(
  offerings: string[],
  industry: string,
  city: string,
  profile: VerticalProfile,
  businessName = ""
): MediaSlot[] {
  const vars = {
    industry: industry.toLowerCase(),
    city,
    business: businessName,
    offering: profile.nouns.offering,
  };
  const avoid = profile.media.forbiddenImagery.length
    ? `. Avoid: ${profile.media.forbiddenImagery.join("; ")}`
    : "";

  return [
    {
      key: "hero",
      prefers: ["work", "vehicle", "team", "exterior"],
      shape: "landscape",
      fallbackSubject: fill(profile.media.heroSubject, vars) + avoid,
    },
    {
      key: "about",
      prefers: ["team", "vehicle", "exterior"],
      shape: "landscape",
      fallbackSubject: fill(profile.media.aboutSubject, vars) + avoid,
    },
    {
      key: "proof",
      prefers: ["work", "property", "product"],
      shape: "landscape",
      fallbackSubject: fill(profile.media.proofSubject, vars) + avoid,
    },
    ...offerings.slice(0, 6).map((offering, index) => ({
      key: `service-${index}`,
      prefers: ["work", "product", "property"] as MediaSubject[],
      shape: "landscape" as ImageShape,
      fallbackSubject: fill(profile.media.offeringSubject, { ...vars, item: offering }) + avoid,
    })),
  ];
}

/**
 * Match real photography to slots, generate the remainder.
 *
 * A real photo is used at most once — repeating the same image down a page
 * is one of the loudest "this is a template" signals there is.
 */
export async function planMedia(
  leadId: string,
  assets: StoredAsset[],
  slots: MediaSlot[],
  mood: string
): Promise<MediaPlan> {
  const available = assets
    .filter((a) => a.usable && a.subject !== "logo" && a.subject !== "unusable")
    // Bigger images first within a subject — a page hero needs resolution.
    .sort((a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0));

  const used = new Set<string>();
  const plan: MediaPlan = [];
  const toGenerate: MediaSlot[] = [];

  for (const slot of slots) {
    const match = available.find((a) => !used.has(a.id) && a.subject && slot.prefers.includes(a.subject));
    if (match) {
      used.add(match.id);
      plan.push({
        slot: slot.key,
        url: match.public_url,
        caption: match.caption || slot.fallbackSubject,
        origin: "real",
      });
    } else {
      toGenerate.push(slot);
    }
  }

  // Generated in parallel — this is the slowest part of a build and the
  // slots are independent.
  const generated = await Promise.all(
    toGenerate.map((slot) =>
      generateSiteImage(leadId, {
        subject: slot.fallbackSubject,
        shape: slot.shape,
        mood,
        slotHint: slot.key,
      }).then((img) => (img ? { slot: slot.key, img } : null))
    )
  );

  for (const entry of generated) {
    if (!entry) continue;
    plan.push({ slot: entry.slot, url: entry.img.publicUrl, caption: entry.img.caption, origin: "generated" });
  }

  return plan;
}
