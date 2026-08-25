// One-off helper for sourcing new design-reference screenshots.
// Usage: npx tsx scripts/screenshot-site.ts <url> <output-png-path>
import { chromium } from "playwright";

async function main() {
  const [url, outPath] = process.argv.slice(2);
  if (!url || !outPath) {
    console.error("Usage: npx tsx scripts/screenshot-site.ts <url> <output-png-path>");
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(url.startsWith("http") ? url : `https://${url}`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: outPath, fullPage: true, timeout: 30000 });
    console.log(`saved ${outPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
