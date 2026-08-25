import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Recursively lists all file paths under a prefix in a bucket.
 */
async function listAllFiles(admin: SupabaseClient, bucket: string, prefix = ""): Promise<string[]> {
  try {
    const { data: list, error } = await admin.storage.from(bucket).list(prefix, { limit: 100 });
    if (error || !list) return [];

    const filePaths: string[] = [];
    for (const item of list) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      // If item is a folder (id is null or metadata is null)
      if (!item.id || item.metadata === null) {
        const subFiles = await listAllFiles(admin, bucket, fullPath);
        filePaths.push(...subFiles);
      } else {
        filePaths.push(fullPath);
      }
    }
    return filePaths;
  } catch (err) {
    console.warn(`[cleanup-storage] list failed for ${bucket}/${prefix}`, err);
    return [];
  }
}

/**
 * Removes all files and assets belonging to one or more leads from Supabase Storage.
 */
export async function cleanupLeadStorage(admin: SupabaseClient, leadIds: string[]): Promise<number> {
  if (leadIds.length === 0) return 0;
  let totalDeleted = 0;

  try {
    // 1. Collect recorded media_assets paths
    const { data: mediaRows } = await admin
      .from("media_assets")
      .select("storage_path")
      .in("lead_id", leadIds);

    const explicitPaths = (mediaRows ?? [])
      .map((r) => r.storage_path)
      .filter((p): p is string => Boolean(p));

    // 2. Discover all folder files under each leadId
    const folderFiles: string[] = [];
    for (const id of leadIds) {
      const filesInLeadMedia = await listAllFiles(admin, "lead-media", id);
      const filesInVisualQa = await listAllFiles(admin, "visual-qa", id);
      folderFiles.push(...filesInLeadMedia);

      if (filesInVisualQa.length > 0) {
        await admin.storage.from("visual-qa").remove(filesInVisualQa);
        totalDeleted += filesInVisualQa.length;
      }
    }

    const allLeadMediaPaths = Array.from(new Set([...explicitPaths, ...folderFiles]));
    if (allLeadMediaPaths.length > 0) {
      // Supabase remove accepts up to 100 paths per request
      for (let i = 0; i < allLeadMediaPaths.length; i += 100) {
        const batch = allLeadMediaPaths.slice(i, i + 100);
        await admin.storage.from("lead-media").remove(batch);
        totalDeleted += batch.length;
      }
    }
  } catch (err) {
    console.error("[cleanup-storage] error cleaning lead storage", err);
  }

  return totalDeleted;
}

/**
 * Sweeps all storage buckets and removes folders of leads that no longer exist in the DB.
 */
export async function sweepOrphanedStorage(admin: SupabaseClient): Promise<{ deletedLeadMedia: number; deletedVisualQa: number }> {
  const { data: leads } = await admin.from("leads").select("id");
  const activeLeadIds = new Set((leads ?? []).map((l) => l.id));

  let deletedLeadMedia = 0;
  let deletedVisualQa = 0;

  try {
    // Check lead-media root items
    const { data: rootMedia } = await admin.storage.from("lead-media").list("", { limit: 1000 });
    const orphanMediaPaths: string[] = [];

    for (const item of rootMedia ?? []) {
      // Check if folder is a UUID that does not exist in DB
      if ((!item.id || item.metadata === null) && !activeLeadIds.has(item.name)) {
        const files = await listAllFiles(admin, "lead-media", item.name);
        orphanMediaPaths.push(...files);
      }
    }

    if (orphanMediaPaths.length > 0) {
      for (let i = 0; i < orphanMediaPaths.length; i += 100) {
        const batch = orphanMediaPaths.slice(i, i + 100);
        await admin.storage.from("lead-media").remove(batch);
        deletedLeadMedia += batch.length;
      }
    }

    // Check visual-qa root items
    const { data: rootQa } = await admin.storage.from("visual-qa").list("", { limit: 1000 });
    const orphanQaPaths: string[] = [];

    for (const item of rootQa ?? []) {
      if ((!item.id || item.metadata === null) && !activeLeadIds.has(item.name)) {
        const files = await listAllFiles(admin, "visual-qa", item.name);
        orphanQaPaths.push(...files);
      }
    }

    if (orphanQaPaths.length > 0) {
      for (let i = 0; i < orphanQaPaths.length; i += 100) {
        const batch = orphanQaPaths.slice(i, i + 100);
        await admin.storage.from("visual-qa").remove(batch);
        deletedVisualQa += batch.length;
      }
    }
  } catch (err) {
    console.error("[cleanup-storage] sweep error", err);
  }

  return { deletedLeadMedia, deletedVisualQa };
}
