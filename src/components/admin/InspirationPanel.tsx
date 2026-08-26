"use client";

import { useState } from "react";
import { BookmarkPlus, Loader2, Palette, Sparkles, Trash2, Code2, AlertTriangle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [expanded, setExpanded] = useState(false);

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
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-5 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#533afd] shadow-2xs">
            <Palette className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              Design Direction &amp; Industry Archetype
              {branding?.sourceName && (
                <span className="text-[11px] font-semibold text-slate-500">
                  · {branding.sourceName}
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500">
              Only borrows layout, rhythm, geometry, and fonts — never client text or claims.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          <span>{expanded ? "Hide Look Controls" : "Change Reference Look"}</span>
        </button>
      </div>

      {/* Expandable URL Input */}
      {expanded && (
        <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <Label htmlFor="inspiration-url" className="sr-only">
                Inspiration site URL
              </Label>
              <Input
                id="inspiration-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste reference website (e.g. https://pinnaclerestorations.com/)"
                className="h-9 bg-white text-xs border-slate-200 rounded-xl"
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
              className="h-9 gap-1.5 bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 rounded-xl shadow-xs"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-amber-300" />}
              {busy ? "Reading..." : "Apply Look"}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-[11px] font-medium text-rose-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {warnings.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-800">
          {warnings.map((w) => (
            <li key={w}>• {w}</li>
          ))}
        </ul>
      )}

      {/* Active Branding Strip */}
      {branding && !showJson && (
        <div className="mt-3 rounded-xl bg-white p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">{branding.sourceName}</span>
              {branding.rationale && (
                <span className="text-[10px] text-slate-500 truncate max-w-[280px]">
                  — {branding.rationale}
                </span>
              )}
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setJsonDraft(JSON.stringify(branding, null, 2));
                  setShowJson(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition"
              >
                <Code2 className="h-3 w-3" /> Edit JSON
              </button>
              <button
                type="button"
                onClick={saveToLibrary}
                disabled={busy}
                title="Reuse this direction for every future lead in this industry"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition"
              >
                <BookmarkPlus className="h-3 w-3" /> {saved ? "Saved ✓" : "Save for Trade"}
              </button>
              <button
                type="button"
                onClick={clear}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
            {/* Color Swatches */}
            <div className="flex items-center gap-1.5">
              {SWATCH_ORDER.filter((key) => branding.palette?.[key]).map((key) => (
                <span
                  key={key}
                  title={`${key}: ${branding.palette[key]}`}
                  className="flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5 bg-slate-50"
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-2xs"
                    style={{ background: branding.palette[key] }}
                  />
                  <span className="font-mono text-[9px] font-semibold text-slate-600">{branding.palette[key]}</span>
                </span>
              ))}
            </div>

            {/* Design DNA Tags */}
            <div className="flex flex-wrap gap-1 text-[9.5px]">
              {[
                branding.mood,
                branding.layout?.heroTreatment,
                branding.layout?.serviceLayout,
                `${branding.layout?.sectionRhythm} rhythm`,
                `${branding.geometry?.radius} corners`,
                branding.typography?.displayFamily,
              ]
                .filter(Boolean)
                .map((tag) => (
                  <span key={tag as string} className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                    {tag as string}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}

      {branding && showJson && (
        <div className="mt-3 space-y-2">
          <Textarea
            rows={12}
            value={jsonDraft}
            onChange={(e) => setJsonDraft(e.target.value)}
            className="bg-white font-mono text-[11px] rounded-xl border-slate-200"
          />
          <div className="flex gap-2">
            <Button type="button" onClick={saveJson} disabled={busy} className="h-8 bg-[#533afd] text-xs font-bold text-white hover:bg-[#432bd9] rounded-lg">
              {busy ? "Saving..." : "Save Design DNA"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowJson(false)} className="h-8 text-xs">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
