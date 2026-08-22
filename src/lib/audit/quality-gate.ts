import type { SiteBrief } from "@/lib/generate-bespoke-site";
import type { DesignTokens } from "@/lib/design-tokens";

// The verification gate.
//
// Everything here is MEASURED from the markup and the compiled tokens. No
// model is asked whether the page is good, because a model asked that says
// yes — which is how two unreadable heroes and a page of sitemap filenames
// reached production in this project.
//
// A blocker means the page is not fit to show a client and generation is
// retried. A warning is worth the operator's eye but does not stop anything.
// The point of the distinction is that the operator should only ever be
// looking at warnings; blockers should have been caught and rebuilt before
// they ever saw it.

export interface QualityFinding {
  severity: "blocker" | "warning";
  check: string;
  detail: string;
}

export interface QualityReport {
  findings: QualityFinding[];
  blockers: QualityFinding[];
  passes: boolean;
  /** Fed back into a fresh generation when the gate fails. */
  constraints: string;
}

function textOf(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Top-level bands, so each can be checked for substance individually. */
function topLevelSections(html: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;

  for (const token of html.matchAll(/<(\/?)(section|div|article|aside|main)\b[^>]*?(\/?)>/gi)) {
    if (token[3] === "/") continue;
    if (token[1] !== "/") {
      if (depth === 0) start = token.index!;
      depth++;
    } else {
      depth--;
      if (depth === 0 && start >= 0) {
        out.push(html.slice(start, token.index! + token[0].length));
        start = -1;
      }
      if (depth < 0) depth = 0;
    }
  }
  return out;
}

function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * ch(parseInt(c.slice(0, 2), 16)) +
    0.7152 * ch(parseInt(c.slice(2, 4), 16)) +
    0.0722 * ch(parseInt(c.slice(4, 6), 16))
  );
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const HEX = /^#[0-9a-fA-F]{6}$/;

