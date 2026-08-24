import { callGemini } from "@/lib/gemini-client";

// What this lead can pay, and therefore what to quote.
//
// You cannot read willingness to pay. You can measure ability to pay and
// the size of the job they sell, and those two decide the offer far more
// reliably than a hunch on a call does.
//
// The distinction that matters in this market: a website is now widely
// believed to be cheap or free, so an upfront fee is the thing that loses
// the deal with a small operator — while a business selling £15k roofs and
// already buying leads will pay a setup fee without blinking and is
// insulted by the cheapest tier. Quoting one price to both loses money at
// one end and the sale at the other.
//
// Everything here except the job-value estimate is MEASURED from the scrape
// that has already been paid for. The estimate is clearly labelled as an
// estimate wherever it is shown, because it is the one number here that is
// a judgement rather than a reading.

export type OfferTier = "budget" | "standard" | "premium";

export interface OfferOption {
  id: "essential" | "growth" | "complete" | "managed";
  label: string;
  description: string;
  setupPrice: number;
  monthlyPrice: number;
  standardValue: number;
  scopeItems: string[];
}

export interface LeadValueSignal {
  label: string;
  /** Positive means more able to pay. */
  weight: number;
  /** The measurement behind it. */
  evidence: string;
}

export interface LeadValue {
  tier: OfferTier;
  /** 0-100. Ability to pay, not likelihood of closing. */
  score: number;
  signals: LeadValueSignal[];
  /** Estimated value of one job for this trade. An estimate, always. */
  typicalJobValue: string | null;
  /** What to lead with, in one line an operator can read on a call. */
  recommendation: string;
  suggested: { setupPrice: number; monthlyPrice: number; standardValue: number; label: string; offerId: OfferOption["id"] };
  offers: OfferOption[];
}

export function buildOfferOptions(corePageCount: number, businessName = "your business"): OfferOption[] {
  const pages = Math.max(5, Math.min(20, corePageCount));
  return [
    {
      id: "essential",
      label: "Essential Launch",
      description: "A focused five-page rebuild for a clear, credible first impression.",
      setupPrice: 295,
      monthlyPrice: 0,
      standardValue: 595,
      scopeItems: [
        `Custom homepage redesign tailored for ${businessName}`,
        `Up to ${Math.min(5, pages)} core service pages based on your real offerings`,
        "Mobile conversion optimization & click-to-call flow",
        "Verified Google review badges and trust integration",
        "LocalBusiness schema foundation for local search",
        "100% client-owned website files & source assets",
      ],
    },
    {
      id: "growth",
      label: "Growth Build",
      description: "The practical choice when several services need their own conversion path.",
      setupPrice: 597,
      monthlyPrice: 0,
      standardValue: 1297,
      scopeItems: [
        `Custom homepage redesign tailored for ${businessName}`,
        `Up to ${Math.min(10, pages)} dedicated service & location pages`,
        "Lead capture, quote request & instant callback routing",
        "LocalBusiness JSON-LD schema & technical SEO foundation",
        "Responsive branding with custom footer & logo badge integration",
        "100% client-owned website files with 2-4 week launch support",
      ],
    },
    {
      id: "complete",
      label: "Complete Website",
      description: "The full core website, without charging for duplicate archives or thin pages.",
      setupPrice: 997,
      monthlyPrice: 0,
      standardValue: 1997,
      scopeItems: [
        `Full ${pages}-page core website architecture for ${businessName}`,
        "Dedicated service pages for all offerings + local area combinations",
        "Speed-engineered performance (95+ Google PageSpeed on mobile)",
        "Custom lead capture forms, click-to-call, and inquiry alerts",
        "Full LocalBusiness SEO schema, OpenGraph cards & sitemap structure",
        "100% client-owned website files with white-glove launch support",
      ],
    },
    {
      id: "managed",
      label: "Managed Growth",
      description: "The complete build plus ongoing hosting, updates, and lead-system support.",
      setupPrice: 295,
      monthlyPrice: 149,
      standardValue: 2497,
      scopeItems: [
        `Full ${pages}-page core website rebuild tailored for ${businessName}`,
        "Dedicated service & territory pages based on your real offerings",
        "Global high-speed edge hosting, SSL & automated weekly backups",
        "Ongoing security monitoring, maintenance & monthly content updates",
        "AI lead assistant with instant SMS/Email notifications",
        "100% client-owned website files (cancel anytime without penalty)",
      ],
    },
  ];
}

