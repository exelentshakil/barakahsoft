export interface FirecrawlBranding {
  colorScheme?: "light" | "dark" | string;
  logo?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    textPrimary?: string;
    textSecondary?: string;
    link?: string;
    success?: string;
    warning?: string;
    error?: string;
    [key: string]: string | undefined;
  };
  fonts?: Array<{
    family: string;
    [key: string]: unknown;
  }>;
  typography?: {
    fontFamilies?: {
      primary?: string;
      heading?: string;
      code?: string;
      secondary?: string;
      [key: string]: string | undefined;
    };
    fontSizes?: {
      h1?: string;
      h2?: string;
      h3?: string;
      body?: string;
      [key: string]: string | undefined;
    };
    fontWeights?: {
      regular?: number;
      medium?: number;
      bold?: number;
      [key: string]: number | undefined;
    };
    lineHeights?: Record<string, string>;
  };
  spacing?: {
    baseUnit?: number;
    borderRadius?: string;
    padding?: string;
    margins?: string;
    [key: string]: unknown;
  };
  components?: {
    buttonPrimary?: {
      background?: string;
      textColor?: string;
      borderRadius?: string;
      [key: string]: unknown;
    };
    buttonSecondary?: {
      background?: string;
      textColor?: string;
      borderColor?: string;
      borderRadius?: string;
      [key: string]: unknown;
    };
    input?: Record<string, unknown>;
    icons?: Record<string, unknown>;
  };
  images?: {
    logo?: string;
    favicon?: string;
    ogImage?: string;
    [key: string]: string | undefined;
  };
  animations?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  personality?: {
    tone?: string;
    energy?: string;
    targetAudience?: string;
    [key: string]: string | undefined;
  };
}

export interface FirecrawlResult {
  markdown?: string;
  branding?: FirecrawlBranding;
  title?: string;
  description?: string;
  ogImage?: string;
}

export interface CrawledPage {
  url: string;
  html: string;
  markdown: string;
  title: string | null;
  description: string | null;
}

function normaliseUrl(url: string): string {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Single page, for design-DNA extraction where one page is the whole job. */
export async function scrapeWithFirecrawl(url: string): Promise<FirecrawlResult | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: normaliseUrl(url),
        formats: ["markdown", "branding"],
      }),
    });

    if (!response.ok) {
      console.error("[firecrawl] scrape returned", response.status);
      return null;
    }

    const data = await response.json();
    const result = data.data || data;

    return {
      markdown: result.markdown || "",
      branding: result.branding || {},
      title: result.metadata?.title || "",
      description: result.metadata?.description || "",
      ogImage: result.metadata?.ogImage || "",
    };
  } catch (err) {
    console.error("[firecrawl] error scraping url:", err);
    return null;
  }
}

/**
 * List every URL on a site.
 *
 * One credit, and it returns the whole URL structure — which carries most of
 * what the brief needs. A path like /services/panel-upgrades names a real
 * service as reliably as crawling that page would, at a thirtieth of the
 * cost. Crawling stays available for leads worth the spend, but it stops
 * being what every lead pays by default.
 */
export async function mapWithFirecrawl(url: string, limit = 200): Promise<string[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ url: normaliseUrl(url), limit, includeSubdomains: false }),
    });

    if (!res.ok) {
      console.error("[firecrawl] map returned", res.status);
      return [];
    }

    const data = await res.json();
    const links = (data.links ?? data.data ?? []) as (string | { url?: string })[];
    return links
      .map((entry) => (typeof entry === "string" ? entry : entry.url ?? ""))
      .filter((u) => /^https?:\/\//i.test(u));
  } catch (err) {
    console.error("[firecrawl] map error:", err);
    return [];
  }
}

