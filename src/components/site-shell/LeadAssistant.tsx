"use client";

import { useState } from "react";
import { ArrowRight, Bot, CheckCircle2, MessageCircle, X } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

export function LeadAssistant({ payload }: { payload: SitePayload }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"choose" | "details" | "success">("choose");
  const [service, setService] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const options = payload.services.slice(0, 4).map((item) => item.h2);

  function close() {
    setOpen(false);
    setError("");
  }

  function choose(value: string) {
    setService(value);
    setStep("details");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/s/${payload.leadSlug}/quote-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, message: [service, message].filter(Boolean).join(" — ") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send your request.");
      setStep("success");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to send your request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lift sm:right-6">
          <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center gap-2"><span className="rounded-lg bg-primary/20 p-1.5 text-primary"><Bot className="h-4 w-4" /></span><div><p className="text-sm font-bold">Service assistant</p><p className="text-[11px] text-slate-300">A quick path to the right next step</p></div></div>
            <button type="button" onClick={close} aria-label="Close service assistant" className="rounded-md p-1 text-slate-300 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
          </div>

          <div className="p-4">
            {step === "choose" && (
              <div>
                <p className="text-sm font-semibold">What do you need help with?</p>
                <div className="mt-3 space-y-2">
                  {options.map((option) => <button key={option} type="button" onClick={() => choose(option)} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left text-xs font-semibold transition hover:border-primary hover:text-primary">{option}<ArrowRight className="h-3.5 w-3.5" /></button>)}
                  <button type="button" onClick={() => choose("I am not sure yet")} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left text-xs font-semibold transition hover:border-primary hover:text-primary">I am not sure yet<ArrowRight className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            )}

            {step === "details" && (
              <form onSubmit={submit} className="space-y-3">
                <div className="rounded-lg bg-muted p-3 text-xs"><span className="font-semibold">You selected:</span> {service}</div>
                <label className="block text-xs font-semibold">Your name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus:border-primary" /></label>
                <label className="block text-xs font-semibold">Phone or email<input required value={contact} onChange={(event) => setContact(event.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus:border-primary" /></label>
                <label className="block text-xs font-semibold">What should we know?<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} placeholder="Optional details" className="mt-1 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus:border-primary" /></label>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-60">{busy ? "Sending..." : "Request a callback"}<ArrowRight className="h-3.5 w-3.5" /></button>
              </form>
            )}

            {step === "success" && <div className="py-5 text-center"><CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" /><p className="mt-3 font-bold">Request received</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{payload.businessName} has your details and can follow up directly.</p><button type="button" onClick={close} className="mt-4 text-xs font-bold text-primary hover:underline">Close assistant</button></div>}
          </div>
        </div>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Open service assistant" className="fixed bottom-5 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-lift transition hover:opacity-90 sm:right-6"><MessageCircle className="h-4 w-4" /> Need help?</button>
    </>
  );
}
