import { z } from "zod";
import { callOpenAI } from "@/lib/openai-client";
import { parseJsonResponse } from "@/lib/parse-json-response";
import type { SiteBrief } from "@/lib/generate-bespoke-site";
import type { DesignDna } from "@/lib/design-dna";

// The copy pass — what the page SAYS, decided before anything decides how
// it looks.
//
// Asking one call to do voice and layout together produced pages that
// narrated the brief instead of selling: headings like "Five clear
// electrical service paths", "Direct contact, posted hours, local address",
// and — on a customer-facing page — "YORK ELECTRICAL CONTRACTORS lists
// these exact services". That is a model describing its own input.
//
// The cause was a grounding instruction that had over-corrected. Repeating
// "never invent anything" hard enough makes a model retreat to only what it
// can literally cite, and citation is not persuasion. The rule that works
// is narrower and truer: every FACT must be true, the FRAMING is the
// writer's job. A roofer's page may say "we answer the phone at 2am"
// because the hours say 24/7; it may not say "trusted since 1994" unless
// something says 1994.

// Length limits TRUNCATE rather than reject.
//
// A strict max meant one over-long heading threw away the entire copy plan
// and failed the whole build, which is an absurd trade: the other nineteen
// fields were fine. Creative output overshoots limits routinely, so limits
// here shape the result instead of gating it.
const capped = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim().slice(0, max) : v),
    z.string().min(1)
  ) as z.ZodType<string>;

// The section id is normalised rather than enumerated. A model asked for
// "services" will sometimes answer "our-services" or "what we do", and
// rejecting the whole plan over a synonym is not a useful standard.
const SECTION_IDS = ["services", "about", "reviews", "areas", "faq", "contact", "proof", "process"] as const;
type SectionId = (typeof SECTION_IDS)[number];

