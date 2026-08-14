// screenshot_page atom. Uses a hosted screenshot API (screenshotone.com-
// compatible URL scheme) rather than Playwright/Puppeteer — Vercel's
// serverless functions don't reliably run a headless browser without extra
// config, and a hosted API is a single fetch. Swap SCREENSHOT_API_KEY /
// this URL builder if a different provider is preferred; the rest of the
// pipeline only depends on getting a public image URL back.
export async function screenshotPage(url: string, viewport: "mobile" | "desktop" = "mobile"): Promise<string | null> {
  const apiKey = process.env.SCREENSHOT_API_KEY;
  if (!apiKey) {
    console.error("[screenshot] SCREENSHOT_API_KEY is not set");
    return null;
  }

  const width = viewport === "mobile" ? 390 : 1440;
  const height = viewport === "mobile" ? 844 : 900;

  try {
    const screenshotUrl = `https://api.screenshotone.com/take?access_key=${apiKey}&url=${encodeURIComponent(
      url
    )}&viewport_width=${width}&viewport_height=${height}&device_scale_factor=2&format=jpg&full_page=true&block_cookie_banners=true`;

    const res = await fetch(screenshotUrl);
    if (!res.ok) throw new Error(`Screenshot API ${res.status}`);
    return screenshotUrl;
  } catch (err) {
    console.error("[screenshot] failed for", url, err);
    return null;
  }
}
