"use client";

import { useState } from "react";
import { ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LEAD_PROBLEMS } from "@/lib/lead-problems";
import { trackPixelEvent } from "@/lib/meta-pixel";

export function RedesignIntakeFlow() {
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [helpNeeded, setHelpNeeded] = useState<string[]>([]);
  const [anythingElse, setAnythingElse] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function begin(event: React.FormEvent) {
    event.preventDefault();
    if (!url.trim()) return;
    setOpen(true);
    setStep(1);
  }

  function toggle(problem: string) {
    setHelpNeeded((current) => current.includes(problem) ? current.filter((item) => item !== problem) : [...current, problem]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const eventId = crypto.randomUUID();
    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_url: url, source: "home", help_needed: helpNeeded, anything_else: anythingElse, name, email, phone, tcpa_consent: consent, event_id: eventId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong — please try again.");
      trackPixelEvent("Lead", eventId, { content_name: "free_homepage_redesign" });
      setOpen(false);
      setSuccess(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) return <div className="mx-auto mt-7 flex max-w-xl items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-left"><CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" /><div><p className="font-bold text-[#07284d]">Your request is in.</p><p className="mt-1 text-sm text-[#60778d]">We&apos;ll review the website before we contact you about the free homepage concept.</p></div></div>;

  return (
    <>
      <form onSubmit={begin} className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 rounded-xl border border-white/20 bg-white p-2 shadow-2xl sm:flex-row">
        <Input required type="url" placeholder="https://yourbusiness.com" value={url} onChange={(event) => setUrl(event.target.value)} className="h-12 flex-1 border-0 bg-transparent text-[#1e212b] shadow-none focus-visible:ring-0" />
        <Button type="submit" className="h-12 rounded-lg bg-[#ef1550] px-6 font-bold text-white hover:bg-[#d90f45]">Get my free redesign <ArrowRight className="h-4 w-4" /></Button>
      </form>
      <p className="mt-3 text-center text-xs text-[#7890a5]">Free · No credit card · Yours to keep</p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden border-0 p-0 shadow-2xl sm:max-w-lg">
          <div className="h-1 bg-[#ef1550]" />
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between text-xs font-bold text-[#ef1550]"><span>Free homepage redesign</span><span>Step {step} of 2</span></div>
            {step === 1 ? (
              <form onSubmit={(event) => { event.preventDefault(); setStep(2); }}>
                <DialogHeader><DialogTitle>What is your website struggling with?</DialogTitle><DialogDescription>Select everything that applies. We&apos;ll use this in the audit and redesign brief.</DialogDescription></DialogHeader>
                <div className="mt-6 space-y-2">{LEAD_PROBLEMS.map((problem) => <button type="button" key={problem} onClick={() => toggle(problem)} className={`flex w-full items-center justify-between rounded-lg border p-4 text-left text-sm font-semibold transition ${helpNeeded.includes(problem) ? "border-[#ef1550] bg-rose-50 text-[#111827]" : "border-[#d9e1e8] bg-white text-[#364152] hover:border-[#ef1550]/50"}`}><span>{problem}</span><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${helpNeeded.includes(problem) ? "border-[#ef1550] bg-[#ef1550] text-white" : "border-[#b8c2cc]"}`}>{helpNeeded.includes(problem) && <Check className="h-3 w-3" />}</span></button>)}</div>
                <div className="mt-4"><Label htmlFor="anything-else">Anything else? (optional)</Label><Textarea id="anything-else" value={anythingElse} onChange={(event) => setAnythingElse(event.target.value)} placeholder="Tell us what is frustrating you about the current site." className="mt-1" /></div>
                <Button type="submit" className="mt-6 w-full rounded-lg bg-[#ef1550] text-white hover:bg-[#d90f45]">Continue <ArrowRight className="h-4 w-4" /></Button>
              </form>
            ) : (
              <form onSubmit={submit}>
                <DialogHeader><DialogTitle>Where should we send your redesign?</DialogTitle><DialogDescription>We&apos;ll use these details only to deliver the concept and follow up about your request.</DialogDescription></DialogHeader>
                <div className="mt-6 space-y-4"><div><Label htmlFor="redesign-name">First name</Label><Input id="redesign-name" required value={name} onChange={(event) => setName(event.target.value)} className="mt-1" /></div><div><Label htmlFor="redesign-email">Email</Label><Input id="redesign-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1" /></div><div><Label htmlFor="redesign-phone">Phone (optional)</Label><Input id="redesign-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1" /></div><label className="flex items-start gap-2 text-xs text-[#60778d]"><Checkbox required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5" /><span>I agree to be contacted by email, call, or text about this redesign. Consent is not a condition of purchase.</span></label>{error && <p className="text-sm text-red-600">{error}</p>}</div>
                <div className="mt-6 flex items-center justify-between gap-3"><button type="button" onClick={() => setStep(1)} className="text-sm font-semibold text-[#60778d]">← Back</button><Button type="submit" disabled={submitting} className="rounded-lg bg-[#ef1550] text-white hover:bg-[#d90f45]">{submitting ? "Sending..." : "Get my free redesign"}</Button></div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
