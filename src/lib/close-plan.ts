import { tenantBySlug } from "@/tenants";
import type { Lead } from "@/types/database";
import type { Playbook } from "@/lib/playbooks";

// Builds the 3-step closing sequence (PRD §1c/§7 stage 7): a manual call
// script first (mechanical parts automated, human parts stay human — the
// call itself can't be automated without losing the human-trust story this
// whole positioning is built on), then 2 auto-sent Resend emails on a
// delay, scheduled by deliver-send.ts via step.sleep.
export interface ClosePlanStepInput {
  step_number: number;
  kind: "call" | "email";
  scheduled_at: string | null;
  script_or_template: string;
}

function buildCallScript(lead: Lead, playbook: Playbook, brandName: string): string {
  const opener = playbook.converting_recipes[0] ?? "Lead with the outcome they actually care about.";
  return [
    `Call ${lead.business_name || "the business"} at ${lead.phone || "the number on file"}.`,
    `Opener: "Hi, this is ${brandName} — we just finished a free redesign of your homepage, want me to send it over while we're on the phone?"`,
    `Angle for this category: ${opener}`,
    lead.pain_points.length > 0 ? `They mentioned: ${lead.pain_points.join("; ")} — address this directly.` : null,
    `Close: "It's free to look at — if you like it, going live on your own domain is a one-time $999 build plus $49 or $99/month hosting."`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildClosePlanSteps(lead: Lead, playbook: Playbook): ClosePlanStepInput[] {
  // The operator reads this script down the phone, so it has to open with the
  // name they will actually say.
  const brandName = tenantBySlug(lead.tenant_slug).brand.name;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  return [
    { step_number: 1, kind: "call", scheduled_at: null, script_or_template: buildCallScript(lead, playbook, brandName) },
    {
      step_number: 2,
      kind: "email",
      scheduled_at: new Date(now + day).toISOString(),
      script_or_template: "closing-sequence-email-1",
    },
    {
      step_number: 3,
      kind: "email",
      scheduled_at: new Date(now + 3 * day).toISOString(),
      script_or_template: "closing-sequence-email-2",
    },
  ];
}
