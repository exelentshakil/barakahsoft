"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ClosePlanStep } from "@/types/database";

const EMAIL_LABELS: Record<string, string> = {
  "closing-sequence-email-1": "Auto-email #1 — check-in",
  "closing-sequence-email-2": "Auto-email #2 — last follow-up",
};

// ClosingScriptStepper — the 3-step close plan built by close-plan.ts:
// step 1 (call) stays manual by design (PRD §1c), steps 2-3 (email) are
// automated by deliver-send.ts's step.sleep sequence and shown here
// read-only once sent.
export function HowToCloseTab({ steps }: { steps: ClosePlanStep[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function markStep(stepId: string, status: "done" | "skipped") {
    setSubmitting(stepId);
    await fetch(`/api/close-plan-steps/${stepId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSubmitting(null);
    router.refresh();
  }

  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground">No close plan yet — this appears once the redesign is delivered.</p>;
  }

  return (
    <div className="space-y-4">
      {steps
        .sort((a, b) => a.step_number - b.step_number)
        .map((step) => (
          <div key={step.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {step.kind === "call" ? <Phone className="h-4 w-4 text-primary" /> : <Mail className="h-4 w-4 text-primary" />}
                <p className="font-medium">
                  Step {step.step_number} — {step.kind === "call" ? "Call" : EMAIL_LABELS[step.script_or_template ?? ""] ?? "Email"}
                </p>
              </div>
              <Badge variant={step.status === "done" || step.status === "sent" ? "success" : "secondary"}>{step.status}</Badge>
            </div>

            {step.kind === "call" && step.script_or_template && (
              <pre className="mt-3 whitespace-pre-wrap rounded-md bg-muted p-3 font-sans text-sm">{step.script_or_template}</pre>
            )}
            {step.kind === "email" && (
              <p className="mt-2 text-sm text-muted-foreground">
                {step.scheduled_at ? `Scheduled for ${new Date(step.scheduled_at).toLocaleDateString()}` : "Not scheduled"}
              </p>
            )}

            {step.kind === "call" && step.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" disabled={submitting === step.id} onClick={() => markStep(step.id, "done")}>
                  <CheckCircle2 className="h-4 w-4" /> Mark called
                </Button>
                <Button size="sm" variant="outline" disabled={submitting === step.id} onClick={() => markStep(step.id, "skipped")}>
                  Skip
                </Button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
