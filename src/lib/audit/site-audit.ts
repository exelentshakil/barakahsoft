import type { PageInventory } from "@/lib/scrape/extract-text";

// The SEO and technical audit of the client's CURRENT site.
//
// Every finding here is derived from the crawl, the Google Business listing
// and the PageSpeed run already paid for during analysis, so the whole
// audit costs nothing additional. It is also the most persuasive part of
// the report precisely because it is checkable: an owner can open their own
// site and confirm every line.
//
// Findings are written as observations with consequences, not as scores. A
// number tells an owner they are losing; a sentence tells them why, which
// is what makes the conversation happen. The score exists anyway, because
// one number is what gets read first and it earns the right to the
// sentences underneath.
//
// The version this replaced checked nine things and told an operator
// "nothing critical found" about sites with real, nameable problems, while
// the scrape was already storing server response times, Lighthouse's own
// list of fixes, per-page titles and headings, opening hours and social
// profiles that nothing ever read. Depth here is not padding: you cannot
// sell a rebuild to someone whose site you understand less well than they
// do.

export type AuditSeverity = "critical" | "warning" | "ok";

export type AuditArea =
  | "speed"
  | "mobile"
  | "structure"
  | "content"
  | "trust"
  | "conversion"
  | "schema"
  | "local";

export interface AuditFinding {
  severity: AuditSeverity;
  area: AuditArea;
  title: string;
  /** What is true of their site right now. */
  finding: string;
  /** Why it costs them. Plain language, no jargon. */
  consequence: string;
  /** What the rebuild does about it. */
  resolution: string;
  /** The measurement behind it, so the claim can be checked. */
  evidence?: string;
}

export interface SiteAudit {
  findings: AuditFinding[];
  blockers: AuditFinding[];
  warnings: AuditFinding[];
  passing: AuditFinding[];
  criticalCount: number;
  warningCount: number;
  passCount: number;
  /** 0-100, derived from the findings below. Never invented. */
  score: number;
  /** Mobile PageSpeed score, when a real run exists. */
  speedScore: number | null;
  pageCount: number;
  /**
   * How much of the site this audit actually saw.
   *
   * Most of the findings below read every crawled page, so a two-page
   * light read produces a thin audit of a site that may have two hundred
   * pages of problems. That is a fact about the crawl, not about the site,
   * and an operator about to walk a client through this needs to know
   * which of the two they are looking at.
   */
  pagesChecked: number;
  pagesKnown: number;
}

