"use client";

import { useState } from "react";
import { BookmarkPlus, Loader2, Palette, Sparkles, Trash2, Code2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Step 2 of the Studio: the design DNA input.
//
// The operator researches the best site in this lead's industry and drops
// its URL here. It is scraped and distilled into a design spec that governs
// how the generated site LOOKS. It never contributes a word of content —
// the lead's own scrape stays the only source of facts — and the panel says
// so explicitly, because that boundary is the thing that makes borrowing a
// competitor's design direction legitimate rather than plagiarism.

interface DesignDnaShape {
  sourceName: string;
  mood: string;
  palette: Record<string, string>;
  typography: Record<string, string>;
  geometry: Record<string, string>;
  layout: Record<string, string>;
  motifs: string[];
  rationale: string;
}

const SWATCH_ORDER = ["primary", "accent", "surface", "surfaceAlt", "ink", "inkMuted"];

export function InspirationPanel({
  leadId,
  initialUrl,
  initialBranding,
  industry,
  onChange,
}: {
  leadId: string;
  initialUrl: string | null;
  initialBranding: DesignDnaShape | null;
  industry?: string;
  onChange?: () => void;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [branding, setBranding] = useState<DesignDnaShape | null>(initialBranding);
  const [busy, setBusy] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [saved, setSaved] = useState(false);
  const [jsonDraft, setJsonDraft] = useState("");

  async function extract() {
    if (!url.trim()) return;
    setBusy(true);
    setError(null);
    setWarnings([]);
    try {
      const res = await fetch(`/api/leads/${leadId}/inspiration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not read that site");
      setBranding(data.branding);
      setWarnings(data.warnings ?? []);
      setJsonDraft(JSON.stringify(data.branding, null, 2));
      onChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveJson() {
    setBusy(true);
    setError(null);
    try {
      const parsed = JSON.parse(jsonDraft);
      const res = await fetch(`/api/leads/${leadId}/inspiration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branding: parsed, url: url.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "That JSON was rejected");
      setBranding(data.branding);
      setShowJson(false);
      onChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    } finally {
      setBusy(false);
    }
  }

  // Curating a reference is the highest-leverage action here: it applies to
  // every future lead in this industry automatically.
  async function saveToLibrary() {
    if (!industry?.trim()) {
      setError("Set the lead's Exact Industry below before saving this to the library.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/inspiration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveToLibrary: true, industry }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save to the library");
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    setBusy(true);
    try {
      await fetch(`/api/leads/${leadId}/inspiration`, { method: "DELETE" });
      setBranding(null);
      setUrl("");
      setWarnings([]);
      onChange?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#533afd]/25 bg-[#fbfaff] p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f0f3ff] text-[#533afd]">
              <Palette className="h-3.5 w-3.5" />
            </span>
            <h4 className="text-sm font-bold text-[#0d1738]">What their site should look like</h4>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            We already picked a look that suits this trade. You only need to touch this if you want a different one:
            paste the best site you know in their trade and we copy its colours, fonts and spacing. Then{" "}
            <b>Use for this trade</b> makes every future lead in this trade look like it too.{" "}
            <span className="font-semibold text-[#0d1738]">
              We only copy the look — never their words, claims or reviews.
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Label htmlFor="inspiration-url" className="sr-only">
            Inspiration site URL
          </Label>
          <Input
            id="inspiration-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://the-best-site-in-this-industry.com"
            className="h-9 bg-white text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                extract();
              }
            }}
          />
        </div>
        <Button
          type="button"
          onClick={extract}
          disabled={busy || !url.trim()}
          className="h-9 gap-2 bg-[#0d1738] px-4 text-xs font-bold text-white hover:bg-[#1b2a5c]"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-[#ffd12d]" />}
          {busy ? "Reading site..." : "Copy this look"}
        </Button>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-md bg-red-50 p-2 text-[11px] font-medium text-red-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {warnings.length > 0 && (
        <ul className="space-y-1 rounded-md bg-amber-50 p-2 text-[11px] text-amber-800">
          {warnings.map((w) => (
            <li key={w}>• {w}</li>
          ))}
        </ul>
      )}

      {branding && !showJson && (
        <div className="space-y-3 rounded-md border border-border bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[#0d1738]">{branding.sourceName}</p>
              <p className="text-[11px] text-muted-foreground">{branding.rationale}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => {
                  setJsonDraft(JSON.stringify(branding, null, 2));
                  setShowJson(true);
                }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[#533afd] hover:bg-[#f0f3ff]"
              >
                <Code2 className="h-3 w-3" /> Edit JSON
              </button>
              <button
                type="button"
                onClick={saveToLibrary}
                disabled={busy}
                title="Reuse this direction for every future lead in this industry"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                <BookmarkPlus className="h-3 w-3" /> {saved ? "Saved" : "Use for this trade"}
              </button>
              <button
                type="button"
                onClick={clear}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SWATCH_ORDER.filter((key) => branding.palette?.[key]).map((key) => (
              <span key={key} className="flex items-center gap-1.5 rounded-md border border-border px-1.5 py-1">
                <span
                  className="h-4 w-4 rounded"
                  style={{ background: branding.palette[key], border: "1px solid rgba(0,0,0,0.12)" }}
                />
                <span className="font-mono text-[10px] text-muted-foreground">{branding.palette[key]}</span>
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {[
              branding.mood,
              branding.layout?.heroTreatment,
              branding.layout?.serviceLayout,
              branding.layout?.proofStyle,
              `${branding.layout?.sectionRhythm} rhythm`,
              `${branding.geometry?.radius} corners`,
              branding.typography?.displayFamily,
            ]
              .filter(Boolean)
              .map((tag) => (
                <span key={tag as string} className="rounded-full bg-[#f0f3ff] px-2 py-0.5 font-semibold text-[#533afd]">
                  {tag as string}
                </span>
              ))}
          </div>

          {branding.motifs?.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-[#0d1738]">Signature motifs: </span>
              {branding.motifs.join(" · ")}
            </p>
          )}
        </div>
      )}

      {branding && showJson && (
        <div className="space-y-2">
          <Textarea
            rows={16}
            value={jsonDraft}
            onChange={(e) => setJsonDraft(e.target.value)}
            className="bg-white font-mono text-[11px]"
          />
          <div className="flex gap-2">
            <Button type="button" onClick={saveJson} disabled={busy} className="h-8 bg-[#533afd] text-xs font-bold text-white hover:bg-[#432bd9]">
              {busy ? "Saving..." : "Save design DNA"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowJson(false)} className="h-8 text-xs">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!branding && (
        <p className="text-[11px] text-muted-foreground">
          No direction set yet. One is chosen automatically as soon as scraping finishes — paste a URL above only if you
          want to override it.
        </p>
      )}
    </div>
  );
}
