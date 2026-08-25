"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Globe, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddUrlDialog({ variant = "default" }: { variant?: "default" | "outline" | "sidebar" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  // Advisory findings from validation — a shared inbox or a free mailbox is
  // worth knowing about but is not a reason to refuse the prospect.
  const [emailNotes, setEmailNotes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/add-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_url: url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`,
          business_name: businessName.trim() || undefined,
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      // Advisory notes are shown rather than swallowed, but they never block
      // the save — the prospect was created either way.
      if (Array.isArray(data.emailNotes) && data.emailNotes.length > 0) setEmailNotes(data.emailNotes);
      setOpen(false);
      setUrl("");
      setBusinessName("");
      setEmail("");
      const leadId = data.lead_id || data.lead?.id;
      if (leadId) {
        router.push(`/admin/leads/${leadId}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "sidebar" ? (
          <Button
            size="sm"
            className="w-full gap-1.5 bg-[#533afd] hover:bg-[#432bd9] text-white font-bold text-xs shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Add Lead URL
          </Button>
        ) : (
          <Button
            size="sm"
            variant={variant === "outline" ? "outline" : "default"}
            className="gap-1.5 bg-[#533afd] hover:bg-[#432bd9] text-white font-bold text-xs shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Add Lead URL
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#0d1738]">
            <Globe className="h-4 w-4 text-[#533afd]" />
            Add Prospect URL for Manual Outreach
          </DialogTitle>
          <DialogDescription className="text-xs text-[#42506a]">
            Enter a prospect&apos;s website to ingest their facts, extract brand assets, and prepare an interactive X-Ray rebuild.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="add-url" className="text-xs font-bold text-[#0d1738]">
              Website URL <span className="text-[#e11d48]">*</span>
            </Label>
            <Input
              id="add-url"
              required
              type="text"
              placeholder="e.g. pinnacle-restoration.com or https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-name" className="text-xs font-bold text-[#0d1738]">
              Business Name <span className="text-[10px] font-normal text-muted-foreground">(optional — scraped automatically)</span>
            </Label>
            <Input
              id="add-name"
              type="text"
              placeholder="e.g. Pinnacle Restoration"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-email" className="text-xs font-bold text-[#0d1738]">
              Email <span className="text-[10px] font-normal text-muted-foreground">(needed to send the outreach sequence)</span>
            </Label>
            <Input
              id="add-email"
              type="email"
              placeholder="e.g. info@pinnaclerestoration.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailNotes([]); }}
              className="text-xs"
            />
            <p className="text-[10px] leading-snug text-muted-foreground">
              Checked on save: the address must be well formed and its domain must actually accept mail. Bounces are
              what move a sending domain into the spam folder for every other prospect.
            </p>
          </div>

          {emailNotes.length > 0 && (
            <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900">
              {emailNotes.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
          )}

          {error && <p className="text-xs font-semibold text-[#e11d48] bg-rose-50 p-2.5 rounded-lg border border-rose-200">{error}</p>}

          <Button
            type="submit"
            disabled={submitting || !url.trim()}
            className="w-full gap-2 bg-[#533afd] hover:bg-[#432bd9] font-bold text-xs"
          >
            {submitting ? (
              "Adding Prospect..."
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-[#ffd12d]" />
                Add & Open Lead Workspace
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

