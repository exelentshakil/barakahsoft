import * as cheerio from "cheerio";

// fetch_site_html atom — fetches the homepage, then follows same-origin
// internal links to build a small page inventory (capped) so the rest of
// the scrape can see every page, not just the homepage, per plan §7's
// "every page, not just home" requirement.
export interface FetchedPage {
  url: string;
  html: string;
}

const MAX_PAGES = 15;
const USER_AGENT = "BarakahSoftBot/1.0 (+https://barakahsoft.com/bot)";

async function fetchOne(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;
    return await res.text();
  } catch (err) {
    console.error("[scrape] fetch failed for", url, err);
    return null;
  }
}

function isInternalLink(href: string, origin: string): boolean {
  try {
    const resolved = new URL(href, origin);
    return resolved.origin === origin && !resolved.pathname.match(/\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|doc|docx)$/i);
  } catch {
    return false;
  }
}

export async function fetchSiteHtml(rootUrl: string, maxPages = MAX_PAGES): Promise<FetchedPage[]> {
  const origin = new URL(rootUrl).origin;
  const visited = new Set<string>();
  const pages: FetchedPage[] = [];
  const queue: string[] = [rootUrl];

  while (queue.length > 0 && pages.length < maxPages) {
    const url = queue.shift()!;
    const normalized = url.split("#")[0].replace(/\/$/, "");
    if (visited.has(normalized)) continue;
    visited.add(normalized);

    const html = await fetchOne(url);
    if (!html) continue;
    pages.push({ url, html });

    const $ = cheerio.load(html);
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      if (isInternalLink(href, origin)) {
        const resolved = new URL(href, origin).toString().split("#")[0].replace(/\/$/, "");
        if (!visited.has(resolved) && !queue.includes(resolved)) queue.push(resolved);
      }
    });
  }

  return pages;
}
