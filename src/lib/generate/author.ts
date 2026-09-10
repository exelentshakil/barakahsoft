// Authoring the page. Two calls, both composing freely on top of the compiled
// design system.
//
// The split is not stylistic. A homepage plus its stylesheet is 30-40k output
// tokens, which will not finish inside one Vercel invocation; each call is its
// own Inngest step. It also buys a real correctness property: the body is
// written against a stylesheet that already exists, so the classes it uses
// resolve instead of being invented and rendering as nothing.
//
// What the model owns here is everything visual — structure, markup, class
// names, its own CSS and its own JS. What it does not own is any literal
// value, because those are already solved; see TOKEN_CONTRACT.

import { z } from "zod";
import { callDesignModel } from "@/lib/generate/model";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { DESIGN_LAW, TOKEN_CONTRACT, MECHANISM_CONTRACT } from "@/lib/design/law";
import { prdToMarkdown, type Prd } from "@/lib/generate/prd";

export interface MediaAsset {
  slot: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  aspect: string;
}

export interface AuthorInput {
  prd: Prd;
  businessName: string;
  city: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  services: string[];
  areas: string[];
  /** Verified facts as printable lines. Printed exactly, never rounded. */
  facts: string[];
  reviews: Array<{ author: string; rating: number; text: string }>;
  media: MediaAsset[];
  logoUrl: string | null;
  /** Whether inner pages exist yet, so links are real rather than dead. */
  innerPagesBuilt: boolean;
}

const ChromeSchema = z.object({
  nav: z.string().min(40),
  footer: z.string().min(40),
  css: z.string().default(""),
  js: z.string().default(""),
});

const BodySchema = z.object({
  sections: z
    .array(z.object({ id: z.string().min(1).max(48), label: z.string().max(80).default(""), html: z.string().min(30) }))
    .min(1),
  cssAdditions: z.string().default(""),
  js: z.string().default(""),
});

export type Chrome = z.infer<typeof ChromeSchema>;
export type Body = z.infer<typeof BodySchema>;

