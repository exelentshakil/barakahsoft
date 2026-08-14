"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Step 2 of the 2-step intake (plan §3): name/email/phone + TCPA consent.
// Submitting here is what actually creates the lead — step 1's url/pain
// points are passed in and included in the same POST.
export function LeadCaptureModal({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (details: { name: string; email: string; phone: string; tcpaConsent: boolean }) => void;
  submitting: boolean;
  error: string | null;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tcpaConsent, setTcpaConsent] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Where should we send it?</DialogTitle>
          <DialogDescription>Your free redesign lands in 48 hours — we'll text or email you when it's ready.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ name, email, phone, tcpaConsent });
          }}
          className="space-y-3"
        >
          <div>
            <Label htmlFor="lead-name">Name</Label>
            <Input id="lead-name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="lead-email">Email</Label>
            <Input id="lead-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="lead-phone">Phone</Label>
            <Input id="lead-phone" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
          </div>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <Checkbox
              required
              checked={tcpaConsent}
              onChange={(e) => setTcpaConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I agree to be contacted by call, text, or email about this redesign, including by automated means. Consent isn't a
              condition of any purchase.
            </span>
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Sending..." : "Get my free redesign"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