const SectionIdSchema = z.preprocess((v) => {
  const raw = String(v ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const exact = SECTION_IDS.find((id) => raw === id);
  if (exact) return exact;
  const partial = SECTION_IDS.find((id) => raw.includes(id) || id.includes(raw));
  if (partial) return partial;
  if (/testimonial|review|proof|rating/.test(raw)) return "reviews";
  if (/area|location|serve|coverage/.test(raw)) return "areas";
  if (/why|story|team|history/.test(raw)) return "about";
  if (/question|answer/.test(raw)) return "faq";
  if (/step|how|work/.test(raw)) return "process";
  return "about";
}, z.enum(SECTION_IDS)) as z.ZodType<SectionId>;

const SectionSchema = z.object({
  id: SectionIdSchema,
  eyebrow: capped(60),
  heading: capped(140),
  body: capped(900),
  bullets: z.array(capped(220)).max(8).default([]),
});

export const CopyPlanSchema = z.object({
  /** The promise, in the customer's language. Never the legal entity name. */
  headline: capped(140),
  subhead: capped(400),
  heroCta: capped(48),
  /** Short, meaningful trust chips. Each must be a real, verifiable fact. */
  trustChips: z.array(capped(70)).max(6).default([]),
  // A plan with fewer sections is still a usable page; failing the build over
  // it is not.
  sections: z.array(SectionSchema).min(1).max(9),
  services: z
    .array(z.object({ name: capped(120), blurb: capped(320) }))
    .max(12)
    .default([]),
  faq: z.array(z.object({ question: capped(200), answer: capped(900) })).min(8).max(16).default([]),
  closing: z.object({
    heading: capped(140),
    body: capped(500),
    cta: capped(48),
  }),
});

export type CopyPlan = z.infer<typeof CopyPlanSchema>;

// Observed slop, not hypothetical. Every one of these appeared in real
// generated output and each is banned by example rather than by category,
// because "avoid generic copy" is an instruction models agree with and
// then ignore.
const BANNED_PATTERNS = `
- Counting things in a heading: "Five clear service paths", "Three ways we help", "Our 6 services"
- Narrating the source data: "lists these exact services", "posted hours", "verified details", "real business details", "based on available information"
- Naming the section instead of saying something: "Direct contact, posted hours, local address", "Specifics customers can act on", "Service area named for the business"
- The legal entity name as the main headline, especially in capitals
- Filler virtue claims: "quality workmanship", "customer satisfaction is our priority", "we go the extra mile", "your trusted local partner", "committed to excellence", "second to none"
- Numbers presented as statistics without meaning, e.g. a stat block reading "24" for "open 24 hours"
- Describing the website itself: "each service links to its own page", "browse our services below"
`;

function voiceFor(dna: DesignDna): string {
  switch (dna.mood) {
    case "dark-premium":
      return "Confident and understated. Short sentences. The tone of a firm that does not need to oversell.";
    case "light-editorial":
      return "Clear, warm and human. Plain words. Reads like a person wrote it, not a marketing department.";
    case "warm-craft":
      return "Personal and grounded, with real pride in the work. First person plural is welcome.";
    case "clinical-trust":
      return "Precise, calm and reassuring. Specific about process. No hyperbole at all.";
    default:
      return "Direct and energetic. Leads with the customer's problem, answers it immediately. Zero corporate padding.";
  }
}

/**
 * Write the copy, retrying once on a recoverable failure.
 *
 * Observed failing twice before succeeding on identical input, which is the
 * signature of an intermittent empty or malformed response rather than a bad
 * prompt. Retrying here costs one call; letting the step fail costs the
 * media pass and everything else that already succeeded.
 */
export async function generateCopyPlan(brief: SiteBrief, dna: DesignDna): Promise<CopyPlan | null> {
  const first = await attemptCopyPlan(brief, dna);
  if (first) return first;

  console.warn("[copy] first attempt failed, retrying once");
  return attemptCopyPlan(brief, dna, true);
}

async function attemptCopyPlan(brief: SiteBrief, dna: DesignDna, isRetry = false): Promise<CopyPlan | null> {
  const factLines: string[] = [
    `Business: ${brief.businessName}`,
    `Trade: ${brief.industry}`,
    `Serves: ${brief.city}${brief.areas.length > 0 ? ` and ${brief.areas.slice(0, 8).join(", ")}` : ""}`,
  ];
  if (brief.founder) factLines.push(`Owner: ${brief.founder}`);
  if (brief.phone) factLines.push(`Phone: ${brief.phone}`);
  if (brief.rating && brief.reviewCount) {
    factLines.push(`Google: ${brief.rating} stars, ${brief.reviewCount} reviews — this is verified and you may lead with it`);
  } else {
    factLines.push(`No verified rating exists — do not mention ratings, stars or review counts at all`);
  }
  factLines.push(
    brief.licensedInsured
      ? `The business states it is licensed and insured on its own site — you may say so`
      : `No licensing or insurance claim exists — never claim licensed, insured, bonded or certified`
  );
  factLines.push(`Services: ${brief.services.join(" | ")}`);

  if (brief.reviews.length > 0) {
    factLines.push(
      `Real reviews (quote verbatim or not at all):\n${brief.reviews.map((r) => `  "${r.text.slice(0, 300)}" — ${r.author}`).join("\n")}`
    );
  }
  factLines.push(`\nEverything scraped from their current site:\n${brief.factsDigest}`);

  const prompt = `You are a senior conversion copywriter. Write the copy for a ${brief.industry} business's new homepage. A real business owner will open this page and decide, in about four seconds, whether these people are better than whoever built their current site.

VOICE: ${voiceFor(dna)}

THE RULE ON TRUTH — read this carefully, because getting it wrong in either direction ruins the page:
  Every FACT must be true. Never state a price, a year founded, a number of jobs, a certification, an award, a guarantee, a rating or a testimonial that is not in the facts below.
  The FRAMING is your job. You are not restricted to repeating the facts as written. If the hours say open 24 hours, you may write "Someone picks up at 3am." If they hold a 5-star average across 461 reviews, you may write "461 people rated them five stars." That is persuasion built on truth, and it is exactly what is wanted.
  Never write about the source data or about the website. The reader does not know a brief exists.

NEVER WRITE ANYTHING LIKE THESE — every one appeared in a previous failed attempt:${BANNED_PATTERNS}

THE FACTS:
${factLines.join("\n")}

Write:
- headline: the promise, in the customer's words. Six to nine words. Not the company name. It should be impossible to paste onto a competitor's site unchanged.
- subhead: one sentence that makes the headline concrete and names the place.
- heroCta: the button text. Specific beats "Learn more".
- trustChips: up to 4 very short chips, each a real verifiable fact stated with impact. Omit entirely if the facts do not support real ones.
- sections: 3 to 7 sections. Each needs an eyebrow, a heading that SAYS SOMETHING rather than labelling the section, and body copy a competitor could not reuse. If reviews exist, structure the reviews section with an eyebrow like "★★★★★ ${brief.rating || "5.0"} from ${brief.reviewCount || "27"} Verified Reviews", a bold headline "What Our Customers Say", and subhead "Real feedback from property owners across ${brief.city || "your area"}."
- services: one blurb per real service, written for a customer deciding whether they need it — not a definition of the words in its name.
- faq: provide 10 comprehensive, high-intent questions and answers a real customer of this trade asks before hiring in ${brief.city || "your area"} (pricing factors, warranties, emergency response, permitting, timeline, guarantees).
- closing: a final high-converting call to action with real urgency drawn from the trade itself.

Return strict JSON only, matching exactly this shape:
{"headline":"...","subhead":"...","heroCta":"...","trustChips":["..."],"sections":[{"id":"services|about|reviews|areas|faq|contact|proof|process","eyebrow":"...","heading":"...","body":"...","bullets":["..."]}],"services":[{"name":"exact real service name","blurb":"..."}],"faq":[{"question":"...","answer":"..."}],"closing":{"heading":"...","body":"...","cta":"..."}}`;

  const raw = await callOpenAI(prompt, {
    json: true,
    maxTokens: 24000,
    // A slightly cooler retry is measurably more likely to return
    // well-formed JSON when the first attempt did not.
    temperature: isRetry ? 0.6 : 0.9,
    system:
      "You are a senior conversion copywriter for premium local-service businesses. You never invent facts, and you never write filler. You return valid JSON only.",
  });

  if (!raw) {
    console.error("[copy] model returned no content — see the [openai] line above for finish_reason and token usage");
    return null;
  }

  const parsed = parseJsonResponse(raw);
  if (!parsed) {
    console.error(`[copy] response was not valid JSON. First 300 chars: ${raw.slice(0, 300)}`);
    return null;
  }

  const result = CopyPlanSchema.safeParse(parsed);
  if (!result.success) {
    console.error(
      `[copy] plan failed validation: ${result.error.issues
        .slice(0, 6)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`
    );
    return null;
  }

  return result.data;
}

/**
 * A second opinion on the copy alone, before any markup exists.
 *
 * Catching a weak headline here costs one small call. Catching it after the
 * page is built costs a full regeneration, and in practice usually did not
 * get caught at all, because a reviewer looking at finished markup grades
 * the layout and skims the words.
 */
export async function critiqueCopyPlan(plan: CopyPlan, brief: SiteBrief): Promise<CopyPlan | null> {
  const raw = await callOpenAI(
    `You are a ruthless copy editor. Below is the copy plan for a ${brief.industry} homepage. Find everything weak and rewrite it.

Reject and rewrite any of these:
- A headline that would work equally well for any competitor in this trade
- A heading that labels its section instead of saying something
- Any sentence that describes the business's own data or website
- Filler virtue claims with no specific content${BANNED_PATTERNS}
- Any claim not supported by these facts:
${brief.factsDigest.slice(0, 2500)}
  Services: ${brief.services.join(" | ")}
  ${brief.rating && brief.reviewCount ? `Rating: ${brief.rating} from ${brief.reviewCount} reviews` : "No verified rating — any rating claim must be deleted"}

If a section cannot be made specific and true, delete it rather than padding it. Fewer, stronger sections beat more, weaker ones.

CURRENT PLAN:
${JSON.stringify(plan, null, 2)}

Return the improved plan as strict JSON in the identical shape. Keep what genuinely works; rewrite what does not.`,
    {
      json: true,
      maxTokens: 24000,
      temperature: 0.7,
      system: "You are a ruthless copy editor. You return valid JSON only.",
    }
  );

  const parsed = raw ? parseJsonResponse(raw) : null;
  const result = parsed ? CopyPlanSchema.safeParse(parsed) : null;
  return result?.success ? result.data : null;
}
