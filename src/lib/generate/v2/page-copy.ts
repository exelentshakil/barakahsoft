import { z } from "zod";
import { callGemini, bestGeminiChain } from "@/lib/gemini-client";
import { parseJsonResponse } from "@/lib/parse-json-response";
import type { SiteBrief } from "@/lib/generate-bespoke-site";
import { trimToSentence } from "@/lib/text-trim";
import { cleanAboutContent } from "@/lib/clean-about-content";

export { cleanAboutContent };

// The one model call left in the build.
//
// Everything structural is now the application's: the markup, the classes, the
// layout, the palette, the running order. What a model is genuinely good at —
// writing sharp, specific, non-generic copy about a business from its own
// scraped facts — is all that is asked of it here, as JSON, in a single call.
//
// This is why the page cannot come out broken any more. There is no markup for
// it to malform, no stylesheet for it to leave a variable undefined in, no
// dropdown whose closed state it can forget to write. The worst it can do is
// write a dull headline, and a dull headline on a correct page is a fixable
// problem in a way that a beautiful prompt producing a broken page never was.

const S = (min: number, max: number) => z.string().min(min).max(max);
const soft = (max: number) => z.string().max(max).default("");

export const PageCopySchema = z.object({
  hero: z.object({
    eyebrow: S(4, 60),
    headline: S(8, 90),
    /** The phrase inside headline that takes the brand colour. Must appear in it. */
    headlineMark: soft(40),
    subhead: S(20, 260),
    formTitle: S(4, 46),
    formSubtitle: soft(60),
    submitLabel: S(3, 30),
    reassurance: soft(70),
  }),
  trust: z.object({
    stats: z.array(z.object({ value: z.string().max(14), label: z.string().max(30) })).max(4).default([]),
    badges: z.array(z.string().max(34)).max(4).default([]),
  }),
  about: z.object({
    eyebrow: S(4, 60),
    headline: S(8, 80),
    headlineMark: soft(40),
    paragraphs: z.array(S(60, 800)).min(1).max(3),
    founderRole: soft(46),
    /** Wraps the circular seal. Short, three or four words. */
    sealLine: S(6, 54),
    stats: z.array(z.object({ value: z.string().max(14), label: z.string().max(30) })).max(4).default([]),
    ctaLabel: S(3, 30),
  }),
  services: z.object({
    eyebrow: S(4, 60),
    headline: S(8, 80),
    headlineMark: soft(40),
    intro: S(20, 320),
    items: z.array(z.object({ name: S(2, 60), blurb: S(20, 220) })).max(10).default([]),
  }),
  whyUs: z.object({
    eyebrow: S(4, 60),
    headline: S(8, 80),
    intro: S(20, 320),
    points: z.array(z.object({ title: S(3, 40), body: S(30, 300) })).min(2).max(4),
  }),
  process: z.object({
    eyebrow: S(4, 60),
    headline: S(8, 80),
    steps: z.array(z.object({ title: S(3, 44), body: S(20, 260) })).min(3).max(4),
  }),
  gallery: z
    .object({ eyebrow: soft(60), headline: soft(80), captions: z.array(z.string().max(90)).max(10).default([]) })
    .default({ eyebrow: "", headline: "", captions: [] }),
  band: z.object({ headline: S(8, 80), body: S(20, 220), ctaLabel: S(3, 30) }),
  reviews: z.object({ eyebrow: soft(60), headline: soft(90) }).default({ eyebrow: "", headline: "" }),
  // Optional, with defaults: a vertical that disables a section is told its
  // facts are "not supplied" and then, until now, had the whole page thrown
  // away for not writing about them. A section the renderer will never emit
  // must not be able to reject the fifteen that it will.
  areas: z
    .object({ eyebrow: soft(60), headline: soft(80), body: soft(320) })
    .default({ eyebrow: "", headline: "", body: "" }),
  booking: z
    .object({ eyebrow: soft(60), headline: soft(80), headlineMark: soft(40), body: soft(260) })
    .default({ eyebrow: "", headline: "", headlineMark: "", body: "" }),
  // Headers only. The rows underneath are the client's verified entities,
  // rendered verbatim — a price a copy model has "improved" is a number a
  // customer will hold the business to, so it never passes through one.
  pricing: z
    .object({ eyebrow: soft(60), headline: soft(80), headlineMark: soft(40), intro: soft(320), footnote: soft(160) })
    .default({ eyebrow: "", headline: "", headlineMark: "", intro: "", footnote: "" }),
  people: z
    .object({ eyebrow: soft(60), headline: soft(80), headlineMark: soft(40), intro: soft(320) })
    .default({ eyebrow: "", headline: "", headlineMark: "", intro: "" }),
  guarantee: z.object({ eyebrow: S(4, 60), headline: S(8, 80), body: S(30, 420), ctaLabel: S(3, 30) }),
  faq: z.object({
    eyebrow: S(4, 60),
    headline: S(8, 80),
    items: z.array(z.object({ q: S(8, 140), a: S(30, 600) })).min(4).max(14),
  }),
  contact: z.object({
    eyebrow: S(4, 60),
    headline: S(8, 80),
    body: S(20, 320),
    formTitle: S(4, 46),
    formSubtitle: soft(60),
    submitLabel: S(3, 30),
  }),
  footer: z.object({ blurb: S(40, 320), ctaHeadline: S(8, 70), ctaBody: S(15, 200), ctaLabel: S(3, 30) }),
  seo: z.object({ title: S(10, 65), description: S(60, 165) }),
});

