"use client";

import { useState } from "react";
import { ArrowRight, Bot, Check, CheckCircle2 } from "lucide-react";
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
  const [duplicate, setDuplicate] = useState(false);

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
      if (!response.ok) {
        if (data.duplicate) {
          setOpen(false);
          setDuplicate(true);
          return;
        }
        throw new Error(data.error || "Something went wrong — please try again.");
      }
      trackPixelEvent("Lead", eventId, { content_name: "free_homepage_redesign" });
      setOpen(false);
      setSuccess(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) return <div className="mx-auto mt-7 flex max-w-xl items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-left"><CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" /><div><p className="font-bold text-[#07284d]">Your lead-machine audit is in motion.</p><p className="mt-1 text-sm text-[#60778d]">We&apos;ll send your private report link after we map the gaps, competitors, and call opportunities.</p></div></div>;
  if (duplicate) return <div className="mx-auto mt-7 max-w-xl rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-5 text-left"><p className="font-bold text-[#07284d]">You have already submitted this website.</p><p className="mt-1 text-sm text-[#60778d]">We are reviewing it now. Please try a different website if you want to submit another business.</p></div>;

  return (
    <div className="w-full">
      <form onSubmit={begin} className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-3 rounded-xl border border-white/20 bg-white p-2 shadow-2xl sm:flex-row">
        <Input required type="url" placeholder="Enter your current website address (e.g., mysite.com)" value={url} onChange={(event) => setUrl(event.target.value)} className="h-12 flex-1 border-0 bg-transparent text-xs text-[#1e212b] shadow-none focus-visible:ring-0" />
        <Button type="submit" className="h-12 rounded-lg bg-[#ffd12d] px-6 font-bold text-[#07284d] hover:bg-[#f5c400]">See My New Homepage (Free) <ArrowRight className="h-4 w-4" /></Button>
      </form>
      <p className="mt-3 w-full text-center text-xs text-[#7890a5]">🔒 We only look at your public website — no passwords or credit cards needed.</p>
      <p className="mt-3 w-full text-center text-xs text-[#7890a5]">Free · No credit card · Yours to keep</p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden border border-[#e5e7f2] p-0 shadow-2xl sm:max-w-lg bg-white">
          <div className="h-1 bg-[#533afd]" />
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between text-xs font-bold text-[#533afd]">
               <span>Free Lead-Machine Audit</span>
              <span>Step {step} of 2</span>
            </div>
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-3 text-left">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#533afd] text-white"><Bot className="h-4 w-4" /></span>
              <div className="text-xs leading-relaxed text-[#42506a]"><p className="font-bold text-[#0d1738]">BarakahSoft Lead Advisor</p><p>I&apos;ll use your answers to show where your current website is losing attention and where a better customer journey can create more calls.</p></div>
            </div>
            {step === 1 ? (
              <form onSubmit={(event) => { event.preventDefault(); setStep(2); }}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-[#0d1738]">Let&apos;s diagnose your lead flow</DialogTitle>
                  <DialogDescription className="text-xs text-[#777588]">
                    Select everything that applies. We&apos;ll use this in the audit and redesign brief.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6 space-y-2">
                  {LEAD_PROBLEMS.map((problem) => (
                    <button
                      type="button"
                      key={problem}
                      onClick={() => toggle(problem)}
                      className={`flex w-full items-center justify-between rounded-lg border p-4 text-left text-sm font-semibold transition ${
                        helpNeeded.includes(problem)
                          ? "border-[#533afd] bg-[#f0f3ff] text-[#0d1738]"
                          : "border-[#e5e7f2] bg-white text-[#42506a] hover:border-[#533afd]/50"
                      }`}
                    >
                      <span>{problem}</span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          helpNeeded.includes(problem)
                            ? "border-[#533afd] bg-[#533afd] text-white"
                            : "border-[#c8c4da]"
                        }`}
                      >
                        {helpNeeded.includes(problem) && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <Label htmlFor="anything-else" className="text-xs font-bold text-[#0d1738]">Anything else? (optional)</Label>
                  <Textarea
                    id="anything-else"
                    value={anythingElse}
                    onChange={(event) => setAnythingElse(event.target.value)}
                    placeholder="Tell us what is frustrating you about the current site."
                    className="mt-1 border-[#e5e7f2] text-xs"
                  />
                </div>
                <Button type="submit" className="mt-6 w-full rounded-md bg-[#533afd] py-3 text-sm font-bold text-white hover:bg-[#432bd9]">
                  Next: build my lead-machine plan <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <form onSubmit={submit}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-[#0d1738]">Where should we send your private plan?</DialogTitle>
                  <DialogDescription className="text-xs text-[#777588]">
                    We&apos;ll use these details to deliver the concept and follow up about your request.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="redesign-name" className="text-xs font-bold text-[#0d1738]">First name</Label>
                    <Input id="redesign-name" required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 border-[#e5e7f2]" />
                  </div>
                  <div>
                    <Label htmlFor="redesign-email" className="text-xs font-bold text-[#0d1738]">Email address</Label>
                    <Input id="redesign-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 border-[#e5e7f2]" />
                  </div>
                  <div>
                    <Label htmlFor="redesign-phone" className="text-xs font-bold text-[#0d1738]">Phone number (for 1-tap call confirmation)</Label>
                    <Input id="redesign-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 border-[#e5e7f2]" />
                  </div>
                  <label className="flex items-start gap-2 text-xs text-[#42506a]">
                    <Checkbox required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5" />
                    <span>I agree to be contacted by email, call, or text about this redesign. Consent is not a condition of purchase.</span>
                  </label>
                  {error && <p className="text-sm text-[#ba1a1a]">{error}</p>}
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-[#777588] hover:text-[#0d1738]">
                    ← Back
                  </button>
                  <Button type="submit" disabled={submitting} className="rounded-md bg-[#533afd] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#432bd9]">
                     {submitting ? "Mapping Your Lead Flow..." : "Start My Free Audit"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