interface ValueInput {
  facts: Record<string, unknown>;
  industry: string | null;
  pagespeedMobile: Record<string, unknown> | null;
}

/**
 * Ability-to-pay signals, all read from the existing scrape.
 *
 * Review volume is the single best proxy available: a business with three
 * hundred reviews is taking work every week and has been for years, and one
 * with four either just started or is not being chosen.
 */
function readSignals(input: ValueInput): LeadValueSignal[] {
  const { facts } = input;
  const signals: LeadValueSignal[] = [];

  const reviewCount = typeof facts.review_count === "number" ? facts.review_count : 0;
  const rating = typeof facts.rating === "number" ? facts.rating : null;
  const services = (facts.derived_services as string[] | undefined) ?? [];
  const areas = (facts.derived_areas as string[] | undefined) ?? [];
  const socialUrls = (facts.social_urls as string[] | undefined) ?? [];
  const sitemapUrls = (facts.sitemap_urls as string[] | undefined) ?? [];
  const photos = (facts.site_photos as unknown[] | undefined) ?? [];
  const schema = (facts.existing_schema as unknown[] | undefined) ?? [];
  const hours = (facts.hours as string[] | undefined) ?? [];
  const allText = ((facts.pages as { bodyText?: string }[] | undefined) ?? [])
    .map((p) => p.bodyText ?? "")
    .join(" ");

  if (reviewCount >= 150) {
    signals.push({
      label: "Busy, established business",
      weight: 30,
      evidence: `${reviewCount} Google reviews${rating ? ` at ${rating}★` : ""}`,
    });
  } else if (reviewCount >= 40) {
    signals.push({ label: "Steady work coming in", weight: 16, evidence: `${reviewCount} Google reviews` });
  } else if (reviewCount > 0) {
    signals.push({ label: "Few reviews — small or new", weight: -12, evidence: `${reviewCount} Google reviews` });
  } else {
    signals.push({ label: "No Google reviews found", weight: -18, evidence: "No reviews on the listing" });
  }

  // Someone who has already paid for a site with real depth has bought
  // this kind of thing before, which is most of the battle.
  if (sitemapUrls.length >= 40) {
    signals.push({
      label: "Has paid for a real website before",
      weight: 18,
      evidence: `${sitemapUrls.length} pages on their current site`,
    });
  } else if (sitemapUrls.length <= 5) {
    signals.push({
      label: "Barely has a website",
      weight: -10,
      evidence: `${sitemapUrls.length} page${sitemapUrls.length === 1 ? "" : "s"} found`,
    });
  }

  if (areas.length >= 6) {
    signals.push({ label: "Covers a wide area", weight: 12, evidence: `${areas.length} service areas named` });
  }
  if (services.length >= 6) {
    signals.push({ label: "Broad service list", weight: 10, evidence: `${services.length} distinct services` });
  }

  // Real marketing spend elsewhere is the clearest evidence that a monthly
  // line item is normal for them.
  if (socialUrls.length >= 2) {
    signals.push({ label: "Already markets itself", weight: 8, evidence: `${socialUrls.length} social profiles linked` });
  }
  if (photos.length >= 12) {
    signals.push({ label: "Invests in its own content", weight: 8, evidence: `${photos.length} real photos on site` });
  }
  if (schema.length > 0) {
    signals.push({ label: "Someone technical has worked on it", weight: 6, evidence: "Structured data present" });
  }

  // Commercial work and 24/7 availability both mean larger contracts.
  if (/\bcommercial\b/i.test(allText)) {
    signals.push({ label: "Takes commercial work", weight: 14, evidence: "Commercial mentioned on site" });
  }
  if (hours.some((h) => /24\s*hour|24\/7/i.test(h)) || /24\/7|emergency/i.test(allText)) {
    signals.push({ label: "Emergency or out-of-hours work", weight: 10, evidence: "Emergency service offered" });
  }

  // Years trading, where they say it themselves.
  const yearsMatch = allText.match(/\b(?:since|established|serving\s+\w+\s+since)\s+(19\d{2}|20[0-1]\d)\b/i);
  if (yearsMatch) {
    const years = new Date().getFullYear() - Number(yearsMatch[1]);
    if (years >= 15) {
      signals.push({ label: "Long-established", weight: 12, evidence: `Trading since ${yearsMatch[1]} — ${years} years` });
    }
  }

  return signals;
}

