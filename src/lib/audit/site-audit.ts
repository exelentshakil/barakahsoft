import type { PageInventory } from "@/lib/scrape/extract-text";

// The SEO and technical audit of the client's CURRENT site.
//
// Every finding here is derived from the crawl and the PageSpeed run already
// paid for during analysis, so the whole audit costs nothing additional. It
// is also the most persuasive part of the report precisely because it is
// checkable: an owner can open their own site and confirm every line.
//
// Findings are written as observations with consequences, not as scores. A
// number tells an owner they are losing; a sentence tells them why, which is
// what makes the conversation happen.

export type AuditSeverity = "critical" | "warning" | "ok";

export interface AuditFinding {
  severity: AuditSeverity;
  area: "speed" | "mobile" | "structure" | "content" | "trust" | "conversion" | "schema";
  title: string;
  /** What is true of their site right now. */
  finding: string;
  /** Why it costs them. Plain language, no jargon. */
  consequence: string;
  /** What the rebuild does about it. */
  resolution: string;
}

export interface SiteAudit {
  findings: AuditFinding[];
  criticalCount: number;
  /** Mobile PageSpeed score, when a real run exists. */
  speedScore: number | null;
  pageCount: number;
}

interface AuditInput {
  facts: Record<string, unknown>;
  pagespeedMobile: Record<string, unknown> | null;
  businessName: string;
  city: string | null;
  services: string[];
  rating: number | null;
  reviewCount: number | null;
}

