import { createAdminClient } from "@/lib/supabase/admin";
import { mirrorToStorage } from "@/lib/media/ingest";
import { generateSiteImage, type ImageShape } from "@/lib/media/generate-image";
import { recordVersion, HOME_KEY } from "@/lib/page-versions";
import type { MediaPlan } from "@/lib/media/plan-media";

// Image slots — the human refinement layer over generated photography.
//
// Generated imagery is a placeholder, never the deliverable. A page whose
// hero is an AI image is a page that is not finished, and the Studio has to
// say so plainly rather than presenting it as done.
//
// Swapping an image rewrites the stored markup rather than adding a
// render-time indirection. That keeps one representation of a page: what is
// in the database is exactly what renders, and exactly what the standalone
// export produces. A render-time lookup would have meant the exported site
// and the previewed site could diverge.

export interface SlotView {
  key: string;
  label: string;
  url: string;
  caption: string;
  origin: "real" | "generated" | "uploaded";
  /** Page keys whose markup currently references this image. */
  usedOn: string[];
  shape: ImageShape;
}

const SLOT_LABELS: Record<string, string> = {
  hero: "Hero",
  about: "About / team",
  proof: "Proof / finished work",
};

function slotLabel(key: string, serviceNames: string[]): string {
  if (SLOT_LABELS[key]) return SLOT_LABELS[key];
  const service = key.match(/^service-(\d+)$/);
  if (service) {
    const index = Number(service[1]);
    return serviceNames[index] ? `Service · ${serviceNames[index]}` : `Service ${index + 1}`;
  }
  return key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Every page's markup, keyed the same way page_versions keys them. */
async function loadAllPages(leadId: string): Promise<Record<string, string>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("artifacts")
    .select("bespoke_homepage_html, bespoke_pages")
    .eq("lead_id", leadId)
    .single<{ bespoke_homepage_html: string | null; bespoke_pages: Record<string, string> }>();

  const pages: Record<string, string> = { ...(data?.bespoke_pages ?? {}) };
  if (data?.bespoke_homepage_html) pages[HOME_KEY] = data.bespoke_homepage_html;
  return pages;
}

/**
 * The slot list the Studio renders.
 *
 * `usedOn` is computed by looking for each URL in the real stored markup
 * rather than trusting the plan, because the markup is what a visitor
 * actually sees — a slot the generator planned but never placed would
 * otherwise show as filled.
 */
export async function listSlots(leadId: string, serviceNames: string[]): Promise<SlotView[]> {
  const admin = createAdminClient();

  const [{ data: artifact }, pages] = await Promise.all([
    admin
      .from("artifacts")
      .select("media_plan")
      .eq("lead_id", leadId)
      .single<{ media_plan: MediaPlan | null }>(),
    loadAllPages(leadId),
  ]);

  const plan = artifact?.media_plan ?? [];
  if (plan.length === 0) return [];

  const { data: assets } = await admin
    .from("media_assets")
    .select("public_url, source")
    .eq("lead_id", leadId)
    .returns<{ public_url: string; source: string }[]>();

  const sourceByUrl = new Map((assets ?? []).map((a) => [a.public_url, a.source]));

  return plan.map((entry) => {
    const usedOn = Object.entries(pages)
      .filter(([, html]) => html.includes(entry.url))
      .map(([key]) => key);

    const assetSource = sourceByUrl.get(entry.url);
    const origin: SlotView["origin"] =
      assetSource === "upload" ? "uploaded" : assetSource === "generated" ? "generated" : "real";

    return {
      key: entry.slot,
      label: slotLabel(entry.slot, serviceNames),
      url: entry.url,
      caption: entry.caption,
      origin,
      usedOn,
      shape: entry.slot === "hero" ? "landscape" : "landscape",
    };
  });
}

/**
 * Point a slot at a new image across every page that references it.
 *
 * Returns the pages that changed. Each one is written through the version
 * recorder, so swapping a photo is undoable exactly like a copy edit.
 */
export async function repointSlot(leadId: string, oldUrl: string, newUrl: string, note: string): Promise<string[]> {
  const admin = createAdminClient();
  const pages = await loadAllPages(leadId);
  const changed: string[] = [];

  const nextPages: Record<string, string> = {};
  let nextHome: string | null = null;

  for (const [key, html] of Object.entries(pages)) {
    if (!html.includes(oldUrl)) {
      if (key !== HOME_KEY) nextPages[key] = html;
      continue;
    }
    const updated = html.split(oldUrl).join(newUrl);
    changed.push(key);
    if (key === HOME_KEY) nextHome = updated;
    else nextPages[key] = updated;
  }

  if (changed.length === 0) return [];

  const update: Record<string, unknown> = {
    bespoke_pages: nextPages,
    last_edited_at: new Date().toISOString(),
  };
  if (nextHome) update.bespoke_homepage_html = nextHome;

  await admin.from("artifacts").update(update).eq("lead_id", leadId);

  // History is recorded per page so a restore brings back that page's exact
  // prior markup, including whichever image it was pointing at.
  await Promise.all(
    changed.map((key) =>
      recordVersion(leadId, key, key === HOME_KEY ? nextHome! : nextPages[key], "edited", note)
    )
  );

  // Keep the plan in step, so the Studio and any later generation agree on
  // which image occupies this slot.
  const { data: artifact } = await admin
    .from("artifacts")
    .select("media_plan")
    .eq("lead_id", leadId)
    .single<{ media_plan: MediaPlan | null }>();

  if (artifact?.media_plan) {
    const nextPlan = artifact.media_plan.map((entry) =>
      entry.url === oldUrl ? { ...entry, url: newUrl } : entry
    );
    await admin.from("artifacts").update({ media_plan: nextPlan }).eq("lead_id", leadId);
  }

  return changed;
}

