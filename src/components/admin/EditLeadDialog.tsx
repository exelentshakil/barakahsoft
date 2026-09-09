"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The verticals an operator can choose.
 *
 * Listed rather than imported from the profile registry: this is a client
 * component, and importing the registry would pull every profile's prompts,
 * photo templates and art direction into the browser for a dropdown of six
 * labels. The API validates the slug against the real registry.
 */
const VERTICAL_OPTIONS = [
  { slug: "home-services", label: "Home & Trade Services" },
  { slug: "health-wellness", label: "Health & Medical Practice" },
  { slug: "hospitality-food", label: "Restaurant & Hospitality" },
  { slug: "salon-wellness", label: "Salon, Spa & Fitness" },
  { slug: "professional-services", label: "Professional & B2B Services" },
  { slug: "local-retail", label: "Local Shop & Retail" },
];

export function EditLeadDialog({
  leadId,
  businessName,
  sourceUrl,
  contactName,
  phone,
  email,
  painPoints,
  verticalSlug,
  icpCategory,
  icpFit,
}: {
  leadId: string;
  businessName: string | null;
  sourceUrl: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  painPoints?: string[];
  /** The operator's vertical override, if one is set. */
  verticalSlug?: string | null;
  /** What the router classified this as, and whether we serve it. */
  icpCategory?: string | null;
  icpFit?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(businessName ?? "");
  const [url, setUrl] = useState(sourceUrl);
  const [contact, setContact] = useState(contactName ?? "");
  const [phoneValue, setPhoneValue] = useState(phone ?? "");
  const [emailValue, setEmailValue] = useState(email ?? "");
  const [painPointsValue, setPainPointsValue] = useState(painPoints?.join("\n") ?? "");
  const [vertical, setVertical] = useState(verticalSlug ?? "");
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
          contact_name: contact,
          phone: phoneValue,
          email: emailValue,
          pain_points: painPointsValue.split("\n").map((p) => p.trim()).filter(Boolean),
          vertical_slug: vertical,
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
            <Label htmlFor="edit-vertical">Vertical</Label>
            <select
              id="edit-vertical"
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">
                Auto — {icpCategory ?? "not classified yet"}
                {icpFit ? ` (${icpFit})` : ""}
              </option>
              {VERTICAL_OPTIONS.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              {icpFit === "unsupported"
                ? "This business was classified as outside what the engine builds well, so generation is blocked. Choosing a vertical here overrides that and builds anyway."
                : "Leave on Auto unless the classifier got it wrong. This decides the page's sections, wording, call to action and art direction."}
            </p>
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

          
          <div>
            <Label htmlFor="edit-pain-points">Target Intake Pains (One per line)</Label>
            <textarea
              id="edit-pain-points"
              value={painPointsValue}
              onChange={(e) => setPainPointsValue(e.target.value)}
              rows={4}
              className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              placeholder="e.g. Outdated design\nNot enough leads"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              These pains are fed to the AI to customize the generated copy and audit sections.
            </p>
          </div>

          {notes.length > 0 && (
            <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
              {notes.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
          )}


          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
