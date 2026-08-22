export interface FirecrawlBranding {
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
  };
  images?: {
    logo?: string;
    favicon?: string;
    ogImage?: string;
  };
  typography?: {
    fontFamilies?: {
      primary?: string;
      secondary?: string;
    };
  };
}

export interface FirecrawlResult {
  markdown?: string;
  branding?: FirecrawlBranding;
  title?: string;
  description?: string;
  ogImage?: string;
}

export async function scrapeWithFirecrawl(url: string): Promise<FirecrawlResult | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;

  try {
    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: cleanUrl,
        formats: ["markdown", "branding"],
      }),
    });

    if (!response.ok) {
      console.error("[firecrawl] API response status:", response.status);
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
