import { callOpenAI } from "@/lib/openai-client";
import { parseJsonResponse } from "@/lib/parse-json-response";

// Reading what a business actually is, from what was scraped.
//
// Nothing did this, and two things downstream depended on it. Design
// research needs a trade to search for, and with a null industry it fell
// straight through to the house default — so a lead got the generic
// direction rather than a researched one, silently. Visibility measurement
// needs a city, and without one it cannot run at all.
//
// The business name mattered too: it was taken from the page title, which on
// most small business sites is a tagline. The first lead through this came
// out named "Take the BUSY Out of BUSYness", and that string would have gone
// on the rebuilt homepage and into the delivery email as the company's name.
//
// This runs once during analysis, on content already paid for, so it costs
// one model call and no extra scraping.

export interface BusinessIdentity {
  /** The trading name, as the business would answer the phone. */
  businessName: string | null;
  /** The trade, specific enough to search for a design reference. */
  industry: string | null;
  /** Primary city or service area. Null for genuinely national businesses. */
  city: string | null;
  /** Whether this business serves a local area at all. */
  isLocal: boolean;
}

export async function classifyBusiness(facts: Record<string, unknown>): Promise<BusinessIdentity | null> {
  const pages = (facts.pages as { url: string; title: string | null; bodyText: string }[] | undefined) ?? [];
  const nap = facts.nap as { address?: string; phones?: string[] } | undefined;
  const services = (facts.derived_services as string[] | undefined) ?? [];
  const markdown = typeof facts.markdown === "string" ? facts.markdown : "";

  const context = [
    `Website: ${facts.source_url}`,
    nap?.address ? `Address found on site: ${nap.address}` : "",
    services.length > 0 ? `Pages suggest these services: ${services.join(", ")}` : "",
    pages[0]?.title ? `Homepage title tag: ${pages[0].title}` : "",
    "",
    "Homepage content:",
    (pages[0]?.bodyText || markdown).slice(0, 6000),
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await callOpenAI(
    `Read this business's own website and identify it.

${context}

Answer these four things:

businessName — the trading name, as they would answer the phone. NOT their tagline or slogan. A title tag often contains a slogan; if so, ignore it and find the real name in the logo text, copyright line, or contact details. Null if genuinely unclear.

industry — the trade, specific enough to search for competitors. "Electrical contractor", "Roofing contractor", "Digital marketing agency", "Family dentist". Not a category like "services" or "business".

city — the primary city or town they serve. Use the address if there is one. Null if this business genuinely has no local service area.

isLocal — true if customers come from a geographic area around them, false for a business that serves clients anywhere.

Return strict JSON only:
{"businessName": "...", "industry": "...", "city": "...", "isLocal": true}`,
    {
      json: true,
      maxTokens: 8000,
      temperature: 0.1,
      system: "You identify businesses from their own websites. You report only what the content supports, and use null rather than guessing.",
    }
  );

  const parsed = raw ? parseJsonResponse(raw) : null;
  if (!parsed) return null;

  const str = (v: unknown): string | null => {
    if (typeof v !== "string") return null;
    const trimmed = v.trim();
    // Models answer "null"/"unknown" as strings more often than they return
    // an actual null.
    if (!trimmed || /^(null|unknown|n\/a|none)$/i.test(trimmed)) return null;
    return trimmed;
  };

  return {
    businessName: str(parsed.businessName),
    industry: str(parsed.industry),
    city: str(parsed.city),
    isLocal: parsed.isLocal !== false,
  };
}
