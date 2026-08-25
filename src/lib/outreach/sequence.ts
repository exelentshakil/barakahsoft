import type { Lead } from "@/types/database";

// The cold sequence: a gift, one bump, and a clean exit.
//
// Three touches and it stops. The shape matters more than the wording — the
// first message gives something away and asks for nothing, the second is
// short enough to answer from a phone, and the third closes the loop rather
// than pretending the conversation is still open. A fourth touch converts
// nobody and is what gets a sending domain blocked.
//
// Every message names the real business and links to the concept already
// built for them. A sequence that could be sent to anyone reads as bulk, and
// the whole premise here is that the work is already done.

export interface OutreachStage {
  stage: 1 | 2 | 3;
  key: "gift" | "bump" | "final";
  label: string;
  purpose: string;
  /** How long after the previous touch this one is due. */
  dueAfterHours: number;
  subject: (ctx: OutreachContext) => string;
  body: (ctx: OutreachContext) => string;
}

export interface OutreachContext {
  businessName: string;
  previewUrl: string;
  city: string | null;
  /** The single clearest measured problem, when one exists. */
  headlineFinding: string | null;
}

/**
 * Required on commercial email. This is cold contact with a business, so
 * every message says who is writing, why they received it, and how to stop —
 * omitting that is both unlawful under CAN-SPAM and the fastest way to be
 * marked as spam by the recipient.
 */
function footer(ctx: OutreachContext): string {
  return [
    "",
    "—",
    "Shakil · BarakahSoft",
    `You received this because ${ctx.businessName} came up while I was looking at local businesses whose websites I could rebuild.`,
    "Reply STOP and I will not contact you again.",
  ].join("\n");
}

export const OUTREACH_SEQUENCE: OutreachStage[] = [
  {
    stage: 1,
    key: "gift",
    label: "Value Drop Gift",
    purpose: "Rebuilt concept and speed audit, no charge",
    dueAfterHours: 0,
    subject: (ctx) => `I rebuilt your homepage, ${ctx.businessName} — free, have a look`,
    body: (ctx) =>
      [
        `Hi,`,
        ``,
        `I rebuilt the ${ctx.businessName} homepage as a working page rather than a mockup. It is live here, nothing to sign up for:`,
        ``,
        ctx.previewUrl,
        ``,
        ctx.headlineFinding
          ? `I also ran a speed and local-search check while I was there. The one thing worth knowing: ${ctx.headlineFinding}`
          : `I also ran a speed and local-search check on the current site, and I can send that over if it is useful.`,
        ``,
        `It is yours either way — I would rather you have it than not. If it is not for you, ignore this and nothing else happens.`,
      ].join("\n") + footer(ctx),
  },
  {
    stage: 2,
    key: "bump",
    label: "48h Follow-up Bump",
    purpose: "Two-sentence check on the layout",
    dueAfterHours: 48,
    subject: (ctx) => `Did the ${ctx.businessName} layout land right?`,
    body: (ctx) =>
      [
        `Hi,`,
        ``,
        `Quick one — did the rebuilt page look right to you?`,
        ``,
        ctx.previewUrl,
        ``,
        `If a section is wrong I will fix it today. If it is not for you, say so and I will close the file.`,
      ].join("\n") + footer(ctx),
  },
  {
    stage: 3,
    key: "final",
    label: "Final Notice",
    purpose: "Free file transfer and a zero-obligation wrap",
    dueAfterHours: 96,
    subject: (ctx) => `Closing the file — the ${ctx.businessName} files are yours`,
    body: (ctx) =>
      [
        `Hi,`,
        ``,
        `Last note from me on this. The page is still here:`,
        ``,
        ctx.previewUrl,
        ``,
        `If you want the actual files — the whole site as a folder your own developer can host anywhere — reply and I will send them across at no cost. Otherwise I will leave you to it, and I will not chase this again.`,
        ``,
        `Genuinely no hard feelings either way.`,
      ].join("\n") + footer(ctx),
  },
];

export function stageFor(n: number): OutreachStage | null {
  return OUTREACH_SEQUENCE.find((s) => s.stage === n) ?? null;
}

/** The touch a prospect is next owed, or null once the sequence is done. */
export function nextStage(lead: Pick<Lead, "outreach_stage">): OutreachStage | null {
  return stageFor((lead.outreach_stage ?? 0) + 1);
}

/**
 * Whether enough time has passed for that next touch.
 *
 * Sending the bump an hour after the gift reads as automated, which is the
 * one impression this sequence cannot afford.
 */
export function isDue(lead: Pick<Lead, "outreach_stage" | "outreach_last_sent_at">): boolean {
  const next = nextStage(lead);
  if (!next) return false;
  if (!lead.outreach_last_sent_at) return true;
  const elapsedHours = (Date.now() - new Date(lead.outreach_last_sent_at).getTime()) / 3_600_000;
  return elapsedHours >= next.dueAfterHours;
}
