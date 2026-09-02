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

export type SequenceTrack = "outreach" | "inbound";

export interface OutreachStage {
  stage: 1 | 2 | 3;
  key: string;
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
export function signOff(ctx: OutreachContext, track: SequenceTrack = "outreach"): string {
  // The reason line has to be true for the track it is sent on. Telling
  // someone who filled in the form that they "came up while I was looking at
  // local businesses" is both wrong and the fastest way to lose them.
  const because =
    track === "inbound"
      ? `You are receiving this because you requested a free rebuild for ${ctx.businessName}.`
      : `You received this because ${ctx.businessName} came up while I was looking at local businesses whose websites I could rebuild.`;
  return ["", "—", "Shakil · BarakahSoft", because, "Reply STOP and I will not contact you again."].join("\n");
}

export const OUTREACH_SEQUENCE: OutreachStage[] = [
  {
    stage: 1,
    key: "gift",
    label: "Value Drop Gift",
    purpose: "Rebuilt concept and speed audit, no charge",
    dueAfterHours: 0,
    subject: (ctx) => `${ctx.businessName} on a phone`,
    body: (ctx) =>
      [
        `Hi,`,
        ``,
        `I was looking at ${ctx.businessName} and your site is slow enough on a phone that people are leaving before it loads.

So I rebuilt the homepage to show what it looks like fixed. It is live now, nothing to sign:`,
        ``,
        ctx.previewUrl,
        ``,
        ctx.headlineFinding
          ? ctx.headlineFinding
          : `There is a full breakdown of what is slowing the current site down inside the portal.`,
        ``,
        `It is yours to explore, no strings attached.`,
      ].join("\n") + signOff(ctx),
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
      ].join("\n") + signOff(ctx),
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
      ].join("\n") + signOff(ctx),
  },
];

// The warm track. Same three-beat shape, opposite premise: these people
// asked for the rebuild, so the first message delivers rather than
// introduces, and the last one says what happens to their files rather than
// offering them.
export const INBOUND_SEQUENCE: OutreachStage[] = [
  {
    stage: 1,
    key: "delivery",
    label: "Initial Delivery",
    purpose: "Their requested 48h rebuild is ready",
    dueAfterHours: 0,
    subject: (ctx) => `${ctx.businessName} on a phone`,
    body: (ctx) =>
      [
        `Hi,`,
        ``,
        `I was looking at ${ctx.businessName} and your site is slow enough on a phone that people are leaving before it loads.

So I rebuilt the homepage to show what it looks like fixed. It is live now, nothing to sign:`,
        ``,
        ctx.previewUrl,
        ``,
        ctx.headlineFinding
          ? ctx.headlineFinding
          : `There is a full breakdown of what is slowing the current site down inside the portal.`,
        ``,
        `It is yours to explore, no strings attached.`,
      ].join("\n") + signOff(ctx, "inbound"),
  },
  {
    stage: 2,
    key: "bump",
    label: "48h Follow-up Bump",
    purpose: "Checking in on the requested concept",
    dueAfterHours: 48,
    subject: (ctx) => `Any thoughts on the ${ctx.businessName} rebuild?`,
    body: (ctx) =>
      [
        `Hi,`,
        ``,
        `Did you get a chance to look?`,
        ``,
        ctx.previewUrl,
        ``,
        `If something is off I will fix it today — it is usually a ten-minute job. If the timing is wrong, tell me and I will leave it with you.`,
      ].join("\n") + signOff(ctx, "inbound"),
  },
  {
    stage: 3,
    key: "final",
    label: "Final Notice",
    purpose: "Final check before the staging copy is archived",
    dueAfterHours: 96,
    subject: (ctx) => `Before I archive the ${ctx.businessName} staging copy`,
    body: (ctx) =>
      [
        `Hi,`,
        ``,
        `Last check on this one. The staging copy is still up:`,
        ``,
        ctx.previewUrl,
        ``,
        `I am going to archive it shortly to keep things tidy. If you want it kept, or you want the files handed over to your own developer, just reply — both are free and take me a minute.`,
        ``,
        `No reply is a fine answer.`,
      ].join("\n") + signOff(ctx, "inbound"),
  },
];

export function sequenceFor(track: SequenceTrack): OutreachStage[] {
  return track === "inbound" ? INBOUND_SEQUENCE : OUTREACH_SEQUENCE;
}

export function stageFor(n: number, track: SequenceTrack = "outreach"): OutreachStage | null {
  return sequenceFor(track).find((s) => s.stage === n) ?? null;
}

/** The touch a prospect is next owed, or null once the sequence is done. */
export function nextStage(lead: Pick<Lead, "outreach_stage">, track: SequenceTrack = "outreach"): OutreachStage | null {
  return stageFor((lead.outreach_stage ?? 0) + 1, track);
}

/**
 * Whether enough time has passed for that next touch.
 *
 * Sending the bump an hour after the gift reads as automated, which is the
 * one impression this sequence cannot afford.
 */
export function isDue(
  lead: Pick<Lead, "outreach_stage" | "outreach_last_sent_at">,
  track: SequenceTrack = "outreach"
): boolean {
  const next = nextStage(lead, track);
  if (!next) return false;
  if (!lead.outreach_last_sent_at) return true;
  const elapsedHours = (Date.now() - new Date(lead.outreach_last_sent_at).getTime()) / 3_600_000;
  return elapsedHours >= next.dueAfterHours;
}
