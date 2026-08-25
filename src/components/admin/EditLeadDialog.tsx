"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditLeadDialog({
  leadId,
  businessName,
  sourceUrl,
  facebookPixelId,
  googleSiteVerification,
  contactName,
  phone,
  email,
}: {
  leadId: string;
  businessName: string | null;
  sourceUrl: string;
  facebookPixelId?: string | null;
  googleSiteVerification?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(businessName ?? "");
  const [url, setUrl] = useState(sourceUrl);
  const [pixelId, setPixelId] = useState(facebookPixelId ?? "");
  const [gscToken, setGscToken] = useState(googleSiteVerification ?? "");
  const [contact, setContact] = useState(contactName ?? "");
  const [phoneValue, setPhoneValue] = useState(phone ?? "");
  const [emailValue, setEmailValue] = useState(email ?? "");
  const [notes, setNotes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: name,
          source_url: url,
          facebook_pixel_id: pixelId,
          google_site_verification: gscToken,
          contact_name: contact,
          phone: phoneValue,
          email: emailValue,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      // Advisory findings on the address — a shared inbox, a free mailbox —
      // are worth seeing but never block the save.
      if (Array.isArray(data.emailNotes) && data.emailNotes.length > 0) {
        setNotes(data.emailNotes);
        router.refresh();
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Edit lead">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit lead</DialogTitle>
          <DialogDescription>Correct the business name, website and contact details. These are what the delivered site and every outreach email use.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="edit-business-name">Business name</Label>
            <Input id="edit-business-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="edit-source-url">Website URL</Label>
            <Input id="edit-source-url" required type="url" value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-contact-name">Contact name</Label>
              <Input
                id="edit-contact-name"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="mt-1"
                placeholder="e.g. Shakil"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value)}
                className="mt-1"
                placeholder="e.g. (702) 213-5972"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={emailValue}
              onChange={(e) => {
                setEmailValue(e.target.value);
                setNotes([]);
              }}
              className="mt-1"
              placeholder="e.g. owner@business.com"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Where the proposal and every outreach email goes. Checked on save — the domain has to actually accept mail.
            </p>
          </div>

          {notes.length > 0 && (
            <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
              {notes.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
          )}

          <div>
            <Label htmlFor="edit-pixel-id">Client's Facebook Pixel ID (optional)</Label>
            <Input
              id="edit-pixel-id"
              placeholder="e.g. 123456789012345"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              For tracking on the client&apos;s own delivered site once they provide it — separate from our own ad tracking.
            </p>
          </div>
          <div>
            <Label htmlFor="edit-gsc-token">Google Search Console verification token (optional)</Label>
            <Input
              id="edit-gsc-token"
              placeholder="e.g. abc123def456..."
              value={gscToken}
              onChange={(e) => setGscToken(e.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Paste the token from GSC&apos;s HTML tag verification method, once the lead&apos;s custom domain is live.
            </p>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
