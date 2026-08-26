"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Globe, Sparkles, Upload, FileText, CheckCircle2, AlertCircle, ListPlus, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ParsedBulkItem {
  source_url: string;
  business_name?: string;
  email?: string;
}

export function AddUrlDialog({ variant = "default" }: { variant?: "default" | "outline" | "sidebar" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // Single mode state
  const [url, setUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [emailNotes, setEmailNotes] = useState<string[]>([]);
  const [painPoints, setPainPoints] = useState("Outdated design / looks wrong on phones\nNot enough leads or enquiries\nNobody finds us on Google\nInvisible in AI search\nVisitors don't convert into calls");

  // Bulk mode state
  const [bulkText, setBulkText] = useState("");
  const [bulkParsed, setBulkParsed] = useState<ParsedBulkItem[]>([]);
  const [bulkResult, setBulkResult] = useState<{ createdCount: number; errors: { url: string; error: string }[] } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function parseBulkInput(text: string) {
    setBulkText(text);
    setError(null);
    setBulkResult(null);

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed: ParsedBulkItem[] = [];

    for (const line of lines) {
      // Ignore comment or header rows
      if (line.toLowerCase().startsWith("url,") || line.toLowerCase().startsWith("website,") || line.startsWith("#")) {
        continue;
      }

      // Check CSV / comma separated
      if (line.includes(",") || line.includes("\t")) {
        const parts = line.split(/[,\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ""));
        const rawUrl = parts[0] || "";
        const rawName = parts[1] || "";
        const rawEmail = parts[2] || "";

        if (rawUrl) {
          parsed.push({
            source_url: rawUrl,
            business_name: rawName || undefined,
            email: rawEmail || undefined,
          });
        }
      } else {
        // Plain URL per line
        parsed.push({
          source_url: line,
        });
      }
    }

    setBulkParsed(parsed);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseBulkInput(content);
      }
    };
    reader.readAsText(file);
  }

  async function handleSingleSubmit(e: React.FormEvent) {
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
          pain_points: painPoints.split("\n").map(p => p.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      if (Array.isArray(data.emailNotes) && data.emailNotes.length > 0) setEmailNotes(data.emailNotes);
      setOpen(false);
      setUrl("");
      setBusinessName("");
      setEmail("");
      setPainPoints("Outdated design / looks wrong on phones\nNot enough leads or enquiries\nNobody finds us on Google\nInvisible in AI search\nVisitors don't convert into calls");
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

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (bulkParsed.length === 0) {
      setError("Please enter at least one valid website URL.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setBulkResult(null);

    try {
      const res = await fetch("/api/leads/add-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: bulkParsed,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk upload failed");

      setBulkResult({
        createdCount: data.createdCount || 0,
        errors: data.errors || [],
      });

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk upload failed");
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#0d1738]">
              <Globe className="h-4 w-4 text-[#533afd]" />
              Add Prospect URLs for Manual Outreach
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#42506a]">
            Enter prospect websites to ingest facts, extract brand assets, and prepare interactive X-Ray rebuilds.
          </DialogDescription>
        </DialogHeader>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode("single"); setError(null); }}
            className={`flex-1 py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition ${
              mode === "single"
                ? "bg-white text-[#0d1738] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Link2 className="h-3.5 w-3.5 text-[#533afd]" />
            Single Prospect
          </button>
          <button
            type="button"
            onClick={() => { setMode("bulk"); setError(null); }}
            className={`flex-1 py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition ${
              mode === "bulk"
                ? "bg-white text-[#0d1738] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ListPlus className="h-3.5 w-3.5 text-[#533afd]" />
            Bulk Upload &amp; Batch URLs
          </button>
        </div>

        {/* SINGLE MODE */}
        {mode === "single" && (
          <form onSubmit={handleSingleSubmit} className="space-y-3.5 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="add-url" className="text-xs font-bold text-[#0d1738]">
                Website URL <span className="text-[#e11d48]">*</span>
              </Label>
              <Input
                id="add-url"
                required
                type="text"
                placeholder="e.g. pinnaclerestorations.com or https://..."
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
                Checked on save: the address must be well formed and its domain must actually accept mail.
              </p>
            </div>

                        <div className="space-y-1.5">
              <Label htmlFor="add-pain-points" className="text-xs font-bold text-[#0d1738]">
                Target Intake Pains (One per line)
              </Label>
              <textarea
                id="add-pain-points"
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                rows={5}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y text-xs font-mono"
              />
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
        )}

        {/* BULK MODE */}
        {mode === "bulk" && (
          <form onSubmit={handleBulkSubmit} className="space-y-3.5 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulk-text" className="text-xs font-bold text-[#0d1738]">
                  Paste URLs or CSV List
                </Label>
                <label className="cursor-pointer text-[11px] font-bold text-[#533afd] hover:underline flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  Upload CSV / TXT
                  <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <Textarea
                id="bulk-text"
                rows={6}
                value={bulkText}
                onChange={(e) => parseBulkInput(e.target.value)}
                placeholder={`Paste websites one per line, or CSV rows (url, name, email):\n\nhttps://pinnaclerestorations.com\nsilverridgeroofing.com, Silver Ridge Roofing, contact@silverridge.com\npantherroof.com\nroofninja.com, Roof Ninja, info@roofninja.com`}
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Format: <code>https://website.com</code> or <code>url, Business Name, email@domain.com</code> per line.
              </p>
            </div>

            {/* Parsed summary badge */}
            {bulkParsed.length > 0 && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#0d1738]">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-[#533afd]" />
                    Parsed {bulkParsed.length} Prospect{bulkParsed.length === 1 ? "" : "s"} Ready to Ingest
                  </span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Ready
                  </span>
                </div>

                <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] text-slate-700">
                  {bulkParsed.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                      <span className="truncate max-w-[200px] font-mono text-slate-900">{item.source_url}</span>
                      <span className="truncate max-w-[120px] text-slate-500">{item.business_name || "Auto-scrape name"}</span>
                      <span className="truncate max-w-[110px] text-slate-400">{item.email || "No email"}</span>
                    </div>
                  ))}
                  {bulkParsed.length > 10 && (
                    <p className="text-[10px] font-bold text-slate-500 pt-1 text-center">
                      + {bulkParsed.length - 10} more prospects...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Bulk Result Banner */}
            {bulkResult && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Successfully Ingested {bulkResult.createdCount} Prospects!
                </div>
                <p className="text-[11px] text-emerald-800">
                  All prospects have been added to your leads table and are ready for automated facts scraping &amp; X-Ray rebuilds.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e11d48] bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || bulkParsed.length === 0}
              className="w-full gap-2 bg-[#533afd] hover:bg-[#432bd9] font-bold text-xs"
            >
              {submitting ? (
                `Ingesting ${bulkParsed.length} Prospects...`
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-[#ffd12d]" />
                  Import All {bulkParsed.length || 0} Prospects
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
