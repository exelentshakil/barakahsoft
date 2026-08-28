"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PERSONAS, type PersonaSlug } from "@/lib/personas";
import { trackPixelEvent } from "@/lib/meta-pixel";
import { isValidUrl } from "@/lib/validate-url";

const BRAND_BUTTON = "w-full rounded-lg bg-[#ffd12d] text-[#111] hover:bg-[#f5c400]";

export function IntakeFlow({ ctaLabel }: { ctaLabel: string }) {
  const [url, setUrl] = useState("");
  const [persona, setPersona] = useState<PersonaSlug | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tcpaConsent, setTcpaConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  async function submitLead(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const eventId = crypto.randomUUID();
    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_url: url, persona: persona || null, pain_points: [], name, email, phone, tcpa_consent: tcpaConsent, event_id: eventId }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.duplicate) {
          setModalOpen(false);
          setDuplicate(true);
          return;
        }
        throw new Error(data.error || "Something went wrong — please try again.");
      }
      trackPixelEvent("Lead", eventId, { content_name: "managed_lead_engine_qualification" });
      setModalOpen(false);
      setSuccess(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 text-center shadow-card"><CheckCircle2 className="h-8 w-8 text-success" /><p className="font-medium">We&apos;re reviewing your business.</p><p className="text-sm text-muted-foreground">Expect a text or email with the next step, usually within 48 hours.</p></div>;
  }

  if (duplicate) {
    return <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-primary/20 bg-card p-6 text-center shadow-card"><p className="font-medium">You have already submitted this website.</p><p className="mt-1 text-sm text-muted-foreground">We are reviewing it now. Please try a different website if you want to submit another business.</p></div>;
  }

  return (
    <>
      <Button type="button" size="lg" className="rounded-lg bg-[#ffd12d] px-7 text-[#111] shadow-lift hover:bg-[#f5c400]" onClick={() => setModalOpen(true)}>{ctaLabel}<ArrowRight className="h-4 w-4" /></Button>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="overflow-hidden border-primary/20 p-0 shadow-glow">
          <div className="h-1 bg-gradient-primary" />
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-primary"><span>BarakahSoft qualification</span><span>{step} of 2</span></div>
            <DialogHeader>
              <DialogTitle>{step === 1 ? "See if your business qualifies" : "Where should we send the plan?"}</DialogTitle>
              <DialogDescription>{step === 1 ? "Two quick details. No sales call is required to see if the offer fits." : "We will review your business and contact you with the next step."}</DialogDescription>
            </DialogHeader>
            {step === 1 ? (
              <form onSubmit={(event) => {
                event.preventDefault();
                if (!isValidUrl(url)) {
                  alert("Please enter a valid website address (e.g. yourdomain.com)");
                  return;
                }
                setStep(2);
              }} className="mt-5 space-y-4">
                <div><Label htmlFor="intake-url">Current website URL</Label><Input id="intake-url" required type="text" placeholder="yourbusiness.com" value={url} onChange={(event) => setUrl(event.target.value)} className="mt-1" /></div>
                <div><Label htmlFor="intake-persona">Your trade</Label><select id="intake-persona" required value={persona} onChange={(event) => setPersona(event.target.value as PersonaSlug)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="" disabled>Select your trade</option>{PERSONAS.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></div>
                <Button type="submit" className={BRAND_BUTTON}>Continue<ArrowRight className="h-4 w-4" /></Button>
              </form>
            ) : (
              <form onSubmit={submitLead} className="mt-5 space-y-4">
                <div><Label htmlFor="intake-name">Name</Label><Input id="intake-name" required value={name} onChange={(event) => setName(event.target.value)} className="mt-1" /></div>
                <div><Label htmlFor="intake-email">Email</Label><Input id="intake-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1" /></div>
                <div><Label htmlFor="intake-phone">Phone</Label><Input id="intake-phone" required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1" /></div>
                <label className="flex items-start gap-2 text-xs text-muted-foreground"><Checkbox required checked={tcpaConsent} onChange={(event) => setTcpaConsent(event.target.checked)} className="mt-0.5" /><span>I agree to be contacted by call, text, or email about this service. Consent is not a condition of purchase.</span></label>
                {error && <p className="text-sm text-danger">{error}</p>}
                <Button type="submit" disabled={submitting} className={BRAND_BUTTON}>{submitting ? "Sending..." : "Send my qualification request"}</Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
