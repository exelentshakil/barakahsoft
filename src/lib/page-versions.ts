import { createAdminClient } from "@/lib/supabase/admin";
import { updateArtifact } from "@/lib/artifact-write";
import type { Artifact } from "@/types/database";

// Page version history and restore.
//
// artifacts.bespoke_homepage_html / bespoke_pages stay the live content, so
// nothing about rendering changes. This module is the safety net that makes
// the refine loop usable: every write keeps the version it replaced, and
// restoring is a copy back.
//
// Without this, iterating destroys the previous attempt, so the rational
// move is not to iterate -- which is the opposite of what the workflow
// needs, since the generator's output is explicitly a first draft.

export type VersionSource = "generated" | "regenerated" | "edited" | "claude-code";

export interface PageVersion {
  id: string;
  page_key: string;
  version: number;
  source: VersionSource;
  note: string | null;
  created_at: string;
}

/** Keeps history useful without letting it grow unbounded per lead. */
const KEEP_VERSIONS = 6;

export const HOME_KEY = "home";

/** Human label for a page key, for the Studio's slot and version lists. */
export function pageLabel(pageKey: string, serviceNames: Record<string, string> = {}): string {
  if (pageKey === HOME_KEY) return "Homepage";
  if (pageKey === "about") return "About";
  if (pageKey === "faq") return "FAQ";
  if (pageKey === "contact") return "Contact";
  if (pageKey === "blog") return "Advice index";
  if (pageKey.startsWith("services/")) {
    const slug = pageKey.slice("services/".length);
    return serviceNames[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (pageKey.startsWith("areas/")) return `Area · ${pageKey.slice("areas/".length).replace(/-/g, " ")}`;
  if (pageKey.startsWith("locations/")) return `Local · ${pageKey.slice("locations/".length).replace(/-/g, " ")}`;
  if (pageKey.startsWith("blog/")) return `Article · ${pageKey.slice("blog/".length).replace(/-/g, " ")}`;
  return pageKey;
}

/**
 * Record a new version of a page.
 *
 * Called on every write — generation, regeneration, a Studio edit, or a
 * Claude Code injection — so history is complete rather than depending on
 * anyone remembering to snapshot first.
 */
export async function recordVersion(
  leadId: string,
  pageKey: string,
  html: string,
  source: VersionSource,
  note?: string,
  assets?: { css: string; sections: Artifact["bespoke_sections"] }
): Promise<number> {
  const admin = createAdminClient();

  const { data: latest } = await admin
    .from("page_versions")
    .select("version")
    .eq("lead_id", leadId)
    .eq("page_key", pageKey)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<{ version: number }>();

  const version = (latest?.version ?? 0) + 1;

  await admin.from("page_versions").insert({
    lead_id: leadId,
    page_key: pageKey,
    version,
    html,
    source,
    note: note ?? null,
    ...(assets ? { bespoke_css: assets.css, bespoke_sections: assets.sections } : {}),
  });

  // Trim the tail. Six is enough to undo a bad afternoon and short enough
  // that the restore list stays scannable.
  if (version > KEEP_VERSIONS) {
    await admin
      .from("page_versions")
      .delete()
      .eq("lead_id", leadId)
      .eq("page_key", pageKey)
      .lte("version", version - KEEP_VERSIONS);
  }

  return version;
}

/** Version history for a lead, newest first, without the markup payloads. */
export async function listVersions(leadId: string): Promise<Record<string, PageVersion[]>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("page_versions")
    .select("id, page_key, version, source, note, created_at")
    .eq("lead_id", leadId)
    .order("version", { ascending: false })
    .returns<PageVersion[]>();

  const grouped: Record<string, PageVersion[]> = {};
  for (const row of data ?? []) {
    (grouped[row.page_key] ??= []).push(row);
  }
  return grouped;
}

/**
 * Write a page into the live artifact.
 *
 * The single place that mutates live page content, so recording history can
 * never be skipped by a new call site.
 */
export async function writeLivePage(
  leadId: string,
  pageKey: string,
  html: string,
  source: VersionSource,
  note?: string,
  assets?: { css: string; sections: Artifact["bespoke_sections"] }
): Promise<number> {
  const admin = createAdminClient();

  if (pageKey === HOME_KEY) {
    await updateArtifact(
      leadId,
      {
        bespoke_homepage_html: html,
        ...(assets ? { bespoke_css: assets.css, bespoke_sections: assets.sections } : {}),
        last_edited_at: new Date().toISOString(),
      },
      `writeLivePage:${pageKey}`
    );
  } else {
    const { data: current } = await admin
      .from("artifacts")
      .select("bespoke_pages")
      .eq("lead_id", leadId)
      .single<{ bespoke_pages: Record<string, string> }>();

    await updateArtifact(
      leadId,
      {
        bespoke_pages: { ...(current?.bespoke_pages ?? {}), [pageKey]: html },
        last_edited_at: new Date().toISOString(),
      },
      `writeLivePage:${pageKey}`
    );
  }

  return recordVersion(leadId, pageKey, html, source, note, assets);
}

/** Copy a stored version back into the live artifact. */
export async function restoreVersion(leadId: string, pageKey: string, version: number): Promise<boolean> {
  const admin = createAdminClient();

  const { data: target } = await admin
    .from("page_versions")
    .select("html, bespoke_css, bespoke_sections")
    .eq("lead_id", leadId)
    .eq("page_key", pageKey)
    .eq("version", version)
    .maybeSingle<{ html: string; bespoke_css: string | null; bespoke_sections: Artifact["bespoke_sections"] | null }>();

  if (!target) return false;

  // Restoring is itself a change worth keeping, so the version it replaced
  // does not vanish when someone restores and then changes their mind.
  const assets = pageKey === HOME_KEY && target.bespoke_css && target.bespoke_sections
    ? { css: target.bespoke_css, sections: target.bespoke_sections }
    : undefined;
  await writeLivePage(leadId, pageKey, target.html, "edited", `Restored v${version}`, assets);
  return true;
}
