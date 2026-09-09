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
    stats: z.array(z.object({ value: S(1, 10), label: S(3, 30) })).max(4).default([]),
    badges: z.array(S(3, 34)).max(4).default([]),
  }),
  about: z.object({
    eyebrow: S(4, 60),
    headline: S(8, 80),
    headlineMark: soft(40),
    paragraphs: z.array(S(60, 800)).min(1).max(3),
    founderRole: soft(46),
    /** Wraps the circular seal. Short, three or four words. */
    sealLine: S(6, 54),
    stats: z.array(z.object({ value: S(1, 10), label: S(3, 30) })).max(4).default([]),
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
  gallery: z.object({ eyebrow: S(4, 60), headline: S(8, 80), captions: z.array(S(6, 90)).max(10).default([]) }),
  band: z.object({ headline: S(8, 80), body: S(20, 220), ctaLabel: S(3, 30) }),
  reviews: z.object({ eyebrow: S(4, 60), headline: S(8, 90) }),
  areas: z.object({ eyebrow: S(4, 60), headline: S(8, 80), body: S(20, 320) }),
  booking: z.object({ eyebrow: S(4, 60), headline: S(8, 70), headlineMark: soft(40), body: S(20, 260) }),
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
- Scraped fact digest: ${brief.factsDigest.slice(0, 3000)}`;
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
  const fb = (key: string, neutral: string): string => {
    const supplied = brief.vertical.fallback?.[key];
    return (supplied ?? neutral)
      .replace(/\{city\}/g, city)
      .replace(/\{business\}/g, brief.businessName)
      .replace(/\{industry\}/g, trade)
      .replace(/\{offering\}/g, offering)
      .replace(/\{offerings\}/g, offerings)
      .replace(/\{customer\}/g, customer)
      .replace(/\{work\}/g, work);
  };

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

export async function generatePageCopy(brief: SiteBrief, tone: string): Promise<PageCopy> {
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
"guarantee":{"eyebrow":"","headline":"","body":"","ctaLabel":""},
"faq":{"eyebrow":"","headline":"","items":[{"q":"","a":""}]},
"contact":{"eyebrow":"","headline":"","body":"","formTitle":"","formSubtitle":"","submitLabel":""},
"footer":{"blurb":"","ctaHeadline":"","ctaBody":"","ctaLabel":""},
"seo":{"title":"","description":""}}

services.items must have one entry per supplied service, in the supplied order, using the supplied
name verbatim.

WHAT EACH SECTION MEANS FOR THIS BUSINESS
The slot names below are structural. Read them as described here, not as the words suggest.
${Object.entries(brief.vertical.copy.sectionBriefs)
  .map(([slot, meaning]) => `- ${slot}: ${meaning}`)
  .join("\n")}

faq.items: answer each of these, in this order, in the owner's own voice:
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

  const parsed = PageCopySchema.safeParse(parseJsonResponse(raw));
  if (!parsed.success) {
    // A page with honest, slightly plainer copy beats no page at all, and the
    // fallback is written from the same real facts.
    console.warn("[page-copy] copy failed validation; using grounded fallback", parsed.error.flatten().fieldErrors);
    return fallbackCopy(brief);
  }

  // A model handed messy source sometimes echoes it. The about section is the
  // one place that happens, and raw markdown on a client's page is worse than
  // plainer prose, so it is replaced rather than shipped.
  const story = cleanAboutContent(brief.aboutContent);
  if (parsed.data.about.paragraphs.some(looksLikeMarkup)) {
    console.warn("[page-copy] the about copy contained raw markup; substituting the cleaned story");
    parsed.data.about.paragraphs = story
      ? [trimToSentence(story, 780)]
      : [`${brief.businessName} works with homeowners and businesses across ${brief.city}, doing ${brief.industry.toLowerCase()} properly and explaining it in plain language.`];
  }

  // The service list is the client's, not the model's.
  const supplied = brief.services.slice(0, 10);
  if (supplied.length > 0) {
    const byName = new Map(parsed.data.services.items.map((item) => [item.name.toLowerCase(), item.blurb]));
    parsed.data.services.items = supplied.map((name) => ({
      name,
      blurb: byName.get(name.toLowerCase()) ?? `${name} carried out by our own team, quoted clearly before any work starts.`,
    }));
  }

  return parsed.data;
}