/**
 * What one job is worth in this trade.
 *
 * The only genuinely uncertain number here, and the one that most changes
 * the answer: a roofer replacing a roof and a mobile nail technician have
 * the same review count and completely different budgets. One cheap call
 * during a scrape that is already being paid for.
 */
async function estimateJobValue(industry: string | null, city: string | null): Promise<string | null> {
  if (!industry) return null;

  const reply = await callGemini(
    `A typical ${industry} business${city ? ` in ${city}` : ""}. What does one average job bill at?

Reply with ONLY a short money range and nothing else — no sentence, no explanation. For example: "$300-$800" or "$8,000-$25,000". If you genuinely cannot say for this trade, reply exactly: UNKNOWN`,
    undefined,
    undefined,
    { temperature: 0.2, maxTokens: 2000 }
  );

  if (!reply) return null;
  const cleaned = reply.trim().split("\n")[0].slice(0, 40);
  if (/unknown/i.test(cleaned) || !/\d/.test(cleaned)) return null;
  return cleaned;
}

export async function evaluateLeadValue(input: ValueInput): Promise<LeadValue> {
  const signals = readSignals(input);
  const raw = signals.reduce((total, signal) => total + signal.weight, 0);

  // Centred at 50 so a business with nothing notable sits in the middle
  // rather than at zero, which would read as a judgement on them.
  const score = Math.max(0, Math.min(100, 50 + raw));

  const city = typeof input.facts.town === "string" ? input.facts.town : null;
  const typicalJobValue = await estimateJobValue(input.industry, city);
  const services = (input.facts.derived_services as string[] | undefined) ?? [];
  const areas = (input.facts.derived_areas as string[] | undefined) ?? [];
  const corePageCount = Math.max(5, Math.min(20, 1 + services.length + Math.min(areas.length, 8)));
  const offers = buildOfferOptions(corePageCount, typeof input.facts.business_name === "string" ? input.facts.business_name : "your business");

  // A big-ticket trade lifts the tier on its own: one won job pays for
  // years of the monthly, which is the argument that closes them.
  const bigTicket = typicalJobValue ? /\d{2},\d{3}|\b[5-9],\d{3}|\b\d{2},\d{3}/.test(typicalJobValue) : false;

  let tier: OfferTier = "standard";
  if (score >= 75 || (score >= 62 && bigTicket)) tier = "premium";
  else if (score < 42) tier = "budget";

  const recommendation =
    tier === "premium"
      ? "Lead with the complete fixed-scope build. This business is established and sells valuable work; a cheap website offer would undersell the implementation and the cost of getting it wrong."
      : tier === "budget"
        ? "Lead with the smallest fixed-scope launch. Keep the commitment easy, but charge for the actual rebuild instead of giving away implementation."
        : "Lead with a $997 one-time rebuild. It is accessible for a real business, recovers the research and delivery work, and avoids presenting the website as a commodity.";

  const recommendedId: OfferOption["id"] = tier === "premium" ? "complete" : tier === "budget" ? "essential" : "growth";
  const recommended = offers.find((offer) => offer.id === recommendedId) ?? offers[1];
  const suggested = {
    setupPrice: recommended.setupPrice,
    monthlyPrice: recommended.monthlyPrice,
    standardValue: recommended.standardValue,
    label: `${recommended.label} · ${recommended.setupPrice === 0 ? `$${recommended.monthlyPrice}/mo` : `$${recommended.setupPrice} one time`}`,
    offerId: recommended.id,
  };
  return { tier, score, signals, typicalJobValue, recommendation, suggested, offers };
}