export type PageCopy = z.infer<typeof PageCopySchema>;

/** Markup that escaped into copy is never acceptable on a client's page. */
export function looksLikeMarkup(text: string): boolean {
  return /\]\(|!\[|https?:\/\/|<[a-z]+[\s>]/i.test(text);
}

function facts(brief: SiteBrief): string {
  const { nouns, label } = brief.vertical;
  return `- Business: ${brief.businessName}
- Business type: ${brief.industry} (${label})
- What this business sells is called: ${nouns.offeringPlural} (singular: ${nouns.offering})
- Its customers are called: ${nouns.customer}s. A unit of work is a ${nouns.work}.
- Main city: ${brief.city}
- Service areas: ${brief.areas.slice(0, 10).join(", ") || "not supplied"}
- Founder: ${brief.founder ?? "NOT SUPPLIED — never name a person"}
- Phone: ${brief.phone ?? "not supplied"}
- Email: ${brief.email ?? "not supplied"}
- Services, in order: ${brief.services.slice(0, 10).join(" | ") || "not supplied"}
- Primary action wording: ${brief.intent.primaryLabel}
- Rating proof: ${brief.rating && brief.reviewCount ? `${brief.rating} stars from ${brief.reviewCount} reviews` : "NONE — never mention a rating or review count"}
- Real customer reviews: ${brief.reviews.length ? brief.reviews.slice(0, 6).map((r) => `${r.author}: ${r.text.slice(0, 260)}`).join(" || ") : "none"}
- Licensed/insured: ${brief.licensedInsured ? "SUPPORTED — may be stated" : "NOT SUPPORTED — never claim it"}
- What the owner says is wrong with their current site: ${brief.painInstructions.join(" | ") || "not supplied"}
- THEIR OWN STORY, in their words (use this for the about section — the real names, the real history, the real warranty; rewrite it, never invent around it): ${cleanAboutContent(brief.aboutContent) || "none supplied"}
- Scraped fact digest: ${brief.factsDigest.slice(0, 3000)}
${entityBlock(brief)}`;
}

/**
 * The specific things this business has, grouped by kind.
 *
 * The difference between "Reliable Gym in Belfast" and a page that names ten
 * real classes and six membership tiers is entirely here. Every line was read
 * off the client's own site and checked against the page it came from, so
 * these can be used verbatim — which is stated plainly, because the prompt
 * elsewhere spends a lot of words telling the model not to invent, and it
 * needs to know this block is the exception it is allowed to lean on.
 */
function entityBlock(brief: SiteBrief): string {
  if (!brief.entities?.length) return "";

  const byKind = new Map<string, string[]>();
  for (const entity of brief.entities.slice(0, 60)) {
    const line = [
      entity.label,
      entity.price ? `— ${entity.price}${entity.period ? ` per ${entity.period}` : ""}` : "",
      entity.detail ? `(${entity.detail})` : "",
      entity.attributes.length ? `[${entity.attributes.slice(0, 6).join("; ")}]` : "",
    ]
      .filter(Boolean)
      .join(" ");
    byKind.set(entity.kind, [...(byKind.get(entity.kind) ?? []), line]);
  }

  return `
WHAT THIS BUSINESS ACTUALLY HAS — read off their own website and verified against the page it came from.
These are real. Use them by name, use the prices exactly as written, and prefer them over anything generic.
Do not add to these lists, do not round a price, and do not invent a tier or a name to balance a layout.
${[...byKind.entries()].map(([kind, lines]) => `${kind}:\n${lines.map((line) => `  - ${line}`).join("\n")}`).join("\n")}`;
}

/**
 * One line of copy, preferring the vertical's own wording.
 *
 * `{city} {business} {industry} {offering} {offerings} {customer} {work}` are
 * substituted, so a profile writes "Book a {work} with our {offering} team"
 * once and it reads correctly for a gym, a salon and a solicitor.
 */
function verticalLine(brief: SiteBrief, key: string, neutral: string): string {
  const { nouns } = brief.vertical;
  return (brief.vertical.fallback?.[key] ?? neutral)
    .replace(/\{city\}/g, brief.city)
    .replace(/\{business\}/g, brief.businessName)
    .replace(/\{industry\}/g, brief.industry)
    .replace(/\{offering\}/g, nouns.offering)
    .replace(/\{offerings\}/g, nouns.offeringPlural.toLowerCase())
    .replace(/\{customer\}/g, nouns.customer)
    .replace(/\{work\}/g, nouns.work);
}

function fallbackCopy(brief: SiteBrief): PageCopy {
  const city = brief.city;
  const trade = brief.industry;
  const action = brief.intent.primaryLabel;
  const services = brief.services.slice(0, 8);
  const { nouns } = brief.vertical;
  const offering = nouns.offering;
  const offerings = nouns.offeringPlural.toLowerCase();
  const customer = nouns.customer;
  const work = nouns.work;

  /**
   * A line of fallback copy, from the vertical if it has one.
   *
   * This whole function used to be tradesman prose — "straightforward quotes,
   * work done properly", "the site is left tidy", "we come back and put it
   * right" — and it fires whenever the model call fails, which for a while was
   * every hard vertical. A gym shipped with all of it.
   *
   * So every line is now either supplied by the profile (`vertical.fallback`,
   * a field that was declared for exactly this and read by nothing) or a
   * neutral default written to be true of any local business. Nothing here
   * says "quote", "job" or "warranty" unless a profile asks for it.
   */
  const fb = (key: string, neutral: string): string => verticalLine(brief, key, neutral);

  return {
    hero: {
      eyebrow: `${city} ${trade}`.slice(0, 60),
      headline: fb("heroHeadline", `${trade} in ${city}`).slice(0, 90),
      headlineMark: city,
      subhead: fb(
        "heroSubhead",
        `${brief.businessName} looks after ${customer}s in ${city}. Get in touch and speak to someone who can actually help.`
      ).slice(0, 260),
      formTitle: fb("formTitle", action).slice(0, 46),
      formSubtitle: fb("formSubtitle", "No obligation").slice(0, 60),
      submitLabel: action,
      reassurance: fb("reassurance", "We reply the same working day.").slice(0, 70),
    },
    trust: {
      stats: [
        brief.rating ? { value: brief.rating.toFixed(1), label: "Average rating" } : { value: "100%", label: "Local team" },
        { value: brief.reviewCount ? String(brief.reviewCount) : "5\u2605", label: "Customer reviews" },
      ],
      badges: [brief.licensedInsured ? "Licensed & insured" : "Locally owned", "Local team"],
    },
    about: {
      eyebrow: `About ${brief.businessName}`.slice(0, 60),
      headline: fb("aboutHeadline", `A local ${trade.toLowerCase()} you can actually reach`).slice(0, 80),
      headlineMark: "actually reach",
      paragraphs: [
        trimToSentence(
          brief.aboutContent ??
            fb(
              "aboutBody",
              `${brief.businessName} looks after ${customer}s across ${city}, and explains things in plain language rather than jargon.`
            ),
          780
        ),
      ],
      founderRole: brief.founder ? "Founder" : "",
      sealLine: `${city} \u00b7 ${brief.businessName}`.slice(0, 54),
      stats: [],
      ctaLabel: action,
    },
    services: {
      eyebrow: fb("servicesEyebrow", "What we do").slice(0, 60),
      headline: fb("servicesHeadline", `${nouns.offeringPlural} in ${city}`).slice(0, 80),
      headlineMark: city,
      intro: fb("servicesIntro", `What ${brief.businessName} offers ${customer}s across ${city}.`).slice(0, 320),
      items: services.map((name) => ({
        name,
        blurb: fb("offeringBlurb", `${name}, handled by ${brief.businessName}'s own team.`).replace(/\{item\}/g, name),
      })),
    },
    whyUs: {
      eyebrow: "Why us",
      headline: fb("whyUsHeadline", `Why ${customer}s choose us`).slice(0, 80),
      intro: fb("whyUsIntro", `What working with ${brief.businessName} is actually like.`).slice(0, 320),
      points: [
        { title: "Local and accountable", body: `We are based in ${city}, and you can reach us after the ${work} is done.` },
        { title: "Clear from the start", body: "You know what you are getting and what it costs before anything begins." },
        { title: "Our own people", body: "The people you speak to are the people who do the work." },
        { title: "Done properly", body: "The parts nobody sees are the parts we do not cut." },
      ],
    },
    process: {
      eyebrow: "How it works",
      headline: fb("processHeadline", "Three steps, no surprises").slice(0, 80),
      steps: [
        { title: "Get in touch", body: fb("step1", "Call or send the form. We ask a few questions so we understand what you need.") },
        { title: "We come back to you", body: fb("step2", "We confirm what we can do, when, and what it costs.") },
        { title: "We get it done", body: fb("step3", `Booked in and completed, with no chasing on your side.`) },
      ],
    },
    gallery: {
      eyebrow: fb("galleryEyebrow", "Our work").slice(0, 60),
      headline: fb("galleryHeadline", `${brief.businessName} in ${city}`).slice(0, 80),
      captions: [],
    },
    band: {
      headline: fb("bandHeadline", `Looking for a ${trade.toLowerCase()} in ${city}?`).slice(0, 80),
      body: fb("bandBody", "Tell us what you need and we will take it from there.").slice(0, 220),
      ctaLabel: action,
    },
    reviews: { eyebrow: "Reviews", headline: `What our ${customer}s say`.slice(0, 90) },
    areas: {
      eyebrow: "Where we work",
      headline: `${nouns.areaPlural} around ${city}`.slice(0, 80),
      body: `We cover ${brief.areas.slice(0, 6).join(", ") || city} and the area around them. If you are not sure whether we reach you, just ask.`,
    },
    booking: {
      eyebrow: fb("bookingEyebrow", "Get in touch").slice(0, 60),
      headline: fb("bookingHeadline", "Pick a day that suits you").slice(0, 70),
      headlineMark: "suits you",
      body: fb("bookingBody", "Choose a preferred day and we will confirm a time that works for both of us.").slice(0, 260),
    },
    // Headers only, and empty ones are fine: both sections render from
    // verified entities and drop themselves when there are none, so a
    // fallback here is a heading over real rows, never invented rows.
    pricing: {
      eyebrow: fb("pricingEyebrow", "Prices").slice(0, 60),
      headline: fb("pricingHeadline", `${nouns.offeringPlural} and prices`).slice(0, 80),
      headlineMark: "",
      intro: fb("pricingIntro", "Everything is priced up front, so you know what you are paying before you commit.").slice(0, 320),
      footnote: "",
    },
    people: {
      eyebrow: fb("peopleEyebrow", "The team").slice(0, 60),
      headline: fb("peopleHeadline", `The people at ${brief.businessName}`).slice(0, 80),
      headlineMark: "",
      intro: fb("peopleIntro", `The people you will actually deal with in ${city}.`).slice(0, 320),
    },
    guarantee: {
      eyebrow: fb("guaranteeEyebrow", "Our promise").slice(0, 60),
      headline: fb("guaranteeHeadline", "You will know exactly where you stand").slice(0, 80),
      body: fb(
        "guaranteeBody",
        "We tell you what to expect before you commit, and if something is not right we want to hear about it."
      ).slice(0, 420),
      ctaLabel: action,
    },
    faq: {
      eyebrow: "Questions",
      headline: "Frequently asked questions",
      // Built from the vertical's own seed questions rather than ten hardcoded
      // trade ones. The answers are deliberately thin: this path only runs when
      // the model failed, and an honest "ask us" beats an invented specific.
      items: brief.vertical.copy.faqSeeds.slice(0, 10).map((question) => ({
        q: question.slice(0, 140),
        a: fb(
          "faqAnswer",
          `Get in touch and we will answer that properly for your situation — call ${brief.phone ?? "the number on this page"} or send the form and we will come back to you.`
        ).slice(0, 600),
      })),
    },
    contact: {
      eyebrow: "Get in touch",
      headline: `Talk to a real person in ${city}`.slice(0, 80),
      body: fb("contactBody", "Tell us what you need and we will come back to you the same working day.").slice(0, 320),
      formTitle: fb("formTitle", action).slice(0, 46),
      formSubtitle: fb("formSubtitle", "No obligation").slice(0, 60),
      submitLabel: action,
    },
    footer: {
      blurb: fb(
        "footerBlurb",
        `${brief.businessName} is a ${trade.toLowerCase()} in ${city}, looking after ${customer}s across the area.`
      ).slice(0, 320),
      ctaHeadline: "Ready to get started?",
      ctaBody: fb("footerCtaBody", "Speak to us directly, or send the form and we will come to you.").slice(0, 200),
      ctaLabel: action,
    },
    seo: {
      title: `${brief.businessName} | ${trade} in ${city}`.slice(0, 65),
      description: fb(
        "seoDescription",
        `${trade} in ${city}. ${brief.businessName} looks after ${customer}s across the area. Get in touch today.`
      ).slice(0, 165),
    },
  };
}

/**
 * Keep every section the model got right.
 *
 * This was a single all-or-nothing safeParse over ~58 length-constrained
 * fields, so one overlong meta description or one stat value of eleven
 * characters discarded fifteen good sections and dropped the whole page to
 * fallback copy. On a vertical whose fallback was tradesman prose, that is how
 * a gym ended up asking for a quote.
 *
 * Now each top-level section is validated on its own and only the failures are
 * replaced. A bad `seo` block costs the meta description, not the page.
 */
function salvage(raw: unknown, brief: SiteBrief): PageCopy {
  const whole = PageCopySchema.safeParse(raw);
  if (whole.success) return whole.data;

  const fallback = fallbackCopy(brief);
  if (!raw || typeof raw !== "object") {
    console.warn("[page-copy] response was not an object; using grounded fallback");
    return fallback;
  }

  const shape = PageCopySchema.shape as Record<string, z.ZodTypeAny>;
  const source = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const replaced: string[] = [];

  for (const [key, schema] of Object.entries(shape)) {
    const section = schema.safeParse(source[key]);
    if (section.success) {
      out[key] = section.data;
    } else {
      out[key] = (fallback as unknown as Record<string, unknown>)[key];
      replaced.push(key);
    }
  }

  console.warn(
    `[page-copy] kept ${Object.keys(shape).length - replaced.length}/${Object.keys(shape).length} sections; ` +
      `fell back on: ${replaced.join(", ") || "none"}`
  );

  // If almost nothing survived, the response was junk rather than slightly off
  // — say so plainly rather than shipping a stitched-together page.
  if (replaced.length > Object.keys(shape).length / 2) {
    console.warn("[page-copy] more than half the sections failed; using grounded fallback throughout");
    return fallback;
  }

  return out as unknown as PageCopy;
}

/**
 * What each slot means on THIS page.
 *
 * The vertical's briefs describe an industry and are the floor. A composed
 * section carries the reference site's own purpose for that slot, which is
 * about this page specifically, so it wins where both exist. Without either,
 * the model reads the slot name literally — which is how "gallery" became
 * "recent projects" and "guarantee" became a warranty on workmanship, on a
 * gym.
 */
function sectionMeanings(brief: SiteBrief, composed: { id: string; kind: string; purpose: string }[]): string {
  const meanings = new Map<string, string>(Object.entries(brief.vertical.copy.sectionBriefs));
  for (const section of composed) {
    if (section.purpose?.trim()) {
      meanings.set(section.id, `${section.purpose.trim()} (this page calls it "${section.kind}")`);
    }
  }
  return [...meanings.entries()].map(([slot, meaning]) => `- ${slot}: ${meaning}`).join("\n");
}

/**
 * One phone number on the page.
 *
 * The model writes prose, and prose about a local business tends to contain
 * its phone number — "call us on ...". It takes that number from whatever is
 * in its context, which is not always the number the page's own buttons dial:
 * a site's scraped footer number and its Google listing number are often
 * different, and one shipped with 07940381665 in every button and
 * 07394 091107 in the FAQ and the contact lede.
 *
 * A prospect reading two numbers on one page does not conclude that one of
 * them is stale. They conclude the page is not really theirs, which is the
 * one thing a mockup cannot afford to say.
 *
 * So every phone-shaped run in the copy is rewritten to the number the page
 * actually dials. Ten digits minimum, so prices, dates, postcodes and "open
 * 6am to 9pm" are left alone.
 */
export function unifyPhoneNumbers<T>(copy: T, canonical: string | null): T {
  if (!canonical) return copy;
  const phoneish = /(?:\+?\d[\d\s().-]{8,}\d)/g;

  const fix = (value: string): string =>
    value.replace(phoneish, (match) => {
      const digits = match.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) return match;
      return digits === canonical.replace(/\D/g, "") ? match : canonical;
    });

  const walk = (node: unknown): unknown => {
    if (typeof node === "string") return fix(node);
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === "object") {
      return Object.fromEntries(Object.entries(node as Record<string, unknown>).map(([k, v]) => [k, walk(v)]));
    }
    return node;
  };

  return walk(copy) as T;
}

