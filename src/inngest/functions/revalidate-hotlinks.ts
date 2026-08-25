import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { isHotlinkSafe } from "@/lib/scrape/check-hotlink-safety";
import type { MediaAsset } from "@/types/database";

// v4 Phase N4 — a client's own site can go down or reorganize after
// redesign, and a hotlinked image silently breaking on a sold, delivered
// site is a real regression risk the storage savings shouldn't introduce.
// Weekly sweep of every hotlinked media_assets row: re-check, and for
// anything now broken, download it into Storage (same copy-to-storage
// path photo-waterfall.ts already uses) and flip storage_mode to 'copied'
// — self-healing, not just a health report.
export const revalidateHotlinks = inngest.createFunction(
  { id: "revalidate-hotlinks" },
  { cron: "0 3 * * 1" }, // every Monday 03:00 UTC
  async ({ step }) => {
    const admin = createAdminClient();

    const hotlinked = await step.run("load-hotlinked-assets", async () => {
      const { data } = await admin.from("media_assets").select("*").eq("storage_mode", "hotlink");
      return (data ?? []) as MediaAsset[];
    });

    let repaired = 0;
    for (const asset of hotlinked) {
      const stillSafe = await step.run(`check-${asset.id}`, () => isHotlinkSafe(asset.public_url));
      if (stillSafe) continue;

      const repairedUrl = await step.run(`repair-${asset.id}`, async () => {
        try {
          const res = await fetch(asset.public_url);
          if (!res.ok) return null;
          const contentType = res.headers.get("content-type") || "image/jpeg";
          const ext = contentType.split("/")[1]?.split(";")[0]?.split("+")[0] || "jpg";
          const buffer = Buffer.from(await res.arrayBuffer());
          const path = `${asset.lead_id}/${asset.source}/${asset.slot_hint ?? "repaired"}-${Date.now()}.${ext}`;
          const { error: uploadError } = await admin.storage
            .from("lead-media")
            .upload(path, buffer, { contentType, cacheControl: "31536000", upsert: false });
          if (uploadError) throw uploadError;
          const { data } = admin.storage.from("lead-media").getPublicUrl(path);
          return { path, publicUrl: data.publicUrl };
        } catch (err) {
          console.error("[revalidate-hotlinks] repair failed for", asset.id, err);
          return null;
        }
      });

      if (!repairedUrl) continue;

      await step.run(`save-${asset.id}`, async () => {
        await admin
          .from("media_assets")
          .update({ public_url: repairedUrl.publicUrl, storage_path: repairedUrl.path, storage_mode: "copied" })
          .eq("id", asset.id);
      });
      repaired++;
    }

    return { checked: hotlinked.length, repaired };
  }
);