function contextBlock(input: AuthorInput): string {
  return [
    `THE BUSINESS`,
    `${input.businessName}${input.city ? ` — ${input.city}` : ""}`,
    input.phone ? `Phone: ${input.phone}` : "",
    input.email ? `Email: ${input.email}` : "",
    input.address ? `Address: ${input.address}` : "",
    input.logoUrl ? `Logo: ${input.logoUrl}` : "",
    input.services.length ? `Services: ${input.services.join(", ")}` : "",
    input.areas.length ? `Areas: ${input.areas.join(", ")}` : "",
    ``,
    input.facts.length ? `VERIFIED FACTS — print exactly as written, never round a price\n${input.facts.map((f) => `- ${f}`).join("\n")}\n` : "",
    input.reviews.length
      ? `REAL REVIEWS — quote verbatim or not at all\n${input.reviews.slice(0, 6).map((r) => `- ${r.author} (${r.rating}): ${r.text.slice(0, 220)}`).join("\n")}\n`
      : "",
    `PHOTOGRAPHS — the only image URLs that exist. Each <img> keeps its data-slot.`,
    input.media.length
      ? input.media.map((m) => `- slot="${m.slot}" ${m.aspect} ${m.width}x${m.height} src="${m.url}" alt="${m.alt}"`).join("\n")
      : "- none; compose typographically rather than leaving empty frames",
    ``,
    input.innerPagesBuilt
      ? `Inner pages exist. Navigation may link to /services, /about, /contact and per-service pages.`
      : `Inner pages do NOT exist yet. Every navigation link is an in-page anchor (#section-id). A link to a page that is not there is worse than no link.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Why a response could not be used, in enough detail to act on.
 *
 * "did not return a usable brief" with an undefined issue list is what a
 * failed JSON.parse looks like, and it says nothing about whether the model
 * refused, wrapped the object in prose, or was cut off mid-object. The tail
 * matters most: a response that ends without its closing brace was truncated,
 * which is a token budget problem, not a prompt problem.
 */
function describeFailure(raw: string | null, issues?: unknown): string {
  if (!raw) return "no response from the model";
  const trimmed = raw.trim();
  if (issues) return `schema: ${JSON.stringify(issues)}`;
  const truncated = !/[}\]]\s*$/.test(trimmed);
  return [
    truncated ? "TRUNCATED — the response does not end on a closing brace, so raise maxTokens" : "did not parse as JSON",
    `${trimmed.length} chars`,
    `starts: ${trimmed.slice(0, 120).replace(/\s+/g, " ")}`,
    `ends: ${trimmed.slice(-120).replace(/\s+/g, " ")}`,
  ].join(" · ");
}

export async function authorChrome(input: AuthorInput): Promise<Chrome | null> {
  const prompt = [
    `Write the navigation and footer for one bespoke homepage, and any CSS and JS they need.`,
    ``,
    `THE BRIEF YOU ARE BUILDING`,
    prdToMarkdown(input.prd),
    ``,
    contextBlock(input),
    ``,
    DESIGN_LAW,
    ``,
    TOKEN_CONTRACT,
    ``,
    MECHANISM_CONTRACT,
    ``,
    `The navigation anchors to these sections: ${input.prd.sections.map((s) => `#${s.id}`).join(" ")}`,
    ``,
    `The chrome is the first and last thing anyone sees, so it carries the organising idea too. A default centred logo with five links beside it is the timid answer.`,
    `Your CSS is scoped under .bespoke-page automatically; write selectors as if that is the root.`,
    `Your JS runs in a scoped IIFE with no access to cookies, storage or the network. Use it for presentation only — the quote modal and lead form are already implemented.`,
    ``,
    `Return JSON: {"nav":"<header>…</header>","footer":"<footer>…</footer>","css":"…","js":"…"}`,
  ].join("\n");

  const raw = await callDesignModel(
    prompt,
    {
      system: "You are a designer who writes production HTML and CSS. You compose freely and you never type a literal value. You return valid JSON only.",
      maxTokens: 16000,
      temperature: 0.8,
      timeoutMs: 200_000,
      label: "author:chrome",
    }
  );

  const parsed = raw ? parseJsonResponse(raw) : null;
  const result = parsed ? ChromeSchema.safeParse(parsed) : null;
  if (!result?.success) {
    console.warn(`[author:chrome] unusable — ${describeFailure(raw, result?.error?.issues?.slice(0, 2))}`);
    return null;
  }
  return result.data;
}

export async function authorBody(input: AuthorInput, systemCss: string, chromeCss: string): Promise<Body | null> {
  const prompt = [
    `Write the body of one bespoke homepage: every section, in order, as HTML.`,
    ``,
    `THE BRIEF YOU ARE BUILDING`,
    prdToMarkdown(input.prd),
    ``,
    contextBlock(input),
    ``,
    DESIGN_LAW,
    ``,
    TOKEN_CONTRACT,
    ``,
    MECHANISM_CONTRACT,
    ``,
    `THE STYLESHEET THAT ALREADY EXISTS`,
    `These rules are live on the page. Compose with them; add CSS only for what they do not cover.`,
    "```css",
    // The token block is thousands of characters of derived values and the
    // model needs the vocabulary, not the numbers — it is forbidden from
    // typing them anyway. Sending the selectors alone keeps the prompt honest
    // and leaves budget for the page itself.
    systemCss.replace(/\.bespoke-page\{--[^}]*\}/g, ".bespoke-page{ /* the compiled tokens, listed above */ }"),
    chromeCss.slice(0, 4000),
    "```",
    ``,
    `Write exactly these sections, in this order, each as a top-level <section> carrying that id:`,
    input.prd.sections.map((s, i) => `${i + 1}. id="${s.id}" — ${s.kind}, on ${s.ground}. ${s.purpose} Composition: ${s.composition}`).join("\n"),
    ``,
    `Put the ground class on the section itself so its text colour comes with it.`,
    `Sections must not all be the same shape. Vary composition, vary ground, and honour the ambition floor — the hero at 85vh with twelve words or fewer, three full-bleed moments, one deliberate grid break, one image at 70vh or taller.`,
    ``,
    `MOTION IS REQUIRED, not optional. Put data-reveal on at least six elements across the page — section headings, image frames, the rows of any list — with data-reveal-delay on siblings so they stagger. A page with nothing bound to motion reads as static and is sent back as timid. The application implements the behaviour; you only mark what should move.`,
    ``,
    `Body copy sits inside class="measure" so it lands at the compiled line length. A paragraph in a narrow column without it comes out at forty characters and reads as a column of fragments.`,
    ``,
    `Return JSON: {"sections":[{"id","label","html"}],"cssAdditions":"…","js":"…"}`,
    `"html" is the complete <section> element. "cssAdditions" is appended to the stylesheet, so a class you invent is a class you also write a rule for.`,
  ].join("\n");

  const raw = await callDesignModel(
    prompt,
    {
      system: "You are a designer who writes production HTML and CSS. You compose freely and you never type a literal value. You return valid JSON only.",
      maxTokens: 32000,
      temperature: 0.82,
      // The body is the longest generation in the pipeline; the client's 150s
      // default is not enough for it and every call was timing out after the
      // PRD and chrome had already been paid for.
      timeoutMs: 280_000,
      label: "author:body",
    }
  );

  const parsed = raw ? parseJsonResponse(raw) : null;
  const result = parsed ? BodySchema.safeParse(parsed) : null;
  if (!result?.success) {
    console.warn(`[author:body] unusable — ${describeFailure(raw, result?.error?.issues?.slice(0, 2))}`);
    return null;
  }

  // The PRD's order is the page's order. A model that returns them shuffled,
  // or invents one, would otherwise silently change the composition the brief
  // committed to and the audit measured against.
  const wanted = new Map(result.data.sections.map((section) => [section.id, section]));
  const ordered = input.prd.sections
    .map((section) => wanted.get(section.id))
    .filter((section): section is Body["sections"][number] => Boolean(section));

  return { ...result.data, sections: ordered.length ? ordered : result.data.sections };
}
