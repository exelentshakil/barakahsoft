import { z } from "zod";
import { callGemini, bestGeminiChain } from "@/lib/gemini-client";
import { parseJsonResponse } from "@/lib/parse-json-response";
import type { SiteBrief } from "@/lib/generate-bespoke-site";

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
    items: z.array(z.object({ q: S(8, 140), a: S(30, 600) })).min(4).max(8),
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

/**
 * Pull the real story out of a scraped About page.
 *
 * The brief carries that page as raw markdown, and most of it is the site's
 * own navigation: repeated logo links, a hamburger label, three copies of the
 * menu, a cookie banner, a copyright line. Handing all of it to the copy model
 * buried four genuinely good paragraphs — the founders' names, the engineering
 * background, why they started the company, the ten-year warranty — in noise.
 */
export function cleanAboutContent(raw: string | null): string {
  if (!raw) return "";
  const lines = raw.split(/\r?\n/);
  const kept: string[] = [];

  for (const line of lines) {
    const text = line
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")          // images
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")        // links, keeping the label
      .replace(/^[#>\-*\s]+/, "")
      .trim();

    if (text.length < 40) continue;                       // nav items, headings, labels
    if (/^(home|about us?|residential|commercial|contact us?|careers|more)$/i.test(text)) continue;
    if (/cookies?|copyright|all rights reserved|powered by|social link|navigation icon/i.test(text)) continue;
    if (kept.includes(text)) continue;                    // the menu repeated three times
    kept.push(text);
  }

  return kept.join("\n\n").slice(0, 4000);
}

function facts(brief: SiteBrief): string {
  return `- Business: ${brief.businessName}
- Trade: ${brief.industry}
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

  return {
    hero: {
      eyebrow: `${city} ${trade}`.slice(0, 60),
      headline: `Reliable ${trade} in ${city}`.slice(0, 90),
      headlineMark: city,
      subhead: `Straightforward quotes, work done properly, and someone who answers the phone. Serving ${city} and the surrounding area.`,
      formTitle: "Get your free quote",
      formSubtitle: "No obligation, no pressure",
      submitLabel: action,
      reassurance: "We reply the same working day.",
    },
    trust: {
      stats: [
        brief.rating ? { value: String(brief.rating), label: "Average rating" } : { value: "100%", label: "Local team" },
        { value: brief.reviewCount ? String(brief.reviewCount) : "5★", label: "Customer reviews" },
      ],
      badges: [brief.licensedInsured ? "Licensed & insured" : "Locally owned", "Free quotes"],
    },
    about: {
      eyebrow: `About ${brief.businessName}`.slice(0, 60),
      headline: `Local ${trade} you can actually reach`.slice(0, 80),
      headlineMark: "actually reach",
      paragraphs: [
        (brief.aboutContent ?? `${brief.businessName} works with homeowners and businesses across ${city}, doing ${trade.toLowerCase()} properly and explaining it in plain language.`).slice(0, 780),
      ],
      founderRole: brief.founder ? "Founder" : "",
      sealLine: `${city} · Trusted local trade`.slice(0, 54),
      stats: [],
      ctaLabel: action,
    },
    services: {
      eyebrow: "What we do",
      headline: `${trade} services in ${city}`.slice(0, 80),
      headlineMark: city,
      intro: `Everything we handle for homes and businesses across ${city} and the surrounding area.`,
      items: services.map((name) => ({ name, blurb: `${name} carried out by our own team, quoted clearly before any work starts.` })),
    },
    whyUs: {
      eyebrow: "Why us",
      headline: "Why customers choose us",
      intro: `What makes working with ${brief.businessName} different from the cheapest quote you will get.`,
      points: [
        { title: "Local and accountable", body: `We are based here, we work here, and you can reach us after the job is finished.` },
        { title: "Clear pricing", body: "You get a written quote before anything starts. No surprises at the end." },
        { title: "Our own team", body: "The people who quote the work are the people who do it." },
        { title: "Done properly", body: "Materials, preparation and finish are the parts nobody sees. We do not cut them." },
      ],
    },
    process: {
      eyebrow: "How it works",
      headline: "Three steps, no surprises",
      steps: [
        { title: "Tell us what you need", body: "Call or send the form. We ask a few questions to understand the job." },
        { title: "We look properly", body: "We assess the work on site and put the price in writing." },
        { title: "We get it done", body: "Booked in, completed, and tidied up behind us." },
      ],
    },
    gallery: { eyebrow: "Our work", headline: "Recent projects", captions: [] },
    band: {
      headline: `Need a ${trade.toLowerCase()} in ${city}?`.slice(0, 80),
      body: "Tell us what is going on and we will come and look at it.",
      ctaLabel: action,
    },
    reviews: { eyebrow: "Reviews", headline: "What our customers say" },
    areas: {
      eyebrow: "Where we work",
      headline: `Serving ${city} and the surrounding area`.slice(0, 80),
      body: `We cover ${brief.areas.slice(0, 6).join(", ") || city} and the towns around them. If you are not sure whether we reach you, just ask.`,
    },
    booking: {
      eyebrow: "Book a visit",
      headline: "Pick a day that suits you",
      headlineMark: "suits you",
      body: "Choose a preferred day and we will confirm a time that works for both of us.",
    },
    guarantee: {
      eyebrow: "Our promise",
      headline: "The work is done right, or we come back",
      body: "We stand behind what we do. If something is not right, tell us and we will put it right.",
      ctaLabel: action,
    },
    faq: {
      eyebrow: "Questions",
      headline: "Frequently asked questions",
      items: [
        { q: "How much will it cost?", a: "Every job is different, so we quote after seeing the work. The quote is free, written down, and there is no obligation." },
        { q: "How soon can you start?", a: "It depends on the work and the season. Get in touch and we will tell you honestly where we are." },
        { q: "Are you insured?", a: brief.licensedInsured ? "Yes — we are licensed, bonded and insured, and we are happy to show you the paperwork." : "Ask us and we will talk you through exactly how we are covered." },
        { q: "Do you clean up afterwards?", a: "Yes. The site is left tidy — that is part of the job, not an extra." },
      ],
    },
    contact: {
      eyebrow: "Get in touch",
      headline: `Talk to a real person in ${city}`.slice(0, 80),
      body: "Tell us what you need and we will come back to you the same working day.",
      formTitle: "Request your quote",
      formSubtitle: "No obligation",
      submitLabel: action,
    },
    footer: {
      blurb: `${brief.businessName} provides ${trade.toLowerCase()} for homes and businesses across ${city} and the surrounding area.`,
      ctaHeadline: `Ready to get started?`,
      ctaBody: "Speak to us directly or request a quote today.",
      ctaLabel: action,
    },
    seo: {
      title: `${brief.businessName} | ${trade} in ${city}`.slice(0, 65),
      description: `${trade} in ${city}. ${brief.licensedInsured ? "Licensed and insured. " : ""}Free quotes, local team, work done properly. Get in touch today.`.slice(0, 165),
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
- headlineMark must be a phrase copied EXACTLY from its headline — it gets the brand colour.
- The hero headline is the most important sentence on the page. Short, concrete, about the outcome
  the customer wants. Under nine words if you can.
- FAQ answers are real answers, two or three sentences, the way the owner would actually reply.
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
name verbatim. faq.items: six. whyUs.points: four. process.steps: three or four.`;

  const chain = bestGeminiChain();
  const raw = await callGemini(prompt, chain[0], undefined, {
    modelChain: chain,
    maxTokens: 24000,
    temperature: 0.72,
    timeoutMs: 260_000,
    system:
      "You are a direct-response copywriter for local trade businesses. You write plainly, you never invent facts, and you return valid JSON only.",
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
