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
// It also reads the SERVICES, which is why this replaced the URL and
// navigation heuristics as the primary source. Those produced "Page
// Sitemap.Xml" on one real site and "About Us ▾", "Career›" and "Tool
// Reviews" on another — navigation labels and machine files presented to a
// client as things their business sells. A model reading the actual page
// content knows the difference between a menu item and a job someone pays
// for; a regular expression over URLs never will.
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
  /** The services they actually sell, read from their own content. */
  services: string[];
  /** Real places they say they serve. */
  areas: string[];
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

services — the things this business actually SELLS, read from their own content. Report every real one you find and no more; do not invent, infer or round the list up to a target length. Do NOT include navigation labels like "About Us" or "Contact".

areas — real towns, cities or neighbourhoods they serve, as named in their own content. Never add a place they do not name: an invented service area becomes a factual claim on their live website.



Return strict JSON only:
{"businessName": "...", "industry": "...", "city": "...", "isLocal": true, "services": ["..."], "areas": ["..."]}`,
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

  // Menu decoration survives scraping and reads as part of the name.
  const cleanList = (v: unknown): string[] =>
    (Array.isArray(v) ? v : [])
      .map((x) => (typeof x === "string" ? x.replace(/[\u2039\u203A\u25B8\u25BE\u25BC\u276F>›»▸▾▼]/g, "").trim() : ""))
      .filter((x) => x.length > 2 && x.length < 60)
      .slice(0, 12);

  return {
    businessName: str(parsed.businessName),
    industry: str(parsed.industry),
    city: str(parsed.city),
    isLocal: parsed.isLocal !== false,
    services: cleanList(parsed.services).slice(0, 8),
    areas: cleanList(parsed.areas).slice(0, 8),
  };
}