export async function generatePageCopy(
  brief: SiteBrief,
  tone: string,
  /**
   * The sections this page is actually being built from, with the reference
   * site's own description of what each is for.
   *
   * More specific than the vertical's `sectionBriefs`, which describe a whole
   * industry: this describes THIS page. When a reference gym page's second
   * section is "membership-tiers — the three ways to join, priced", that is a
   * far better instruction for the `services` slot than "the services this
   * business sells".
   */
  composed: { id: string; kind: string; purpose: string }[] = []
): Promise<PageCopy> {
  const prompt = `Write every piece of copy for one local business homepage. You are writing WORDS ONLY —
the page, its layout and its styling already exist and are not yours to change. Return JSON.

THE BUSINESS
${facts(brief)}

TONE FOR THIS PAGE: ${tone}

HOW TO WRITE
- Write to the customer, about their problem, in their language. Never about "us" first.
- Specific beats clever. "We answer the phone" beats "unrivalled customer service".
- Never invent a fact. No made-up years in business, no invented certifications, no numbers that
  were not supplied, no reviews you wrote yourself, no founder name unless one is supplied above.
- Never write: unlock, elevate, seamless, dive in, in today's world, look no further, we pride
  ourselves, your trusted partner, one-stop shop.
${brief.vertical.copy.forbiddenSlop.map((rule) => `- Never write: ${rule}.`).join("\n")}
${brief.vertical.copy.voiceRules.map((rule) => `- ${rule}`).join("\n")}

WHAT THIS PAGE IS FOR
${brief.vertical.cta.guidance}
- headlineMark must be a phrase copied EXACTLY from its headline — it gets the brand colour.
- The hero headline is the most important sentence on the page. Short, concrete, about the outcome
  the customer wants. Under nine words if you can.
- Write ${brief.vertical.copy.faqSeeds.length} FAQ answers. Real answers, two or three sentences, the way the owner would actually
  reply on the phone. Never "contact us for details" as an entire answer.
- Service blurbs say what the customer gets, not what the trade is called.
- The whyUs points must be things a competitor could NOT also claim, drawn from the facts above.
- about.paragraphs must be a rewrite of THEIR OWN STORY above — the same names, the same history,
  the same guarantee, in better prose. Two paragraphs. If they gave you a founder's background, a
  reason the company was started, or a warranty, all three belong in it. Do not replace it with
  generic "we are a local family business" copy.
- Stats: only numbers supported by the facts. If none are, use "100%" style qualitative values with
  honest labels, or return an empty array.

Return STRICT JSON matching this shape exactly, no markdown fence, no commentary:
{"hero":{"eyebrow":"","headline":"","headlineMark":"","subhead":"","formTitle":"","formSubtitle":"","submitLabel":"","reassurance":""},
"trust":{"stats":[{"value":"","label":""}],"badges":[""]},
"about":{"eyebrow":"","headline":"","headlineMark":"","paragraphs":["",""],"founderRole":"","sealLine":"","stats":[{"value":"","label":""}],"ctaLabel":""},
"services":{"eyebrow":"","headline":"","headlineMark":"","intro":"","items":[{"name":"","blurb":""}]},
"whyUs":{"eyebrow":"","headline":"","intro":"","points":[{"title":"","body":""}]},
"process":{"eyebrow":"","headline":"","steps":[{"title":"","body":""}]},
"gallery":{"eyebrow":"","headline":"","captions":[""]},
"band":{"headline":"","body":"","ctaLabel":""},
"reviews":{"eyebrow":"","headline":""},
"areas":{"eyebrow":"","headline":"","body":""},
"booking":{"eyebrow":"","headline":"","headlineMark":"","body":""},
"pricing":{"eyebrow":"","headline":"","headlineMark":"","intro":"","footnote":""},
"people":{"eyebrow":"","headline":"","headlineMark":"","intro":""},
"guarantee":{"eyebrow":"","headline":"","body":"","ctaLabel":""},
"faq":{"eyebrow":"","headline":"","items":[{"q":"","a":""}]},
"contact":{"eyebrow":"","headline":"","body":"","formTitle":"","formSubtitle":"","submitLabel":""},
"footer":{"blurb":"","ctaHeadline":"","ctaBody":"","ctaLabel":""},
"seo":{"title":"","description":""}}

services.items must have one entry per supplied service, in the supplied order, using the supplied
name verbatim.

pricing and people are HEADINGS ONLY. The rows beneath them are the verified facts listed above and
are printed exactly as found — you are writing the heading over a table you cannot see the inside of.
Never write a price, a package name or a person\'s name into these fields. If the facts above list no
prices or no named people, leave that block\'s strings empty; the section will not be built.

LENGTHS — these are enforced, and anything outside them is rejected:
hero.headline 8-90 · hero.subhead 20-260 · about.paragraphs 60-800 EACH, one or two of them
services.intro 20-320 · service blurb 20-220 · whyUs body 30-300 · process body 20-260
faq answer 30-600 · footer.blurb 40-320 · seo.title 10-65 · seo.description 60-165
Stat values are 14 characters at most, so write "4.9" or "200+", never "Since 2011 in Belfast".
Leave a section empty ("") rather than padding it if the facts do not support it.

WHAT EACH SECTION MEANS FOR THIS BUSINESS
The slot names below are structural. Read them as described here, not as the words suggest.
${sectionMeanings(brief, composed)}

faq.items: these are the TOPICS to cover, in this order — not the wording to reuse. Each profile serves a
whole macro-ICP, so a seed is written for the middle of it and will use the wrong nouns for this particular
business. Re-ask each one the way THIS owner's customers would ask it, in their vocabulary, then answer it
in the owner's voice. A gym asked "can I request a particular stylist or therapist?" is a page that was
obviously written for somebody else.
${brief.vertical.copy.faqSeeds.map((question, index) => `${index + 1}. ${question}`).join("\n")}

whyUs.points: four. process.steps: three or four.`;

  const chain = bestGeminiChain();
  const raw = await callGemini(prompt, chain[0], undefined, {
    modelChain: chain,
    maxTokens: 24000,
    temperature: 0.72,
    timeoutMs: 260_000,
    system: `${brief.vertical.copy.persona} You never invent facts, and you return valid JSON only.`,
  });

  if (!raw) {
    console.warn("[page-copy] the copy call returned nothing; using grounded fallback copy");
    return fallbackCopy(brief);
  }

  const copy = salvage(parseJsonResponse(raw), brief);

  // A model handed messy source sometimes echoes it. The about section is the
  // one place that happens, and raw markdown on a client's page is worse than
  // plainer prose, so it is replaced rather than shipped.
  const story = cleanAboutContent(brief.aboutContent);
  if (copy.about.paragraphs.some(looksLikeMarkup)) {
    console.warn("[page-copy] the about copy contained raw markup; substituting the cleaned story");
    copy.about.paragraphs = story
      ? [trimToSentence(story, 780)]
      : [
          verticalLine(
            brief,
            "aboutParagraph",
            `{business} looks after {customer}s across {city}, and explains what they do in plain language.`
          ),
        ];
  }

  // The service list is the client's, not the model's.
  const supplied = brief.services.slice(0, 10);
  if (supplied.length > 0) {
    const byName = new Map(copy.services.items.map((item) => [item.name.toLowerCase(), item.blurb]));
    copy.services.items = supplied.map((name) => ({
      name,
      blurb:
        byName.get(name.toLowerCase()) ??
        verticalLine(brief, "offeringBlurb", "{item}, handled by our own team.").replace(/\{item\}/g, name),
    }));
  }

  // Last, so it also covers the vertical fallback lines substituted above.
  return unifyPhoneNumbers(copy, brief.phone ?? null);
}