export function auditCurrentSite(input: AuditInput): SiteAudit {
  const { facts, pagespeedMobile } = input;
  const findings: AuditFinding[] = [];
  const add = (f: AuditFinding) => findings.push(f);

  const pages = (facts.pages as PageInventory[] | undefined) ?? [];
  const sitemapUrls = (facts.sitemap_urls as string[] | undefined) ?? [];
  const pageCount = Math.max(pages.length, sitemapUrls.length);
  const homepage = pages[0];
  const bodyText = homepage?.bodyText ?? "";
  const schema = (facts.existing_schema as unknown[] | undefined) ?? [];
  const nap = facts.nap as { phones?: string[]; emails?: string[]; address?: string } | undefined;

  const score = typeof pagespeedMobile?.score === "number" ? (pagespeedMobile.score as number) : null;
  const lcp = typeof pagespeedMobile?.lcp_ms === "number" ? (pagespeedMobile.lcp_ms as number) : null;

  // ---- Speed -----------------------------------------------------------
  if (score !== null) {
    if (score < 50) {
      add({
        severity: "critical",
        area: "speed",
        title: "The site is slow on a phone",
        finding: `Google scores this site ${score} out of 100 for mobile speed${lcp ? `, with the main content taking ${(lcp / 1000).toFixed(1)} seconds to appear` : ""}.`,
        consequence:
          "More than half of mobile visitors abandon a page that takes over three seconds. Most of these people never see the site at all — they are back on Google looking at a competitor.",
        resolution: "The rebuilt site is server-rendered with compressed images and no page-builder overhead.",
      });
    } else if (score < 80) {
      add({
        severity: "warning",
        area: "speed",
        title: "Mobile speed is holding the site back",
        finding: `Google scores this site ${score} out of 100 on a phone.`,
        consequence: "Slow pages rank lower and convert worse, and the gap widens on a weak mobile connection.",
        resolution: "The rebuild targets a near-instant first paint.",
      });
    }
  }

  // ---- Structure -------------------------------------------------------
  if (pageCount <= 3) {
    add({
      severity: "critical",
      area: "structure",
      title: "Almost no pages for Google to rank",
      finding: `The whole site is ${pageCount} page${pageCount === 1 ? "" : "s"}.`,
      consequence:
        "Google can only rank a page that exists. With this few, the site competes for a handful of searches while competitors with a page per service and per area compete for hundreds.",
      resolution: `A dedicated page for each real service${input.city ? `, and for the areas served around ${input.city}` : ""}.`,
    });
  } else if (input.services.length > 2 && pageCount < input.services.length) {
    add({
      severity: "warning",
      area: "structure",
      title: "Services share one page",
      finding: `${input.services.length} services are described across only ${pageCount} pages.`,
      consequence:
        "Someone searching for one specific job lands on a general page and has to hunt. Google has nothing specific to rank either.",
      resolution: "Each service gets its own page, written for the person searching for exactly that job.",
    });
  }

  // ---- Content ---------------------------------------------------------
  const words = bodyText.split(/\s+/).filter(Boolean).length;
  if (words > 0 && words < 300) {
    add({
      severity: "critical",
      area: "content",
      title: "The homepage says very little",
      finding: `The homepage carries about ${words} words.`,
      consequence:
        "A visitor cannot tell what makes this business different, and Google has almost nothing to understand the business by.",
      resolution: "A homepage built around the real services, real proof and the real service area.",
    });
  }

  // Checked across every crawled page, not just the homepage — a real FAQ
  // usually lives on its own page, and a homepage-only check missed it
  // every time. Text match is broadened past the literal word "FAQ" (a
  // section titled "Common Questions" or "Have Questions?" is still an
  // FAQ), and FAQPage structured data counts on its own even with no
  // matching visible text, since that's still a real, working FAQ.
  const faqTextPattern = /frequently asked|\bfaqs?\b|common questions|have questions|questions?\s*(and|&)\s*answers|\bq\s*&\s*a\b/i;
  const hasFaq =
    pages.some((p) => faqTextPattern.test(p.bodyText ?? "") || /\bfaq\b|questions/i.test(p.url)) ||
    /FAQPage/i.test(JSON.stringify(schema));
  if (!hasFaq) {
    add({
      severity: "warning",
      area: "content",
      title: "No answers to the questions customers actually ask",
      finding: "The site has no FAQ or question-and-answer content.",
      consequence:
        "These are the questions people type into Google and now into ChatGPT. Without plain answers on the page, the site cannot be the source either one quotes.",
      resolution: "A real FAQ answering what customers ask before they call.",
    });
  }

  // ---- Schema ----------------------------------------------------------
  const schemaText = JSON.stringify(schema);
  if (schema.length === 0) {
    add({
      severity: "critical",
      area: "schema",
      title: "Search engines cannot read the business details",
      finding: "The site publishes no structured data at all.",
      consequence:
        "Google is left guessing the business name, phone number, address and opening hours, and cannot show the rich result that makes a listing stand out.",
      resolution: "Valid LocalBusiness and FAQ structured data on every page.",
    });
  } else if (!/LocalBusiness|Roofing|Contractor|Organization/i.test(schemaText)) {
    add({
      severity: "warning",
      area: "schema",
      title: "Structured data does not describe a local business",
      finding: "Structured data exists but does not identify this as a local business.",
      consequence: "Google cannot connect the site to the map listing with any confidence.",
      resolution: "Correct LocalBusiness markup tied to the real name, address and phone.",
    });
  }

  // ---- Conversion ------------------------------------------------------
  const hasTel = /href=["']tel:/i.test(homepage?.bodyText ?? "") || (nap?.phones?.length ?? 0) > 0;
  const formFields = pages.flatMap((p) => p.formFields ?? []);
  if (formFields.length === 0) {
    add({
      severity: "critical",
      area: "conversion",
      title: "No way to request a quote without picking up the phone",
      finding: "There is no enquiry or quote form anywhere on the site.",
      consequence:
        "Every visitor who is not ready to call right then leaves with no way to get in touch — including everyone browsing in the evening.",
      resolution: "A short quote form on every page, plus one-tap calling on mobile.",
    });
  }
  if (!hasTel) {
    add({
      severity: "critical",
      area: "conversion",
      title: "The phone number is not tappable",
      finding: "The phone number is not marked up as a link a phone can dial.",
      consequence: "A mobile visitor has to memorise the number and switch apps. Most simply do not.",
      resolution: "One-tap calling everywhere the number appears.",
    });
  }

  // ---- Trust -----------------------------------------------------------
  if (input.rating && input.reviewCount && !/\b(review|rating|star)/i.test(bodyText)) {
    add({
      severity: "critical",
      area: "trust",
      title: "Their best proof is invisible",
      finding: `${input.reviewCount} Google reviews averaging ${input.rating} stars, and the site mentions none of it.`,
      consequence:
        "This is the strongest reason to choose them over a competitor, and a visitor has to leave the site to discover it.",
      resolution: "Real rating and real review text placed where the decision is being made.",
    });
  }

  if (input.city && !new RegExp(input.city, "i").test(bodyText)) {
    add({
      severity: "warning",
      area: "content",
      title: "The area served is not named on the page",
      finding: `The homepage does not mention ${input.city}.`,
      consequence: "Local searches are the highest-intent traffic there is, and the site gives Google nothing to match on.",
      resolution: `Real location content naming ${input.city} and the surrounding areas.`,
    });
  }

  // ---- Mobile ----------------------------------------------------------
  if (typeof pagespeedMobile?.cls === "number" && (pagespeedMobile.cls as number) > 0.1) {
    add({
      severity: "warning",
      area: "mobile",
      title: "The page moves around while it loads",
      finding: `Google measures visible layout shifting while the page loads.`,
      consequence: "Buttons move under the reader's thumb. It feels broken, and it is a ranking signal.",
      resolution: "Fixed image dimensions and no late-loading layout.",
    });
  }

  return {
    findings,
    criticalCount: findings.filter((f) => f.severity === "critical").length,
    speedScore: score,
    pageCount,
  };
}
