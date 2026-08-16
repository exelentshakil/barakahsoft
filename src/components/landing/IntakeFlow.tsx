"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { UrlIntakeForm } from "@/components/landing/UrlIntakeForm";
import { LeadCaptureModal } from "@/components/landing/LeadCaptureModal";
import { trackPixelEvent } from "@/lib/meta-pixel";
import type { PersonaSlug } from "@/lib/personas";

export function IntakeFlow({ ctaLabel }: { ctaLabel: string }) {
  const [url, setUrl] = useState("");
  const [persona, setPersona] = useState<PersonaSlug | "">("");
  const [painPoints, setPainPoints] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleFinalSubmit(details: { name: string; email: string; phone: string; tcpaConsent: boolean }) {
    setSubmitting(true);
    setError(null);

    const eventId = crypto.randomUUID();
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_url: url,
          persona: persona || null,
          pain_points: painPoints ? painPoints.split(/\n+/).filter(Boolean) : [],
          name: details.name,
          email: details.email,
          phone: details.phone,
          tcpa_consent: details.tcpaConsent,
          event_id: eventId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong — please try again");

      trackPixelEvent("Lead", eventId, { content_name: "free_redesign_intake" });
      setModalOpen(false);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-2 rounded-lg border border-border bg-card p-6 text-center shadow-card">
        <CheckCircle2 className="h-8 w-8 text-success" />
        <p className="font-medium">You're all set.</p>
        <p className="text-sm text-muted-foreground">
          We're building your free redesign now — expect a text or email within 48 hours, and possibly a call sooner.
        </p>
      </div>
    );
  }

  return (
    <>
      <UrlIntakeForm
        url={url}
        onUrlChange={setUrl}
        persona={persona}
        onPersonaChange={setPersona}
        painPoints={painPoints}
        onPainPointsChange={setPainPoints}
        onSubmit={() => setModalOpen(true)}
        ctaLabel={ctaLabel}
      />
      <LeadCaptureModal open={modalOpen} onOpenChange={setModalOpen} onSubmit={handleFinalSubmit} submitting={submitting} error={error} />
    </>
  );
}