/**
 * Point one slot at a new image by its data-slot attribute.
 *
 * repointSlot below matches on the old URL, which is right for the case it was
 * written for — retouching an image the operator can see — but wrong whenever
 * two slots happen to share a photograph, because swapping one silently swaps
 * both. Generated pages now carry data-slot on every <img>, so the exact
 * element can be addressed instead of guessed at.
 *
 * Falls back to the URL match for pages built before the attribute existed,
 * so a delivered site does not lose the ability to have its photos changed.
 */
export async function applyMedia(
  leadId: string,
  slotKey: string,
  newUrl: string,
  note: string,
  fallbackOldUrl?: string
): Promise<string[]> {
  const admin = createAdminClient();
  const pages = await loadAllPages(leadId);
  const changed: string[] = [];
  const nextPages: Record<string, string> = {};
  let nextHome: string | null = null;

  // Match the whole <img> that carries this slot, then rewrite src inside it.
  // Attribute order varies, so the tag is located first and edited second.
  const tagPattern = new RegExp(`<img\\b[^>]*\\bdata-slot=["']${slotKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`, "gi");

  for (const [key, html] of Object.entries(pages)) {
    let updated = html.replace(tagPattern, (tag) =>
      /\bsrc=/.test(tag) ? tag.replace(/\bsrc=(["'])[^"']*\1/i, `src="${newUrl}"`) : tag.replace(/^<img/i, `<img src="${newUrl}"`)
    );

    if (updated === html && fallbackOldUrl && html.includes(fallbackOldUrl)) {
      updated = html.split(fallbackOldUrl).join(newUrl);
    }

    if (updated === html) {
      if (key !== HOME_KEY) nextPages[key] = html;
      continue;
    }
    changed.push(key);
    if (key === HOME_KEY) nextHome = updated;
    else nextPages[key] = updated;
  }

  if (!changed.length) return [];

  const update: Record<string, unknown> = { bespoke_pages: nextPages, last_edited_at: new Date().toISOString() };
  if (nextHome) update.bespoke_homepage_html = nextHome;
  await admin.from("artifacts").update(update).eq("lead_id", leadId);

  await Promise.all(
    changed.map((key) => recordVersion(leadId, key, key === HOME_KEY ? nextHome! : nextPages[key], "edited", note))
  );

  const { data: artifact } = await admin
    .from("artifacts")
    .select("media_plan")
    .eq("lead_id", leadId)
    .single<{ media_plan: MediaPlan | null }>();

  if (artifact?.media_plan) {
    const nextPlan = artifact.media_plan.map((entry) => (entry.slot === slotKey ? { ...entry, url: newUrl } : entry));
    await admin.from("artifacts").update({ media_plan: nextPlan }).eq("lead_id", leadId);
  }

  return changed;
}

/** Replace a slot with a real photograph the operator supplies. */
export async function uploadToSlot(
  leadId: string,
  slotKey: string,
  file: Buffer,
  caption: string
): Promise<{ url: string; pagesUpdated: string[] } | null> {
  const admin = createAdminClient();
  const { data: artifact } = await admin
    .from("artifacts")
    .select("media_plan")
    .eq("lead_id", leadId)
    .single<{ media_plan: MediaPlan | null }>();

  const entry = artifact?.media_plan?.find((e) => e.slot === slotKey);
  if (!entry) return null;

  const stored = await mirrorToStorage(leadId, `upload:${slotKey}`, "upload", {
    slotHint: slotKey,
    buffer: file,
  });
  if (!stored) return null;

  await admin
    .from("media_assets")
    .update({ caption: caption || entry.caption, subject: "work", usable: true })
    .eq("id", stored.id);

  const pagesUpdated = await repointSlot(leadId, entry.url, stored.publicUrl, `Real photo added to ${slotKey}`);
  return { url: stored.publicUrl, pagesUpdated };
}

/** Regenerate a slot's image from a fresh prompt, for slots with no real photo. */
export async function regenerateSlot(
  leadId: string,
  slotKey: string,
  subject: string,
  mood: string
): Promise<{ url: string; pagesUpdated: string[] } | null> {
  const admin = createAdminClient();
  const { data: artifact } = await admin
    .from("artifacts")
    .select("media_plan")
    .eq("lead_id", leadId)
    .single<{ media_plan: MediaPlan | null }>();

  const entry = artifact?.media_plan?.find((e) => e.slot === slotKey);
  if (!entry) return null;

  const image = await generateSiteImage(leadId, {
    subject,
    shape: slotKey === "hero" ? "landscape" : "landscape",
    mood,
    slotHint: slotKey,
  });
  if (!image) return null;

  const pagesUpdated = await repointSlot(leadId, entry.url, image.publicUrl, `Regenerated ${slotKey}`);
  return { url: image.publicUrl, pagesUpdated };
}
