import { callGemini, bestGeminiChain } from "@/lib/gemini-client";
import { buildReportModules } from "@/lib/report-modules";
import type { Lead, ScrapeResults } from "@/types/database";

// One email, written for one business, from what was actually measured.
//
// The three-touch sequence in sequence.ts is a good shape and one set of
// words. Every cold first contact opens by asserting "your site is slow
// enough on a phone that people are leaving before it loads" — about
// businesses whose sites are fine, because nothing checks. Both slots that
// exist for personalisation, city and headlineFinding, are passed as null
// by the send route. So the strongest sentence in the sequence is a guess,
// and the recipient is the person best placed to know it is wrong.
//
// The fix is not better generic copy. It is that the report already knows
// something true and specific about each of these businesses — which of
// their service areas they are invisible in, who outranks them there, how
// many reviews their own homepage never mentions — and none of it reaches
// the email that is supposed to earn the click.
//
// So the hook is drawn from buildReportModules: the same measurements the
// report will show them. That is the point. The email makes one checkable
// claim, and the page it links to is where they check it. A hook the report
// then contradicts is worse than no hook at all.

export interface OutreachDraft {
  subject: string;
  body: string;
  /** The one measured fact the email is built on, for the operator's review. */
  hook: string;
  model: string;
  generatedAt: string;
}

export interface Signal {
  /** Higher wins when the model is choosing what to lead on. */
  weight: number;
  label: string;
  detail: string;
}

/**
 * Everything true about this business that is worth opening an email with.
 *
 * Ranked, because the model is explicitly told to lead on the strongest one
 * and a flat list invites it to pick whichever is easiest to write about —
 * which is always the speed score, the least surprising thing on the list.
 *
 * Nothing enters this list that was not measured. There is no slot here for
 * an assumption, which is the whole difference from the sequence copy.
 */
export function signalsFor(lead: Lead, scrape: ScrapeResults | null): Signal[] {
  const report = buildReportModules(lead, scrape);
  if (report.isEmpty) return [];

  const signals: Signal[] = [];

  // Strongest by a distance: a named competitor beating them in towns they
  // say they serve. It is specific, it is checkable, and it is the one thing
  // on this list they cannot already know without doing the search.
  if (report.visibility && report.visibility.missing > 0) {
    const missingCells = report.visibility.cells.filter((c) => c.rank === null);
    const rivals = [...new Set(missingCells.map((c) => c.topCompetitor).filter(Boolean))] as string[];
    signals.push({
      weight: 100,
      label: "Invisible in service areas",
      detail:
        `Searched their trade in ${report.visibility.cells.length} areas they serve. They do not appear at all in ${report.visibility.missing}` +
        `${missingCells.length ? ` (${missingCells.slice(0, 4).map((c) => c.area).join(", ")}${missingCells.length > 4 ? ", and more" : ""})` : ""}.` +
        (rivals.length ? ` Ranking there instead: ${rivals.slice(0, 3).join(", ")}.` : "") +
        (report.visibility.dominant > 0 ? ` They do rank top-3 in ${report.visibility.dominant}.` : ""),
    });
  }

  // Proof they already earned and are not using. Flattering rather than
  // critical, which makes it the safest strong opener.
  if (report.reviewsGap && !report.reviewsGap.mentionedOnSite) {
    signals.push({
      weight: 90,
      label: "Reviews missing from the site",
      detail: `${report.reviewsGap.reviewCount} Google reviews averaging ${report.reviewsGap.rating}, and the homepage never mentions a rating or a review.`,
    });
  }

  // Only a hook when it is genuinely bad. A 71 is unremarkable and leading
  // on it is how the current sequence ends up crying wolf.
  if (report.speed && report.speed.score < 50) {
    signals.push({
      weight: 70,
      label: "Slow on a phone",
      detail:
        `Mobile PageSpeed ${report.speed.score}/100` +
        (report.speed.lcpSeconds ? `; the main content takes ${report.speed.lcpSeconds}s to appear.` : "."),
    });
  }

  if (report.contentDepth && report.contentDepth.pageCount <= 4 && report.contentDepth.services.length > 3) {
    signals.push({
      weight: 60,
      label: "Too few pages for the services offered",
      detail: `Google has ${report.contentDepth.pageCount} page(s) of theirs to rank, against ${report.contentDepth.services.length} services they offer (${report.contentDepth.services.slice(0, 4).join(", ")}).`,
    });
  }

  for (const finding of (report.audit?.blockers ?? []).slice(0, 3)) {
    signals.push({
      weight: 50,
      label: finding.title,
      detail: `${finding.finding} ${finding.consequence}`.trim() + (finding.evidence ? ` (${finding.evidence})` : ""),
    });
  }

  return signals.sort((a, b) => b.weight - a.weight);
}

