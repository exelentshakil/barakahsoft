// Make every image in a subtree safe to rasterise, then put it back.
//
// html-to-image has to read each image's bytes to draw it. A remote host that
// does not send CORS headers — img1.wsimg.com and most stock CDNs — blocks
// that read, and the capture fails. Being on the same domain as the page does
// not help: it is the IMAGES that are cross-origin, not the document.
//
// So every image is fetched through our own proxy, which does the request
// server-side where CORS does not apply, and swapped for a data URI. The
// originals are restored afterwards, because the live page must keep its real
// URLs — leaving multi-megabyte data URIs in the DOM would wreck it.

export interface InlineResult {
  /** How many images were successfully inlined. */
  inlined: number;
  /** Sources that could not be fetched even through the proxy. */
  failed: string[];
  /** Put the original srcs back. Always call this, including on failure. */
  restore: () => void;
}

async function proxyToDataUri(url: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
    if (!response.ok) return null;
    const data = (await response.json()) as { dataUri?: string };
    return typeof data.dataUri === "string" && data.dataUri.startsWith("data:") ? data.dataUri : null;
  } catch {
    return null;
  }
}

export async function inlineImagesForCapture(root: HTMLElement | Document): Promise<InlineResult> {
  const images = Array.from(root.querySelectorAll("img"));
  const originals = new Map<HTMLImageElement, string>();
  const failed: string[] = [];
  let inlined = 0;

  await Promise.all(
    images.map(async (image) => {
      const src = image.currentSrc || image.src;
      if (!src || src.startsWith("data:")) return;

      const dataUri = await proxyToDataUri(src);
      if (!dataUri) {
        failed.push(src);
        return;
      }

      originals.set(image, image.getAttribute("src") ?? src);
      // srcset would otherwise win over the src we just set.
      image.removeAttribute("srcset");
      image.removeAttribute("sizes");
      image.src = dataUri;
      inlined++;

      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
          setTimeout(resolve, 5000);
        });
      }
    })
  );

  return {
    inlined,
    failed,
    restore: () => {
      for (const [image, src] of originals) image.src = src;
    },
  };
}
