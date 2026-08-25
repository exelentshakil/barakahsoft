"use client";

import { useCallback, useEffect, useState } from "react";
import { Code2, Loader2, X, Check, RefreshCw, AlertTriangle } from "lucide-react";

// Direct code editing on the live preview, for operators only.
//
// The Live Section Studio can already ask a model to rebuild a section, but
// the things that actually need fixing at this stage are not prompt-shaped:
// an address broken across two lines, a card that wraps one column early, a
// heading a few pixels too large. Describing those to a model and hoping is
// slower and less certain than editing the markup, and a regeneration risks
// the parts that were already right.
//
// So this is the other half: the real HTML for one section, edited and
// saved, plus the page stylesheet for the small CSS breaks. Both go through
// the same sanitiser as generated output — an operator pasting a <script> is
// the same hole as a model emitting one.
//
// The client never sees this; the server only renders it for an allowlisted
// operator session.

interface Section {
  id: string;
  kind: string;
  label: string;
  html: string;
}

type Tab = "sections" | "css";

export function OperatorSectionEditor({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("sections");
  const [sections, setSections] = useState<Section[]>([]);
  const [css, setCss] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [cssDraft, setCssDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/sections`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Could not load sections.");
        return;
      }
      setSections(data.sections ?? []);
      setCss(data.css ?? "");
      setCssDraft(data.css ?? "");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (open && sections.length === 0 && !loading) void load();
  }, [open, sections.length, loading, load]);

  function selectSection(section: Section) {
    setActiveId(section.id);
    setDraft(section.html);
    setSaved(false);
    setError(null);
    // Bring the real section into view behind the panel so the operator can
    // see what they are editing.
    document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveSection() {
    if (!activeId) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/leads/${leadId}/sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: activeId, html: draft }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Save failed.");
        return;
      }
      setSaved(true);
      // The page is server-rendered from the stored HTML, so the edit is
      // only visible after a reload.
      setTimeout(() => window.location.reload(), 600);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCss() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // PATCH requires a section; the stylesheet belongs to the page, so it
      // goes through the whole-document save instead.
      const res = await fetch(`/api/leads/${leadId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections, css: cssDraft }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Save failed.");
        return;
      }
      setSaved(true);
      setTimeout(() => window.location.reload(), 600);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  const dirty = tab === "css" ? cssDraft !== css : Boolean(activeId) && draft !== sections.find((s) => s.id === activeId)?.html;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-[9999] inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-slate-800"
      >
        <Code2 className="h-4 w-4" />
        Edit code
      </button>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 z-[9999] flex w-full max-w-2xl flex-col border-l border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <Code2 className="h-4 w-4 text-amber-300" />
          <span className="text-sm font-bold">Operator code editor</span>
          <div className="flex rounded-md border border-slate-700 p-0.5 text-[11px] font-bold">
            {(["sections", "css"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setSaved(false); setError(null); }}
                className={`rounded px-2.5 py-1 transition ${tab === t ? "bg-amber-300 text-slate-900" : "text-slate-300 hover:text-white"}`}
              >
                {t === "sections" ? "Sections" : "Stylesheet"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load()} title="Reload from server" className="rounded p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <p className="flex items-start gap-2 border-b border-red-900/50 bg-red-950/40 px-4 py-2 text-xs text-red-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {tab === "sections" ? (
        <>
          <div className="flex flex-wrap gap-1.5 border-b border-slate-700 px-4 py-2.5">
            {loading && sections.length === 0 && <span className="text-xs text-slate-400">Loading sections…</span>}
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => selectSection(section)}
                className={`rounded px-2 py-1 text-[11px] font-bold transition ${
                  activeId === section.id ? "bg-amber-300 text-slate-900" : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {section.label || section.id}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden p-4">
            {activeId ? (
              <textarea
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setSaved(false); }}
                spellCheck={false}
                className="h-full w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-[12px] leading-relaxed text-slate-100 outline-none focus:border-amber-300"
              />
            ) : (
              <p className="text-sm text-slate-400">Pick a section above to edit its markup.</p>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-hidden p-4">
          <textarea
            value={cssDraft}
            onChange={(e) => { setCssDraft(e.target.value); setSaved(false); }}
            spellCheck={false}
            className="h-full w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-[12px] leading-relaxed text-slate-100 outline-none focus:border-amber-300"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-slate-700 px-4 py-3">
        <p className="text-[11px] text-slate-400">
          {tab === "css"
            ? `${cssDraft.length.toLocaleString()} characters · saved stylesheet is scoped and sanitised`
            : activeId
              ? "Markup is sanitised on save, same as generated output"
              : "No section selected"}
        </p>
        <button
          type="button"
          disabled={saving || !dirty}
          onClick={() => (tab === "css" ? void saveCss() : void saveSection())}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-300 px-3.5 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-amber-200 disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
          {saving ? "Saving…" : saved ? "Saved — reloading" : "Save & reload"}
        </button>
      </div>
    </div>
  );
}