export function verifyHomepage(
  html: string,
  brief: SiteBrief,
  tokens: DesignTokens
): QualityReport {
  const findings: QualityFinding[] = [];
  const add = (severity: QualityFinding["severity"], check: string, detail: string) =>
    findings.push({ severity, check, detail });

  const sections = topLevelSections(html);
  const body = textOf(html);
  const words = body.split(" ").filter(Boolean).length;

  // ---- Substance -------------------------------------------------------
  if (sections.length < 5) {
    add("blocker", "depth", `Only ${sections.length} sections. A homepage this short reads as a placeholder.`);
  }
  if (words < 350) {
    add("blocker", "depth", `Only ${words} words of real copy. There is not enough here to sell anything.`);
  }

  // "No blank spots": a band that renders as an empty stripe is worse than
  // no band, and it is the most common way a generated page looks broken.
  sections.forEach((section, index) => {
    const sectionWords = textOf(section).split(" ").filter(Boolean).length;
    const hasImage = /<img\b/i.test(section);
    if (sectionWords < 12 && !hasImage) {
      add("blocker", "empty-section", `Section ${index + 1} has ${sectionWords} words and no image — it will render as a blank band.`);
    }
  });

  // ---- The fold --------------------------------------------------------
  const hero = sections[0] ?? "";
  if (!/<h1\b/i.test(hero)) {
    add("blocker", "fold", "The first section has no <h1>. A visitor cannot tell what this business does.");
  }
  if (!/bs-btn/.test(hero) && !/href="tel:/i.test(hero)) {
    add("blocker", "fold", "There is no call to action above the fold. The first screen must offer exactly one thing to do.");
  }
  const heroText = textOf(hero).toLowerCase();
  if (brief.city && brief.city !== "the local area" && !heroText.includes(brief.city.toLowerCase())) {
    add("warning", "fold", `The hero does not name ${brief.city}. Local intent is most of the value for this business.`);
  }

  const h1s = html.match(/<h1\b/gi)?.length ?? 0;
  if (h1s > 1) add("warning", "hierarchy", `${h1s} <h1> elements; exactly one should carry the promise.`);
  if ((html.match(/<h2\b/gi)?.length ?? 0) < 3) {
    add("warning", "hierarchy", "Fewer than three <h2> sections — the page is likely thin.");
  }

  // ---- Conversion ------------------------------------------------------
  const ctas = html.match(/bs-btn\b/g)?.length ?? 0;
  if (ctas === 0) add("blocker", "cta", "The page has no call-to-action button at all.");
  else if (ctas < 3) add("blocker", "cta", `Only ${ctas} call(s) to action across the whole page. A visitor should never scroll back to act.`);

  if (brief.phone && !/href="tel:/i.test(html)) {
    add("blocker", "cta", "The business has a phone number and the page contains no tel: link.");
  }
  if (brief.intent.primary === "call-now" && (html.match(/href="tel:/gi)?.length ?? 0) < 2) {
    add("blocker", "cta", "This trade converts on the phone; the number must appear at more than one decision point.");
  }

  // ---- Truth -----------------------------------------------------------
  if (!brief.rating && /\b\d(\.\d)?\s*(star|★)/i.test(body)) {
    add("blocker", "truth", "The page claims a star rating and no verified rating exists for this business.");
  }
  if (!brief.licensedInsured && /\b(licensed|insured|bonded|certified)\b/i.test(body)) {
    add("blocker", "truth", "The page claims licensing or insurance, which this business does not claim on its own site.");
  }
  if (brief.reviews.length === 0 && /<blockquote|bs-quote/i.test(html)) {
    add("blocker", "truth", "The page shows a testimonial and no real review text was available.");
  }

  // ---- Services --------------------------------------------------------
  const missingServices = brief.services.filter((s) => !body.toLowerCase().includes(s.toLowerCase().slice(0, 14)));
  if (missingServices.length > 0 && brief.services.length > 0) {
    add(
      missingServices.length > brief.services.length / 2 ? "blocker" : "warning",
      "services",
      `Not on the page: ${missingServices.join(", ")}.`
    );
  }

  // ---- The owner's own complaints --------------------------------------
  // These are why they filled the form in. A page that does not answer them
  // is not the page they were promised.
  for (const instruction of brief.painInstructions) {
    if (/every screen needs an obvious next step/i.test(instruction) && ctas < 4) {
      add("blocker", "pain-point", `They said they are not getting enough enquiries, and the page has only ${ctas} calls to action.`);
    }
    if (/name the places they serve/i.test(instruction) && brief.areas.length > 0) {
      const named = brief.areas.filter((a) => body.toLowerCase().includes(a.toLowerCase())).length;
      if (named === 0) {
        add("blocker", "pain-point", "They said they are invisible in local search, and the page names none of their service areas.");
      }
    }
    if (/plain, quotable answers/i.test(instruction) && !/faq|frequently asked|question/i.test(body)) {
      add("blocker", "pain-point", "They said they are absent from AI answers, and the page has no FAQ.");
    }
  }

  // ---- Composition -----------------------------------------------------
  const bands = new Set((html.match(/bs-band-(alt|primary|gradient|invert)/gi) ?? []).map((b) => b.toLowerCase()));
  if (sections.length >= 5 && bands.size < 2) {
    add("blocker", "composition", `${sections.length} sections sharing ${bands.size} background treatment(s) — the page reads as one flat wall.`);
  }

  const grids = new Set((html.match(/bs-(grid-\d|split|rows|bento)/gi) ?? []).map((g) => g.toLowerCase()));
  if (sections.length >= 5 && grids.size < 2) {
    add("warning", "composition", "Every section uses the same layout primitive; consecutive sections will rhyme.");
  }

  // An image used twice reads as a stock page.
  const imgs = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)].map((m) => m[1]);
  const dupes = imgs.filter((u, i) => imgs.indexOf(u) !== i);
  if (dupes.length > 0) {
    add("warning", "composition", `${new Set(dupes).size} image(s) appear more than once.`);
  }

  // ---- Palette ---------------------------------------------------------
  const v = tokens.vars;
  const pairs: [string, string, string][] = [
    ["--bs-ink", "--bs-surface", "body text on the page"],
    ["--bs-ink-muted", "--bs-surface", "muted text on the page"],
    ["--bs-on-primary", "--bs-primary", "button text on the brand colour"],
    ["--bs-invert-ink", "--bs-invert-surface", "text on inverted bands"],
  ];
  for (const [fg, bg, label] of pairs) {
    if (!HEX.test(v[fg] ?? "") || !HEX.test(v[bg] ?? "")) continue;
    const ratio = contrast(v[fg], v[bg]);
    if (ratio < 4.5) add("blocker", "contrast", `${label} is ${ratio.toFixed(2)}:1, below 4.5:1.`);
  }

  if (/(?:#[0-9a-f]{3,8}\b|rgba?\()/i.test(html.replace(/<svg[\s\S]*?<\/svg>/gi, ""))) {
    add("blocker", "contrast", "The markup contains literal colour values, bypassing the palette.");
  }

  // ---- Placeholders ----------------------------------------------------
  if (/\b(lorem ipsum|todo|tbd|placeholder|\[insert|your business name|xxx)\b/i.test(body)) {
    add("blocker", "placeholder", "The page contains placeholder text.");
  }

  const blockers = findings.filter((f) => f.severity === "blocker");

  return {
    findings,
    blockers,
    passes: blockers.length === 0,
    constraints: blockers.map((b) => `- ${b.detail}`).join("\n"),
  };
}