interface AuditInput {
  facts: Record<string, unknown>;
  pagespeedMobile: Record<string, unknown> | null;
  pagespeedDesktop?: Record<string, unknown> | null;
  businessName: string;
  city: string | null;
  services: string[];
  rating: number | null;
  reviewCount: number | null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function auditCurrentSite(input: AuditInput): SiteAudit {
  const { facts, pagespeedMobile, pagespeedDesktop } = input;
  const findings: AuditFinding[] = [];
  const add = (f: AuditFinding) => findings.push(f);

  const pages = (facts.pages as PageInventory[] | undefined) ?? [];
  const sitemapUrls = (facts.sitemap_urls as string[] | undefined) ?? [];
  const pageCount = Math.max(pages.length, sitemapUrls.length);
  const homepage = pages[0];
  const bodyText = homepage?.bodyText ?? "";
  const allText = pages.map((p) => p.bodyText ?? "").join(" ");
  const schema = (facts.existing_schema as unknown[] | undefined) ?? [];
  const nap = facts.nap as { phones?: string[]; emails?: string[]; address?: string } | undefined;
  const hours = facts.hours as string[] | null | undefined;
  const socialUrls = (facts.social_urls as string[] | undefined) ?? [];
  const sitePhotos = (facts.site_photos as unknown[] | undefined) ?? [];
  const areas = (facts.derived_areas as string[] | undefined) ?? [];

  const score = num(pagespeedMobile?.score);
  const lcp = num(pagespeedMobile?.lcp_ms);
  const cls = num(pagespeedMobile?.cls);
  const ttfb = num(pagespeedMobile?.ttfb_ms);
  const desktopScore = num(pagespeedDesktop?.score);
  const opportunities =
    (pagespeedMobile?.opportunities as { id: string; title: string }[] | undefined) ?? [];

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
        evidence: `Google PageSpeed, mobile: ${score}/100`,
      });
    } else if (score < 80) {
      add({
        severity: "warning",
        area: "speed",
        title: "Mobile speed is holding the site back",
        finding: `Google scores this site ${score} out of 100 on a phone.`,
        consequence: "Slow pages rank lower and convert worse, and the gap widens on a weak mobile connection.",
        resolution: "The rebuild targets a near-instant first paint.",
        evidence: `Google PageSpeed, mobile: ${score}/100`,
      });
    } else {
      add({
        severity: "ok",
        area: "speed",
        title: "The site loads quickly on a phone",
        finding: `Google scores this site ${score} out of 100 on mobile.`,
        consequence: "",
        resolution: "The rebuild holds this and keeps it there as content grows.",
        evidence: `Google PageSpeed, mobile: ${score}/100`,
      });
    }
  }

  // Time to first byte is the server, not the page — and it is the one
  // number a faster front end cannot rescue.
  if (ttfb !== null && ttfb > 800) {
    add({
      severity: ttfb > 1800 ? "critical" : "warning",
      area: "speed",
      title: "Their server is slow to answer at all",
      finding: `The server takes ${(ttfb / 1000).toFixed(2)} seconds to send the first byte, before any of the page has been drawn.`,
      consequence:
        "Every visitor waits this out before anything appears, on every page. No amount of design work removes it — it is the hosting.",
      resolution: "The rebuilt site is served from a global edge network, typically answering in under a tenth of a second.",
      evidence: `Server response time: ${Math.round(ttfb)}ms`,
    });
  }

  if (lcp !== null && lcp > 4000) {
    add({
      severity: "critical",
      area: "speed",
      title: "The main image or headline takes seconds to appear",
      finding: `The largest thing on the screen finishes loading after ${(lcp / 1000).toFixed(1)} seconds.`,
      consequence:
        "This is the moment a visitor decides the page is working. Four seconds of blank space is where most phone visitors leave.",
      resolution: "A compressed, correctly sized hero image loaded at high priority.",
      evidence: `Largest Contentful Paint: ${(lcp / 1000).toFixed(1)}s`,
    });
  }

  // Google names its own fixes in the Lighthouse run. Quoting them is more
  // persuasive than paraphrasing, because the owner can run the same test.
  if (opportunities.length > 0 && (score ?? 100) < 90) {
    add({
      severity: "warning",
      area: "speed",
      title: "Google lists specific fixes for this site",
      finding: `Google's own speed test names ${opportunities.length} thing${opportunities.length === 1 ? "" : "s"} slowing this site down: ${opportunities.map((o) => o.title).slice(0, 4).join("; ")}.`,
      consequence:
        "These are not opinions. They are the items Google itself flags, and they are the same signals that decide how the site ranks on a phone.",
      resolution: "The rebuild is measured against the same test and ships above 90.",
      evidence: opportunities.map((o) => o.id).join(", "),
    });
  }

  if (desktopScore !== null && score !== null && desktopScore - score > 30) {
    add({
      severity: "warning",
      area: "mobile",
      title: "The site was built for a desktop, not a phone",
      finding: `It scores ${desktopScore} on a desktop and only ${score} on a phone.`,
      consequence:
        "A gap that size means the mobile experience was never tested, and most local searches happen on a phone.",
      resolution: "The rebuild is designed on a phone first and checked on a desktop second.",
      evidence: `Desktop ${desktopScore}/100 vs mobile ${score}/100`,
    });
  }

  if (cls !== null && cls > 0.1) {
    add({
      severity: "warning",
      area: "mobile",
      title: "The page moves around while it loads",
      finding: `Google measures ${cls.toFixed(2)} of visible layout shifting while the page loads.`,
      consequence: "Buttons move under the reader's thumb. It feels broken, and it is a ranking signal.",
      resolution: "Fixed image dimensions and no late-loading layout.",
      evidence: `Cumulative Layout Shift: ${cls.toFixed(2)}`,
    });
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
      evidence: `${pageCount} pages found`,
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
      evidence: `${input.services.length} services, ${pageCount} pages`,
    });
  }

  // ---- Per-page technical ----------------------------------------------
  // These read every page the crawl captured, not just the homepage, which
  // is where most real SEO problems on a small site actually live.
  const crawled = pages.filter((p) => (p.bodyText ?? "").length > 0);
  if (crawled.length > 1) {
    const untitled = crawled.filter((p) => !p.title || p.title.trim().length === 0);
    if (untitled.length > 0) {
      add({
        severity: "critical",
        area: "content",
        title: "Pages with no title at all",
        finding: `${untitled.length} of ${crawled.length} pages have no title tag.`,
        consequence:
          "The title is the blue line a searcher clicks in Google. Without one Google writes its own, usually from whatever text it finds first.",
        resolution: "A written title on every page, aimed at what that page is actually for.",
        evidence: untitled.map((p) => p.url).slice(0, 3).join(", "),
      });
    }

    const titles = new Map<string, string[]>();
    for (const page of crawled) {
      const key = (page.title ?? "").trim().toLowerCase();
      if (!key) continue;
      titles.set(key, [...(titles.get(key) ?? []), page.url]);
    }
    const duplicated = [...titles.entries()].filter(([, urls]) => urls.length > 1);
    if (duplicated.length > 0) {
      const affected = duplicated.reduce((total, [, urls]) => total + urls.length, 0);
      add({
        severity: "warning",
        area: "content",
        title: "Different pages share the same title",
        finding: `${affected} pages reuse ${duplicated.length} title${duplicated.length === 1 ? "" : "s"} between them.`,
        consequence:
          "Google treats near-identical titles as near-identical pages and picks one to show. The rest compete with it instead of adding to it.",
        resolution: "A distinct title per page, naming the service and the place.",
        evidence: duplicated.map(([title]) => `"${title}"`).slice(0, 3).join(", "),
      });
    }

    const noH1 = crawled.filter((p) => (p.headings ?? []).length === 0);
    if (noH1.length > 0) {
      add({
        severity: "warning",
        area: "content",
        title: "Pages with no headings",
        finding: `${noH1.length} of ${crawled.length} pages carry no headings at all.`,
        consequence:
          "Headings are how a reader skims and how Google works out what a page is about. A wall of unbroken text is read by neither.",
        resolution: "A real heading structure on every page.",
        evidence: noH1.map((p) => p.url).slice(0, 3).join(", "),
      });
    }

    const thin = crawled.filter((p) => {
      const count = words(p.bodyText ?? "");
      return count > 0 && count < 150;
    });
    if (thin.length > 0) {
      add({
        severity: thin.length > crawled.length / 2 ? "critical" : "warning",
        area: "content",
        title: "Pages with almost nothing on them",
        finding: `${thin.length} of ${crawled.length} pages carry under 150 words.`,
        consequence:
          "A page this thin cannot answer a question, so it cannot rank for one. It also tells a visitor the business could not be bothered.",
        resolution: "Every page written to actually answer what someone arriving on it wanted to know.",
        evidence: thin.map((p) => `${p.url} (${words(p.bodyText ?? "")} words)`).slice(0, 3).join(", "),
      });
    }
  }

  // ---- Content ---------------------------------------------------------
  const homepageWords = words(bodyText);
  if (homepageWords > 0 && homepageWords < 300) {
    add({
      severity: "critical",
      area: "content",
      title: "The homepage says very little",
      finding: `The homepage carries about ${homepageWords} words.`,
      consequence:
        "A visitor cannot tell what makes this business different, and Google has almost nothing to understand the business by.",
      resolution: "A homepage built around the real services, real proof and the real service area.",
      evidence: `${homepageWords} words on the homepage`,
    });
  }

  // Checked across every crawled page, not just the homepage — a real FAQ
  // usually lives on its own page, and a homepage-only check missed it
  // every time.
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
  } else {
    add({
      severity: "ok",
      area: "content",
      title: "The site answers common questions",
      finding: "There is question-and-answer content on the site.",
      consequence: "",
      resolution: "The rebuild keeps it and marks it up so Google and AI assistants can quote it.",
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
  } else {
    add({
      severity: "ok",
      area: "schema",
      title: "The business is described in structured data",
      finding: "The site publishes structured data identifying it as a local business.",
      consequence: "",
      resolution: "The rebuild keeps it and extends it to every service and area page.",
    });
  }

  // ---- Conversion ------------------------------------------------------
  const hasTel = /href=["']tel:/i.test(bodyText) || (nap?.phones?.length ?? 0) > 0;
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
      evidence: `${pages.length} pages crawled, no form fields found`,
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

  // Google publishes their hours. If the site does not, every visitor who
  // wants to know whether they are open right now leaves to find out.
  if (hours && hours.length > 0 && !/\b(mon|tue|wed|thu|fri|sat|sun|open|hours)\b/i.test(allText)) {
    add({
      severity: "warning",
      area: "conversion",
      title: "Opening hours are on Google but not on the site",
      finding: "Google lists opening hours for this business and the website mentions none.",
      consequence:
        "Someone deciding whether to call now has to go back to Google to find out — and Google will show them competitors on the way.",
      resolution: "Real opening hours on the page and in the structured data.",
      evidence: hours.slice(0, 2).join(" · "),
    });
  }

  // ---- Trust -----------------------------------------------------------
  const mentionsReviews = /\b(review|rating|star)/i.test(allText);
  if (input.rating && input.reviewCount && !mentionsReviews) {
    add({
      severity: "critical",
      area: "trust",
      title: "Their best proof is invisible",
      finding: `${input.reviewCount} Google reviews averaging ${input.rating} stars, and the site mentions none of it.`,
      consequence:
        "This is the strongest reason to choose them over a competitor, and a visitor has to leave the site to discover it.",
      resolution: "Real rating and real review text placed where the decision is being made.",
      evidence: `${input.rating}★ from ${input.reviewCount} Google reviews`,
    });
  } else if (input.rating && input.reviewCount && mentionsReviews) {
    add({
      severity: "ok",
      area: "trust",
      title: "Their reviews are on the site",
      finding: `The site references their ${input.rating}★ rating from ${input.reviewCount} reviews.`,
      consequence: "",
      resolution: "The rebuild puts them next to the button, where the hesitation happens.",
    });
  }

  if (socialUrls.length === 0) {
    add({
      severity: "warning",
      area: "trust",
      title: "No social profiles linked from the site",
      finding: "The site links to no Facebook, Instagram or other profile.",
      consequence:
        "A cautious buyer checks whether a business looks active somewhere else before calling. Nothing to click is a reason to hesitate.",
      resolution: "Their real profiles linked in the footer, where buyers look for them.",
    });
  }

  if (sitePhotos.length < 4) {
    add({
      severity: sitePhotos.length === 0 ? "critical" : "warning",
      area: "trust",
      title: "Almost no photographs of their actual work",
      finding: `Only ${sitePhotos.length} usable image${sitePhotos.length === 1 ? "" : "s"} were found across the site.`,
      consequence:
        "In a trade, finished work is the proof. A site without it asks the visitor to take the business on trust against a competitor who is showing them.",
      resolution: "Their real photography placed through the page, at the points where someone is deciding.",
      evidence: `${sitePhotos.length} images found`,
    });
  }

  // ---- Local -----------------------------------------------------------
  if (input.city && input.city !== "the local area" && !new RegExp(input.city, "i").test(bodyText)) {
    add({
      severity: "warning",
      area: "local",
      title: "The area served is not named on the page",
      finding: `The homepage does not mention ${input.city}.`,
      consequence: "Local searches are the highest-intent traffic there is, and the site gives Google nothing to match on.",
      resolution: `Real location content naming ${input.city} and the surrounding areas.`,
    });
  }

  if (areas.length > 1) {
    const named = areas.filter((area) => new RegExp(area, "i").test(allText)).length;
    if (named < areas.length / 2) {
      add({
        severity: "warning",
        area: "local",
        title: "Most of the places they serve are never named",
        finding: `They serve ${areas.length} areas and the site names only ${named} of them.`,
        consequence:
          "Someone searching for the trade plus their own town finds nothing to match. Every unnamed area is a search the business cannot appear in.",
        resolution: "A real page for each area served, written for someone in that area.",
        evidence: areas.slice(0, 5).join(", "),
      });
    }
  }

  if (!nap?.address) {
    add({
      severity: "warning",
      area: "local",
      title: "No address a customer can see",
      finding: "No street address was found on the site.",
      consequence:
        "Google weighs a visible, consistent address when deciding local rankings, and buyers use it to decide whether a business is really near them.",
      resolution: "The real address in the footer and in the structured data.",
    });
  }

  // ---- Placeholder content ---------------------------------------------
  if (/\b(lorem ipsum|coming soon|under construction|your text here|sample text)\b/i.test(allText)) {
    add({
      severity: "critical",
      area: "content",
      title: "Unfinished placeholder text is live on the site",
      finding: "Template placeholder wording is still published on the site.",
      consequence:
        "Nothing costs credibility faster. It tells a visitor the business abandoned its own website halfway through.",
      resolution: "Every word on the rebuilt site written for this business.",
    });
  }

  const blockers = findings.filter((f) => f.severity === "critical");
  const warnings = findings.filter((f) => f.severity === "warning");
  const passing = findings.filter((f) => f.severity === "ok");

  // The headline number. Derived from what was actually measured — a
  // critical finding costs more than a warning, and the speed score is
  // folded in because it is the one number the owner can verify in
  // thirty seconds. Never below zero, never flattering.
  const penalty = blockers.length * 9 + warnings.length * 4;
  const speedComponent = score === null ? 0 : Math.round((100 - score) * 0.25);
  const overall = Math.max(0, Math.min(100, 100 - penalty - speedComponent));

  return {
    findings,
    blockers,
    warnings,
    passing,
    criticalCount: blockers.length,
    warningCount: warnings.length,
    passCount: passing.length,
    score: overall,
    speedScore: score,
    pageCount,
    pagesChecked: crawled.length,
    pagesKnown: pageCount,
  };
}
