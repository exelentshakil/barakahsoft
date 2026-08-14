import * as cheerio from "cheerio";
import type { FetchedPage } from "@/lib/scrape/fetch-site";

// Existing JSON-LD on the target site — kept as a fact (e.g. it may already
// state hours, NAP, or a LocalBusiness subtype worth matching), never
// copied verbatim into the generated site's own schema.
export function extractExistingSchema(page: FetchedPage): Record<string, unknown>[] {
  const $ = cheerio.load(page.html);
  const schemas: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text());
      const entries = Array.isArray(json) ? json : [json];
      schemas.push(...entries);
    } catch {
      // malformed JSON-LD on the target site — skip
    }
  });
  return schemas;
}
