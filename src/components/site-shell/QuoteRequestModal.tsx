"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { SitePayload } from "@/components/site-shell/types";

// Real, server-sent lead capture for the delivered site -- replaces relying
// on a mailto: link (dead if the visitor has no configured email client)
// with an actual POST that emails the client directly. This is the
// conversion mechanism the sold "website + Facebook ads lead gen" bundle
// is actually built on, so it has to work without any client-side
// assumption about the visitor's environment.
export function QuoteRequestModal({
  payload,
  open,
  onOpenChange,
}: {
  payload: SitePayload;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/s/${payload.leadSlug}/quote-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong — please try again or call directly.");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again or call directly.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      // Reset after the close animation, not immediately -- avoids a
      // visible flash of the empty form before the dialog fades out.
      setTimeout(() => {
        setName("");
        setContact("");
        setMessage("");
        setSuccess(false);
        setError(null);
      }, 200);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {success ? (
          <div className="py-4 text-center">
            <DialogTitle>Request sent</DialogTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {payload.businessName} will get back to you shortly.
              {payload.nap.phone && <> Need it faster? Call {payload.nap.phone}.</>}
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Get a free quote</DialogTitle>
              <DialogDescription>Tell {payload.businessName} a bit about what you need — they'll reach out directly.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="quote-name">Name</Label>
                <Input id="quote-name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="quote-contact">Email or phone</Label>
                <Input id="quote-contact" required value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="quote-message">What do you need? (optional)</Label>
                <Textarea id="quote-message" value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1" />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" size="lg" disabled={submitting} className="w-full">
                {submitting ? "Sending..." : "Send request"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
