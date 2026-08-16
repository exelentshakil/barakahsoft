// check_hotlink_safety atom — decides whether a real source URL (the
// client's own site photo/video, or an Unsplash/Pexels CDN URL) can be
// linked to directly from the delivered site instead of being downloaded
// and copied into Supabase Storage. A HEAD request first (cheap), falling
// back to a ranged GET for servers that reject HEAD — no browser Referer
// sent, since that's exactly what hotlink-protection checks against.
// Treated as unsafe on any non-2xx status, a mismatched content-type, or a
// network error — callers fall back to the existing copy-to-storage path.
export async function isHotlinkSafe(url: string, contentTypePrefix: "image/" | "video/" = "image/"): Promise<boolean> {
  try {
    const headRes = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (headRes.ok) {
      const contentType = headRes.headers.get("content-type") || "";
      return contentType.startsWith(contentTypePrefix);
    }
    // Some origins 403/405 a bare HEAD but still serve a real GET — verify
    // with a ranged request so we don't download the whole file just to check.
    if (headRes.status === 403 || headRes.status === 405) {
      const getRes = await fetch(url, { method: "GET", headers: { Range: "bytes=0-1023" }, redirect: "follow" });
      if (!getRes.ok) return false;
      const contentType = getRes.headers.get("content-type") || "";
      return contentType.startsWith(contentTypePrefix);
    }
    return false;
  } catch (err) {
    console.error("[check-hotlink-safety] failed for", url, err);
    return false;
  }
}