/**
 * Crawl a whole site.
 *
 * This replaced a plain fetch-and-parse pass over raw HTML, which was the
 * single biggest cause of thin generated sites. Most small business sites
 * render their navigation and service content client-side, so raw HTML
 * contains an empty shell: the York lead came back with ONE page and ZERO
 * nav links, which meant no services could be derived, which meant the
 * brief was empty and the generated page had nothing real to say.
 *
 * Firecrawl executes JavaScript, so what comes back is what a visitor
 * actually sees. Crawling is also the right use of the page budget — the
 * difference between one shell page and thirty real ones is the difference
 * between guessing at a business and knowing it.
 */
export async function crawlWithFirecrawl(
  url: string,
  options: { limit?: number; timeoutMs?: number } = {}
): Promise<CrawledPage[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return [];

  const limit = options.limit ?? 30;
  const timeoutMs = options.timeoutMs ?? 120_000;

  try {
    const start = await fetch("https://api.firecrawl.dev/v1/crawl", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        url: normaliseUrl(url),
        limit,
        // Blogs and paginated archives burn the page budget without adding
        // anything the brief needs; service and location pages are the point.
        excludePaths: ["^/wp-admin", "^/cart", "^/checkout", "^/my-account", "\\?", "/tag/", "/author/"],
        scrapeOptions: {
          formats: ["markdown", "html"],
          onlyMainContent: false,
        },
      }),
    });

    if (!start.ok) {
      console.error("[firecrawl] crawl start returned", start.status, (await start.text().catch(() => "")).slice(0, 200));
      return [];
    }

    const { id } = await start.json();
    if (!id) return [];

    // Poll rather than webhook: this runs inside an Inngest step that owns
    // its own duration budget, and a webhook would need a public callback
    // for something only this step cares about.
    const deadline = Date.now() + timeoutMs;
    let delay = 2000;

    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.4, 10_000);

      const statusRes = await fetch(`https://api.firecrawl.dev/v1/crawl/${id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!statusRes.ok) continue;

      const status = await statusRes.json();

      if (status.status === "completed" || (status.status === "scraping" && Date.now() > deadline - 15_000)) {
        return mapPages(status.data ?? []);
      }
      if (status.status === "failed") {
        console.error("[firecrawl] crawl failed for", url);
        return [];
      }
    }

    // Timed out mid-crawl. Whatever completed is still worth far more than
    // nothing, so make one last attempt to collect it.
    const finalRes = await fetch(`https://api.firecrawl.dev/v1/crawl/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (finalRes.ok) {
      const status = await finalRes.json();
      return mapPages(status.data ?? []);
    }
    return [];
  } catch (err) {
    console.error("[firecrawl] crawl error:", err);
    return [];
  }
}

function mapPages(data: unknown[]): CrawledPage[] {
  return (data as Record<string, never>[])
    .map((entry) => {
      const metadata = (entry.metadata ?? {}) as Record<string, string | undefined>;
      const url = metadata.sourceURL || metadata.url || "";
      return {
        url,
        html: (entry.html as string | undefined) ?? "",
        markdown: (entry.markdown as string | undefined) ?? "",
        title: metadata.title ?? null,
        description: metadata.description ?? null,
      };
    })
    .filter((page) => page.url && (page.html || page.markdown));
}


export interface SearchHit {
  url: string;
  title: string;
  description: string;
}

/**
 * Web search, used to find the best-designed sites in a trade.
 *
 * This is what turns the design direction from a preset into research. It
 * runs once per NEW industry — the winner is cached to the reference library
 * and every later lead in that trade reuses it for nothing — so the cost is
 * a handful of pages amortised across every future lead in that market.
 */
export async function searchWithFirecrawl(query: string, limit = 6): Promise<SearchHit[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ query, limit }),
    });

    if (!res.ok) {
      console.error("[firecrawl] search returned", res.status);
      return [];
    }

    const data = await res.json();
    return ((data.data ?? []) as Record<string, string>[])
      .map((hit) => ({
        url: hit.url ?? "",
        title: hit.title ?? "",
        description: hit.description ?? "",
      }))
      .filter((hit) => /^https?:\/\//i.test(hit.url));
  } catch (err) {
    console.error("[firecrawl] search error:", err);
    return [];
  }
}