const BANNED = [
  // Every one of these is a phrase a stranger has been sent a thousand times,
  // and each marks the message as bulk before the first full stop.
  "i hope this email finds you well",
  "i hope you're well",
  "just checking in",
  "quick question",
  "touch base",
  "circle back",
  "reach out",
  "game-changer",
  "game changer",
  "leverage",
  "synergy",
  "cutting-edge",
  "state of the art",
  "in today's digital",
  "in today's world",
  "as you may know",
  "i wanted to reach",
  "let me know if you",
  "look no further",
  "boost your",
  "skyrocket",
  "10x",
  "dear sir",
  "dear madam",
  "to whom it may concern",
];

const PLACEHOLDER = /\[[^\]]{2,40}\]|\{\{[^}]+\}\}|\bYOUR_?BUSINESS\b|\bXX+\b/i;

export interface DraftProblem {
  reason: string;
}

/**
 * Reject anything that would embarrass us in a stranger's inbox.
 *
 * A model asked for a short email will occasionally return a long one, an
 * unfilled placeholder, or a subject with an em-dash and three clauses. None
 * of that is worth a retry loop in front of a human, and all of it is worth
 * catching before it reaches a real business.
 */
export function validateDraft(draft: { subject: string; body: string }): DraftProblem | null {
  const subject = draft.subject.trim();
  const body = draft.body.trim();

  if (!subject) return { reason: "no subject" };
  if (subject.length > 62) return { reason: `subject is ${subject.length} characters; the cap is 62` };
  if (/^(re|fwd):/i.test(subject)) return { reason: "subject fakes a reply" };
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(subject + body)) return { reason: "contains emoji" };
  if (!body) return { reason: "no body" };

  const words = body.split(/\s+/).filter(Boolean).length;
  if (words > 120) return { reason: `body is ${words} words; the cap is 120` };
  if (words < 20) return { reason: `body is ${words} words, which reads as unfinished` };

  if (PLACEHOLDER.test(body) || PLACEHOLDER.test(subject)) return { reason: "contains an unfilled placeholder" };
  if (/https?:\/\//i.test(body)) return { reason: "wrote its own link; the URL is appended by the application" };

  const haystack = `${subject}\n${body}`.toLowerCase();
  const banned = BANNED.find((phrase) => haystack.includes(phrase));
  if (banned) return { reason: `uses the cold-email cliché "${banned}"` };

  return null;
}

function parse(raw: string): { subject: string; body: string; hook: string } | null {
  const cleaned = raw.replace(/```[a-z]*\s*/gi, "").replace(/```/g, "").trim();
  try {
    const json = JSON.parse(cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1));
    if (typeof json.subject !== "string" || typeof json.body !== "string") return null;
    return {
      subject: json.subject.trim(),
      body: json.body.trim(),
      hook: typeof json.hook === "string" ? json.hook.trim() : "",
    };
  } catch {
    return null;
  }
}

