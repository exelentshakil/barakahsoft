"use client";

import { useCallback, useEffect, useState } from "react";
import { Code2, Loader2, X, Check, RefreshCw, AlertTriangle, Wand2, Image as ImageIcon, MousePointerClick } from "lucide-react";

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

type Tab = "sections" | "css" | "chrome";

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

  // Header and footer are not markup — see /api/leads/[id]/chrome.
  const [chrome, setChrome] = useState("");
  const [chromeLoaded, setChromeLoaded] = useState(false);

  // Refine one section from an instruction, optionally against a reference
  // image (an uploaded screenshot or an exported Figma frame).
  const [instruction, setInstruction] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Inline editing: the page itself is the editor.
  //
  // Raw markup in a textarea is precise but it is the wrong tool for the
  // edits that actually come up — a stray line break in an address, a word
  // in a heading. Those are faster to fix where you can see them. Structural
  // work still belongs in the markup tab, which is why both exist.
  const [inline, setInline] = useState(false);
  const [touched, setTouched] = useState<string[]>([]);

  const stopInline = useCallback(() => {
    document.querySelectorAll<HTMLElement>("[data-op-edit]").forEach((el) => {
      el.removeAttribute("contenteditable");
      el.removeAttribute("data-op-edit");
      el.style.removeProperty("outline");
      el.style.removeProperty("outline-offset");
    });
  }, []);

  const startInline = useCallback(() => {
    let armed = 0;
    document.querySelectorAll<HTMLElement>("section[id]").forEach((el) => {
      el.setAttribute("contenteditable", "true");
      el.setAttribute("data-op-edit", el.id);
      el.style.setProperty("outline", "1px dashed rgba(251,191,36,0.65)");
      el.style.setProperty("outline-offset", "-2px");
      armed++;
    });
    if (armed === 0) setError("No sections with an id found on this page.");
  }, []);

  useEffect(() => {
    if (!inline) { stopInline(); return; }
    startInline();
    const onInput = (e: Event) => {
      const host = (e.target as HTMLElement | null)?.closest?.("[data-op-edit]") as HTMLElement | null;
      const id = host?.getAttribute("data-op-edit");
      if (id) setTouched((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };
    document.addEventListener("input", onInput, true);
    return () => { document.removeEventListener("input", onInput, true); stopInline(); };
  }, [inline, startInline, stopInline]);

  /** Read a section back out of the DOM without the editing attributes. */
  function serialiseSection(id: string): string | null {
    const el = document.querySelector<HTMLElement>(`section[data-op-edit="${CSS.escape(id)}"]`);
    if (!el) return null;
    const clone = el.cloneNode(true) as HTMLElement;
    clone.removeAttribute("contenteditable");
    clone.removeAttribute("data-op-edit");
    clone.style.removeProperty("outline");
    clone.style.removeProperty("outline-offset");
    if (!clone.getAttribute("style")) clone.removeAttribute("style");
    clone.querySelectorAll("[contenteditable]").forEach((c) => c.removeAttribute("contenteditable"));
    return clone.outerHTML;
  }

  async function saveInline() {
    if (touched.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      for (const id of touched) {
        const html = serialiseSection(id);
        if (!html) continue;
        const res = await fetch(`/api/leads/${leadId}/sections`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionId: id, html }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) { setError(`${id}: ${data?.error ?? "save failed"}`); return; }
      }
      setSaved(true);
      setTouched([]);
      setTimeout(() => window.location.reload(), 600);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  const loadChrome = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/chrome`);
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error ?? "Could not load header/footer."); return; }
      setChrome(JSON.stringify(data.chromeSpec ?? {}, null, 2));
      setChromeLoaded(true);
    } catch {
      setError("Could not reach the server.");
    }
  }, [leadId]);

  // Uploaded rather than inlined: a retry then costs a URL instead of
  // re-sending several megabytes of base64, and one path per lead is
  // overwritten each time so references never accumulate in the bucket.
  async function attachImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("That file is not an image."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Image is over 8MB — export it smaller."); return; }
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/leads/${leadId}/reference-image`, { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error ?? "Upload failed."); return; }
      setImage(data.url);
      setImageName(data.name ?? file.name);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setUploading(false);
    }
  }

  async function refine() {
    if (!activeId || !instruction.trim()) return;
    setRefining(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/sections/${activeId}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction, image: image ?? undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error ?? "Refine failed."); return; }
      setDraft(data.section?.html ?? draft);
      setSaved(true);
      setTimeout(() => window.location.reload(), 600);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setRefining(false);
    }
  }

  async function saveChrome() {
    setSaving(true);
    setError(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(chrome);
      } catch {
        setError("That is not valid JSON.");
        return;
      }
      const res = await fetch(`/api/leads/${leadId}/chrome`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chromeSpec: parsed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error ?? "Save failed."); return; }
      setSaved(true);
      setTimeout(() => window.location.reload(), 600);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

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

  const dirty =
    tab === "css"
      ? cssDraft !== css
      : tab === "chrome"
        ? chromeLoaded
        : Boolean(activeId) && draft !== sections.find((s) => s.id === activeId)?.html;

  // Closed, the panel collapses to a bar so inline editing can be used with
  // the whole page visible — a side panel covering half the site is the
  // wrong shape for "fix this heading".
  if (!open) {
    return (
      <div className="fixed bottom-5 left-5 z-[9999] flex items-center gap-2 rounded-full bg-slate-900 p-1.5 pl-2 shadow-lg">
        <button
          type="button"
          onClick={() => setInline((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
            inline ? "bg-amber-300 text-slate-900" : "text-slate-200 hover:bg-slate-800"
          }`}
          title="Click any text on the page and type"
        >
          <MousePointerClick className="h-3.5 w-3.5" />
          {inline ? "Editing page" : "Edit on page"}
        </button>

        {inline && touched.length > 0 && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveInline()}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save {touched.length}
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-800"
        >
          <Code2 className="h-3.5 w-3.5" />
          Code
        </button>

        {error && (
          <span className="max-w-[16rem] truncate pr-2 text-[11px] text-red-300" title={error}>
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 z-[9999] flex w-full max-w-2xl flex-col border-l border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <Code2 className="h-4 w-4 text-amber-300" />
          <span className="text-sm font-bold">Operator code editor</span>
          <div className="flex rounded-md border border-slate-700 p-0.5 text-[11px] font-bold">
            {(["sections", "chrome", "css"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t); setSaved(false); setError(null);
                  if (t === "chrome" && !chromeLoaded) void loadChrome();
                }}
                className={`rounded px-2.5 py-1 transition ${tab === t ? "bg-amber-300 text-slate-900" : "text-slate-300 hover:text-white"}`}
              >
                {t === "sections" ? "Sections" : t === "chrome" ? "Header & footer" : "Stylesheet"}
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

          {activeId && (
            <div className="border-t border-slate-700 p-4 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Rebuild from an instruction, and optionally a reference image
              </label>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g. match the layout in the attached screenshot; keep our copy and colours"
                className="h-16 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none focus:border-amber-300"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer rounded-md border border-slate-600 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 transition hover:border-amber-300 hover:text-amber-300">
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => void attachImage(e.target.files?.[0])} />
                  {uploading ? "Uploading…" : imageName ? "Change image" : "Attach screenshot"}
                </label>
                {imageName && (
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <ImageIcon className="h-3 w-3" />
                    {imageName}
                    <button type="button" onClick={() => { setImage(null); setImageName(null); }} className="text-slate-500 hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  disabled={refining || uploading || !instruction.trim()}
                  onClick={() => void refine()}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-amber-300/40 bg-amber-300/10 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition hover:bg-amber-300/20 disabled:opacity-40"
                >
                  {refining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  {refining ? "Rebuilding…" : "Rebuild section"}
                </button>
              </div>
              <p className="text-[10px] leading-snug text-slate-500">
                A Figma <em>file</em> link cannot be read — it serves HTML, not an image. Export the frame as PNG and
                attach it here, or paste a direct image URL into the instruction.
              </p>
            </div>
          )}
        </>
      ) : tab === "chrome" ? (
        <div className="flex flex-1 flex-col overflow-hidden p-4">
          <p className="mb-2 rounded-md border border-slate-700 bg-slate-950/60 p-2.5 text-[11px] leading-relaxed text-slate-300">
            The header and footer are reviewed React components, not generated
            markup — the sanitiser strips <code className="text-amber-300">header</code>,{" "}
            <code className="text-amber-300">footer</code>, <code className="text-amber-300">nav</code> and{" "}
            <code className="text-amber-300">form</code> outright, because model-written chrome is how a site ends up
            linking at pages that were never built and how tracked call buttons stop being tracked. This spec is what
            they render from, so it is the editable unit. Nothing here can produce a broken link.
          </p>
          <textarea
            value={chrome}
            onChange={(e) => { setChrome(e.target.value); setSaved(false); }}
            spellCheck={false}
            placeholder={chromeLoaded ? "" : "Loading header/footer spec…"}
            className="flex-1 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-[12px] leading-relaxed text-slate-100 outline-none focus:border-amber-300"
          />
        </div>
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
          onClick={() => (tab === "css" ? void saveCss() : tab === "chrome" ? void saveChrome() : void saveSection())}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-300 px-3.5 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-amber-200 disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
          {saving ? "Saving…" : saved ? "Saved — reloading" : "Save & reload"}
        </button>
      </div>
    </div>
  );
}
