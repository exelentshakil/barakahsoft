"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidUrl } from "@/lib/validate-url";
import { LEAD_PROBLEMS } from "@/lib/lead-problems";

export function RedesignIntakeFlow({
  /**
   * "legacy" is the platform landing's yellow-on-navy bar, kept byte-identical.
   * "brand" takes the host tenant's own accent, so a partner's form is their
   * colour rather than BarakahSoft's.
   */
  accent = "legacy",
  /**
   * The reassurance under the field. Off where the surrounding section already
   * says it — the partner landing did, and the duplicate read as a stutter.
   */
  showNote = true,
  submitLabel = "See My New Homepage (Free)",
}: {
  accent?: "legacy" | "brand";
  showNote?: boolean;
  submitLabel?: string;
} = {}) {
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  // What the visitor says is wrong with their site. This drives the brief's
  // pain instructions, so a lead that arrives with none gets a site written
  // against nothing in particular.
  const [problems, setProblems] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  function begin(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidUrl(url)) {
      alert("Please enter a valid website address (e.g. yourdomain.com)");
      return;
    }
    setOpen(true);
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
        body: JSON.stringify({
          source_url: url,
          source: "home",
          help_needed: problems.length > 0 ? problems : ["Other issue — we'll check for you"],
          anything_else: "",
          name, email, phone, tcpa_consent: consent, event_id: eventId,
        }),
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
      {/* No mx-auto or max-w here: the section that places this decides how wide
          it is. Owning both was what made it sit off-centre inside a narrower
          column on the partner landing. */}
      <form
        onSubmit={begin}
        className="flex w-full flex-col gap-2 rounded-2xl border border-white/15 bg-white p-2 shadow-2xl sm:flex-row"
      >
        <div className="flex flex-1 items-center gap-2 px-3">
          <Globe className="h-4 w-4 shrink-0 text-[#9aa4bd]" aria-hidden="true" />
          <Input
            required
            type="text"
            placeholder="yourbusiness.co.uk"
            aria-label="Your current website address"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="h-12 flex-1 border-0 bg-transparent px-0 text-base text-[#1e212b] shadow-none placeholder:text-[#9aa4bd] focus-visible:ring-0"
          />
        </div>
        <Button
          type="submit"
          className={
            accent === "brand"
              ? "h-12 shrink-0 rounded-xl bg-primary px-6 font-bold text-primary-foreground hover:brightness-110"
              : "h-12 shrink-0 rounded-xl bg-[#ffd12d] px-6 font-bold text-[#07284d] hover:bg-[#f5c400]"
          }
        >
          {submitLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      {showNote && (
        <div className="mt-3 flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-3">
          <p className="text-[11px] sm:text-xs text-[#7890a5]">🔒 We only look at your public website</p>
          <span className="hidden sm:inline text-[#7890a5]">•</span>
          <p className="text-[11px] sm:text-xs text-[#7890a5]">Free · No credit card · Yours to keep</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden border border-[#e5e7f2] p-0 shadow-2xl sm:max-w-md bg-white">
          <div className="h-1 bg-[#533afd]" />
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between text-xs font-bold text-[#533afd]">
               <span>Free Lead-Machine Audit</span>
            </div>
            <form onSubmit={submit}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#0d1738]">Where should we send your private plan?</DialogTitle>
                <DialogDescription className="text-xs text-[#777588]">
                  We&apos;ll build a custom concept for {url.replace(/^https?:\/\//i, '').split('/')[0]} and email it to you in 48 hours.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <Label className="text-xs font-bold text-[#0d1738]">
                    What is not working right now?{" "}
                    <span className="font-medium text-[#777588]">Pick any — it shapes what we build.</span>
                  </Label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {LEAD_PROBLEMS.map((problem) => {
                      const chosen = problems.includes(problem);
                      return (
                        <button
                          key={problem}
                          type="button"
                          aria-pressed={chosen}
                          onClick={() =>
                            setProblems((current) =>
                              current.includes(problem)
                                ? current.filter((item) => item !== problem)
                                : [...current, problem]
                            )
                          }
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            chosen
                              ? "border-[#533afd] bg-[#533afd] text-white"
                              : "border-[#e5e7f2] bg-white text-[#42506a] hover:border-[#c7d0fb] hover:bg-[#f7f8ff]"
                          }`}
                        >
                          {problem}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label htmlFor="redesign-name" className="text-xs font-bold text-[#0d1738]">First name</Label>
                  <Input id="redesign-name" required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 border-[#e5e7f2] text-base sm:text-sm" />
                </div>
                <div>
                  <Label htmlFor="redesign-email" className="text-xs font-bold text-[#0d1738]">Email address</Label>
                  <Input id="redesign-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 border-[#e5e7f2] text-base sm:text-sm" />
                </div>
                <div>
                  <Label htmlFor="redesign-phone" className="text-xs font-bold text-[#0d1738]">Phone number (for 1-tap call confirmation)</Label>
                  <Input id="redesign-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 border-[#e5e7f2] text-base sm:text-sm" />
                </div>
                <label className="flex items-start gap-2 text-xs text-[#42506a]">
                  <Checkbox required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5" />
                  <span>I agree to be contacted by email, call, or text about this redesign. Consent is not a condition of purchase.</span>
                </label>
                {error && <p className="text-sm text-[#ba1a1a]">{error}</p>}
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <Button type="submit" disabled={submitting} className="w-full rounded-md bg-[#533afd] px-6 py-4 text-sm font-bold text-white hover:bg-[#432bd9]">
                   {submitting ? "Mapping Your Lead Flow..." : "Start My Free Audit"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