function prompt(businessName: string, city: string | null, signals: Signal[]): string {
  return `Write the first cold email to a local business owner. One email. Nothing else.

THE BUSINESS
- Name: ${businessName}
${city ? `- Town: ${city}` : ""}

WHAT WE MEASURED ABOUT THEM — the only facts you may use
${signals.map((s, i) => `${i + 1}. ${s.label}: ${s.detail}`).join("\n")}

Lead on fact 1 unless a later one is plainly more interesting for this business.
You may use one supporting fact. Never use more than two.

WHAT HAS ALREADY BEEN DONE FOR THEM
Their homepage has been rebuilt and is live at a link the application appends
below your text. It is free, there is nothing to sign, and it is theirs
whether they reply or not. Do NOT write a URL — one is added after your text.

THE JOB
The only goal is a reply. Not a click, not a sale, not a meeting. The email
earns a reply by telling them something true about their own business that
they did not know and would want to check.

RULES
- Under 90 words. Shorter is better. Three short paragraphs at most.
- Open with the fact. Not with who we are, not with a greeting about them,
  not with "I was looking at your website".
- Say the fact plainly, with its number, the way you would say it to someone
  in a pub. No adjectives selling it. The number does the work.
- Then, in one sentence, that the rebuilt page is already up and free.
- End with a genuine question they can answer in four words. It must be
  about THEM or their trade — something they know and we do not. Never
  "want to see it?", never "interested?", never a meeting request.
- No compliments, no flattery, no "I love what you do".
- Never claim anything not in the measured facts above. If a fact says they
  rank in some areas and not others, do not round that to "you're invisible".
- Plain British English. Contractions are fine. No exclamation marks.
- No sign-off and no name — the application appends those.
- Start with "Hi," on its own line.

SUBJECT
Under 62 characters. It must contain the specific thing — a number, a town,
or a competitor's name. It should read like a note from a person who noticed
something, not like a marketing line. No colons introducing a benefit, no
title case, no questions that could be sent to anyone.
Good: "you're not showing up in Fountain"  /  "267 reviews, none on the site"
Bad: "Boost Your Online Presence"  /  "Quick question"  /  "Website Redesign"

Return ONLY this JSON, no prose around it:
{"subject":"...","body":"...","hook":"the one fact you led on, in six words"}`;
}

/**
 * Write one email for one lead.
 *
 * Returns null when there is nothing measured to say. That is a real answer,
 * not a failure: a business we know nothing specific about should get the
 * generic sequence or nothing, rather than a model's guess at what might be
 * wrong with their website.
 */
export async function generateOutreachDraft(
  lead: Lead,
  scrape: ScrapeResults | null
): Promise<{ draft: OutreachDraft | null; reason: string | null }> {
  const signals = signalsFor(lead, scrape);
  if (signals.length === 0) {
    return { draft: null, reason: "nothing measured about this business worth opening with" };
  }

  const businessName = lead.business_name ?? "this business";
  const city = ((scrape?.facts as Record<string, unknown> | undefined)?.town as string) ?? null;
  const chain = bestGeminiChain();

  // Two attempts, because the failures are things a retry actually fixes —
  // a long body, a stray URL, a cliché. A third attempt has never been the
  // difference and it triples the cost of a bulk run.
  let lastProblem = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callGemini(prompt(businessName, city, signals), chain[0], undefined, {
      modelChain: chain,
      temperature: attempt === 0 ? 0.85 : 0.6,
      // Not 1200. maxTokens is the budget for thinking AND the answer, and
      // the Pro head of the chain spends about 2,000 tokens reasoning before
      // it writes a word — measured, on this prompt. At 1200 every call came
      // back finishReason MAX_TOKENS with the JSON truncated mid-sentence,
      // which the parser correctly rejected and the retry then repeated. A
      // 90-word email needs ~110 tokens; the rest of this is headroom for the
      // thinking in front of it.
      maxTokens: 8000,
      timeoutMs: 90_000,
      system:
        "You write short cold emails that get replies from tradespeople and small business owners. " +
        "You never invent facts, never flatter, and never sound like marketing. You write the way a " +
        "competent person emails a stranger they have something useful for.",
    });
    if (!raw) { lastProblem = "the model returned nothing"; continue; }

    const parsed = parse(raw);
    if (!parsed) { lastProblem = "the model did not return usable JSON"; continue; }

    const problem = validateDraft(parsed);
    if (problem) { lastProblem = problem.reason; continue; }

    return {
      draft: {
        subject: parsed.subject,
        body: parsed.body,
        hook: parsed.hook || signals[0].label,
        model: chain[0],
        generatedAt: new Date().toISOString(),
      },
      reason: null,
    };
  }

  return { draft: null, reason: lastProblem || "could not write a usable email" };
}
