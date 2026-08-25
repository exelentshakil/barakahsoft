import { createAdminClient } from "@/lib/supabase/admin";

// Capturing the two images a before/after showcase needs.
//
// "Before" is the client's own existing site, which we do not control and
// which almost always sets X-Frame-Options or a frame-ancestors CSP — so it
// cannot be iframed on our landing page the way our rebuild can. It has to
// be an image. Once "before" is an image, "after" must be one too, or the
// slider is comparing two things rendered by different engines at different
// widths and the comparison stops being honest.
//
// Firecrawl does the actual browser work. This codebase already depends on
// it for scraping (see src/lib/scrape/firecrawl.ts), it runs the browser
// remotely, and the deployed app is serverless — Playwright is not an
// option in that runtime, which is exactly why visual QA runs on a separate
// local worker instead.
//
// Both captures are viewport-sized, not full-page. A full-page shot of a
// long homepage produces a 1440x9000 sliver that is unreadable in a slider
// and enormous to serve; the hero is what the comparison is actually about.

const VIEWPORT = { width: 1440, height: 900 };

/** Firecrawl returns a URL to the image it captured, not the bytes. */
async function captureViaFirecrawl(url: string): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;

  const target = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        url: target,
        formats: ["screenshot"],
        onlyMainContent: false,
        waitFor: 3000,
        timeout: 45000,
        ...VIEWPORT,
      }),
    });

    if (!response.ok) {
      console.error("[showcase] firecrawl screenshot returned", response.status, "for", target);
      return null;
    }

    const data = await response.json();
    const result = data.data || data;
    const shot = result.screenshot;
    return typeof shot === "string" && shot.length > 0 ? shot : null;
  } catch (err) {
    console.error("[showcase] firecrawl screenshot failed for", target, err);
    return null;
  }
}

/**
 * Copy a captured image into our own Storage.
 *
 * Firecrawl's URLs expire, so linking them directly from the landing page
 * would give us a showcase that silently turns into broken images days after
 * it was approved.
 */
async function persist(sourceImageUrl: string, destPath: string): Promise<string | null> {
  try {
    const res = await fetch(sourceImageUrl);
    if (!res.ok) {
      console.error("[showcase] could not download capture", res.status);
      return null;
    }

    const contentType = res.headers.get("content-type") ?? "image/png";
    const buffer = Buffer.from(await res.arrayBuffer());

    const admin = createAdminClient();
    const { error } = await admin.storage.from("showcase").upload(destPath, buffer, {
      contentType,
      upsert: true,
    });
    if (error) {
      console.error("[showcase] upload failed", error.message);
      return null;
    }

    const { data } = admin.storage.from("showcase").getPublicUrl(destPath);
    // Storage serves the same path forever, so a re-approval that replaces
    // the image would otherwise keep showing the cached old one.
    return `${data.publicUrl}?v=${Date.now()}`;
  } catch (err) {
    console.error("[showcase] persist failed", err);
    return null;
  }
}

export interface CapturedPair {
  beforeUrl: string | null;
  afterUrl: string | null;
  /** Human-readable reason a side is null, for showing the operator. */
  problems: string[];
}

/**
 * Capture both sides of one lead's showcase.
 *
 * Returns partial results rather than throwing: a missing "before" (the
 * client's old site is down, or blocks automated browsers) should not stop
 * the operator from approving with a manually supplied image.
 */
export async function captureShowcasePair(
  leadId: string,
  originalSiteUrl: string,
  rebuildUrl: string
): Promise<CapturedPair> {
  const problems: string[] = [];

  if (!process.env.FIRECRAWL_API_KEY) {
    return {
      beforeUrl: null,
      afterUrl: null,
      problems: ["FIRECRAWL_API_KEY is not set, so screenshots cannot be captured automatically. Paste image URLs manually instead."],
    };
  }

  const [beforeShot, afterShot] = await Promise.all([
    captureViaFirecrawl(originalSiteUrl),
    captureViaFirecrawl(rebuildUrl),
  ]);

  if (!beforeShot) problems.push(`Could not screenshot the current site (${originalSiteUrl}).`);
  if (!afterShot) problems.push(`Could not screenshot the rebuild (${rebuildUrl}).`);

  const [beforeUrl, afterUrl] = await Promise.all([
    beforeShot ? persist(beforeShot, `${leadId}/before.png`) : Promise.resolve(null),
    afterShot ? persist(afterShot, `${leadId}/after.png`) : Promise.resolve(null),
  ]);

  if (beforeShot && !beforeUrl) problems.push("Captured the current site but could not store the image.");
  if (afterShot && !afterUrl) problems.push("Captured the rebuild but could not store the image.");

  return { beforeUrl, afterUrl, problems };
}
