"use client";

import { useState } from "react";
import { Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { SitePayload } from "@/components/site-shell/types";

// A real, working booking flow with zero calendar/scheduling backend to
// build — a "Calendly-style form that hands off to email" per the explicit
// ask, and an explicit placeholder for a real booking tool once the client
// has one. Falls back to a prominent call-to-book CTA when no real email
// was scraped, never inventing one.
export function BookingForm({ payload }: { payload: SitePayload }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [message, setMessage] = useState("");

  if (!payload.nap.email) {
    if (!payload.nap.phone) return null;
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center shadow-card">
        <p className="font-medium">Ready to book?</p>
        <p className="mt-1 text-sm text-muted-foreground">Call {payload.businessName} directly to set up a time.</p>
        <Button asChild size="lg" className="mt-4">
          <a href={`tel:${payload.nap.phone}`}>
            <Phone className="h-4 w-4" /> Call {payload.nap.phone}
          </a>
        </Button>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = `Booking request from ${name || "a website visitor"}`;
    const bodyLines = [
      `Name: ${name}`,
      `Contact: ${contact}`,
      preferredTime ? `Preferred time: ${preferredTime}` : null,
      message ? `Message: ${message}` : null,
    ].filter(Boolean);
    const mailto = `mailto:${payload.nap.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = mailto;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
      <div>
        <Label htmlFor="booking-name">Name</Label>
        <Input id="booking-name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="booking-contact">Email or phone</Label>
        <Input id="booking-contact" required value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="booking-time">Preferred date/time (optional)</Label>
        <Input id="booking-time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="booking-message">What do you need? (optional)</Label>
        <Textarea id="booking-message" value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1" />
      </div>
      <Button type="submit" size="lg" className="w-full">
        <Mail className="h-4 w-4" /> Send booking request
      </Button>
    </form>
  );
}
