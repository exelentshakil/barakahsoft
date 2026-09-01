"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Code2, Loader2, X, Check, RefreshCw, AlertTriangle, Wand2, Image as ImageIcon, MousePointerClick, Paintbrush, Undo2, Stethoscope, ChevronRight } from "lucide-react";
import { scanPage, inspect, colourFixes, type Finding, type Fix } from "@/components/site-shell/style-doctor";
import {
  applyLiveCss,
  clearLiveCss,
  replaceSection,
  rearmRuntime,
  serialiseElement,
  selectorFor,
  broadSelector,
  withOverrides,
  readOverrides,
  type Override,
} from "@/components/site-shell/live-preview";

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
// Everything applies to the page you are looking at, as you type. This used
// to end every save with window.location.reload(), which for a two-pixel fix
// cost more than the fix: save, flash, scroll back, discover it was still
// wrong. The database is still the source of truth and the save still
// happens — it just stopped being the only way to see the result.
//
// The one exception is the header and footer, which are React components
// rather than stored markup and so genuinely cannot be swapped in place.
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
  // Hidden entirely in clean mode. The toolbar is fixed-position operator
  // furniture, so it lands in any capture of the whole page and in every
  // showcase embed — neither of which should show our own controls to a
  // client. ?clean=1 removes it without signing the operator out.
  const [clean, setClean] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("sections");
  const [sections, setSections] = useState<Section[]>([]);
  const [css, setCss] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [cssDraft, setCssDraft] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setClean(params.get("clean") === "1" || params.get("showcase") === "1");
  }, []);
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
  //
  // "text" makes the sections editable; "style" turns clicks into a style
  // inspector instead. They are separate modes because they want the same
  // click: with contenteditable on, clicking a heading places a caret, which
  // is the wrong answer when what you wanted was to change its colour.
  const [mode, setMode] = useState<"off" | "text" | "style">("off");
  const [touched, setTouched] = useState<string[]>([]);

  // The style inspector: one element at a time, and the rules clicking it
  // has produced so far.
  const [picked, setPicked] = useState<{ selector: string; matches: number; label: string; crumbs: { label: string; el: HTMLElement }[] } | null>(null);
  const [overrides, setOverrides] = useState<Override[]>([]);

  // What the doctor found: on the picked element, and across the page.
  // "This one" vs "everything that looks like it". Fixing one card and then
  // hunting down its five siblings by hand is the difference between a tool
  // you reach for and one you avoid.
  const [scopeAll, setScopeAll] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [pageFindings, setPageFindings] = useState<Finding[] | null>(null);
  const [scanning, setScanning] = useState(false);

  // The stylesheet as the page is currently showing it. Kept in a ref as
  // well as state because the live-apply effect must not re-run on every
  // keystroke of an unrelated field.
  const cssRef = useRef("");
  useEffect(() => { cssRef.current = cssDraft; }, [cssDraft]);

  const stopInline = useCallback(() => {
    document.querySelectorAll<HTMLElement>("[data-op-edit]").forEach((el) => {
      el.removeAttribute("contenteditable");
      el.removeAttribute("data-op-edit");
      el.style.removeProperty("outline");
      el.style.removeProperty("outline-offset");
    });
    document.querySelectorAll<HTMLElement>("[data-op-picked]").forEach((el) => {
      el.removeAttribute("data-op-picked");
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
    if (mode !== "text") { if (mode === "off") stopInline(); return; }
    startInline();
    const onInput = (e: Event) => {
      const host = (e.target as HTMLElement | null)?.closest?.("[data-op-edit]") as HTMLElement | null;
      const id = host?.getAttribute("data-op-edit");
      if (id) setTouched((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };
    document.addEventListener("input", onInput, true);
    return () => { document.removeEventListener("input", onInput, true); stopInline(); };
  }, [mode, startInline, stopInline]);

  // ---- The style inspector ---------------------------------------------
  //
  // Click anything and get its computed colours and sizes, editable. Each
  // change is a declaration on a selector anchored to the element's own
  // section, folded into the stylesheet as one marked block — so the same
  // heading nudged four times leaves one rule, not four, and the whole
  // thing is still just CSS you can read in the Stylesheet tab afterwards.
  useEffect(() => {
    if (mode !== "style") return;
    stopInline();

    const outline = (el: HTMLElement | null, colour: string) => {
      if (!el) return;
      el.style.setProperty("outline", `2px solid ${colour}`);
      el.style.setProperty("outline-offset", "-2px");
    };
    const unoutline = (el: HTMLElement | null) => {
      if (!el || el.hasAttribute("data-op-picked")) return;
      el.style.removeProperty("outline");
      el.style.removeProperty("outline-offset");
    };

    let hovered: HTMLElement | null = null;
    const target = (e: Event): HTMLElement | null => {
      const el = e.target as HTMLElement | null;
      // Our own toolbar is on the page and would otherwise be selectable.
      if (!el || el.closest("[data-operator-ui]") || !el.closest(".bespoke-page")) return null;
      return el;
    };

    const onOver = (e: Event) => {
      const el = target(e);
      if (el === hovered) return;
      unoutline(hovered);
      hovered = el;
      outline(el, "rgba(56,189,248,0.9)");
    };

    const onClick = (e: MouseEvent) => {
      const el = target(e);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll<HTMLElement>("[data-op-picked]").forEach((prev) => {
        prev.removeAttribute("data-op-picked");
        prev.style.removeProperty("outline");
        prev.style.removeProperty("outline-offset");
      });
      selectElement(el);
    };

    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("click", onClick, true);
      unoutline(hovered);
      stopInline();
    };
  }, [mode, stopInline]);

  /**
   * Pick an element: outline it, work out its address, and diagnose it.
   *
   * The crumbs matter more than they look. Clicking a headline usually lands
   * on the <span> inside it rather than the <h1> you meant, and hunting for
   * the right node by clicking around is the thing that would make this
   * tiring to use every day.
   */
  const selectElement = useCallback((el: HTMLElement) => {
    document.querySelectorAll<HTMLElement>("[data-op-picked]").forEach((prev) => {
      prev.removeAttribute("data-op-picked");
      prev.style.removeProperty("outline");
      prev.style.removeProperty("outline-offset");
    });
    el.setAttribute("data-op-picked", "1");
    el.style.setProperty("outline", "2px solid rgba(251,191,36,1)");
    el.style.setProperty("outline-offset", "-2px");

    const crumbs: { label: string; el: HTMLElement }[] = [];
    let node: HTMLElement | null = el;
    while (node && node !== document.body && crumbs.length < 5) {
      const cls = Array.from(node.classList).filter((c) => !c.startsWith("op-"))[0];
      crumbs.unshift({
        label: node.id ? `#${node.id}` : `${node.tagName.toLowerCase()}${cls ? `.${cls}` : ""}`,
        el: node,
      });
      if (node.id) break;
      node = node.parentElement;
    }

    const { selector, matches } = selectorFor(el);
    const classes = Array.from(el.classList).filter((c) => !c.startsWith("op-"));
    setPicked({ selector, matches, label: `${el.tagName.toLowerCase()}${classes.length ? `.${classes[0]}` : ""}`, crumbs });

    const root = document.querySelector<HTMLElement>(".bespoke-page");
    setFindings(root ? inspect(el, root) : []);
  }, []);

  /** Sweep the whole page. Deferred a frame so the button paints as pressed. */
  const runScan = useCallback(() => {
    setScanning(true);
    setPageFindings(null);
    requestAnimationFrame(() => {
      const wrappers = Array.from(document.querySelectorAll<HTMLElement>(".bespoke-page"));
      const root = wrappers.find((w) => w.querySelector("section[id]")) ?? wrappers[0];
      setPageFindings(root ? scanPage(root, cssRef.current || css) : []);
      setScanning(false);
    });
  }, [css]);

  /** The computed value of one property on the currently picked element. */
  const computed = useCallback((prop: string): string => {
    const el = document.querySelector<HTMLElement>("[data-op-picked]");
    if (!el) return "";
    const declared = overrides.find((o) => o.selector === picked?.selector)?.declarations[prop];
    return declared ?? getComputedStyle(el).getPropertyValue(prop).trim();
  }, [overrides, picked]);

  /**
   * Write one declaration for the picked element into the stylesheet.
   *
   * Straight into cssDraft rather than into a parallel override layer, so
   * the Stylesheet tab always shows the truth and one save covers both. An
   * empty value removes the declaration again.
   */
  const writeRule = useCallback((selector: string, patch: Record<string, string>) => {
    const existing = overrides.find((o) => o.selector === selector)?.declarations ?? {};
    const declarations = { ...existing };
    for (const [prop, value] of Object.entries(patch)) {
      if (value.trim()) declarations[prop] = value.trim();
      else delete declarations[prop];
    }
    const rest = overrides.filter((o) => o.selector !== selector);
    const merged = Object.keys(declarations).length ? [...rest, { selector, declarations }] : rest;
    setOverrides(merged);
    setCssDraft(withOverrides(cssRef.current, merged));
    setSaved(false);
  }, [overrides]);

  const setDeclaration = useCallback((prop: string, value: string) => {
    if (!picked) return;
    writeRule(scopeAll && picked.matches > 1 ? broadSelector(picked.selector) : picked.selector, { [prop]: value });
  }, [picked, scopeAll, writeRule]);

  /**
   * Take a fix the doctor offered.
   *
   * Token fixes land on .bespoke-page because that is where a custom
   * property has to be declared to reach the rules that read it; everything
   * else lands on the element that was diagnosed. Afterwards the element is
   * re-diagnosed rather than the finding being assumed away, so a fix that
   * did not actually clear the problem still says so.
   */
  const applyFix = useCallback((fix: Fix, finding: Finding) => {
    const isToken = Object.keys(fix.declarations).every((k) => k.startsWith("--"));
    // A grouped finding fixes all of its places at once: the row already
    // says "6 places", so fixing the first and leaving five behind would be
    // the opposite of what it just promised.
    const target = isToken
      ? ".bespoke-page"
      : finding.element
        ? finding.siblings?.length
          ? broadSelector(selectorFor(finding.element).selector)
          : selectorFor(finding.element).selector
        : picked?.selector;
    if (!target) return;
    writeRule(target, fix.declarations);

    const root = document.querySelector<HTMLElement>(".bespoke-page");
    // A frame for the live sheet to land before measuring the result.
    setTimeout(() => {
      if (finding.element && root) setFindings(inspect(finding.element, root));
      if (pageFindings) runScan();
    }, 220);
  }, [picked, writeRule, pageFindings, runScan]);

  // ---- Live stylesheet --------------------------------------------------
  //
  // Debounced so dragging a colour picker does not restyle the page on every
  // frame, and skipped entirely until the real stylesheet has loaded —
  // applying an empty draft would blank the site.
  useEffect(() => {
    if (!css) return;
    if (cssDraft === css) { clearLiveCss(); return; }
    const timer = setTimeout(() => applyLiveCss(cssDraft), 120);
    return () => clearTimeout(timer);
  }, [cssDraft, css]);

  useEffect(() => () => clearLiveCss(), []);

  // ---- Live markup ------------------------------------------------------
  //
  // The section on the page follows the textarea. A draft that does not yet
  // parse to one element is simply not applied, which is what a half-typed
  // tag should look like — nothing happening, rather than the section
  // disappearing while you finish the word.
  const [applied, setApplied] = useState(true);
  useEffect(() => {
    if (!activeId || tab !== "sections") return;
    const original = sections.find((sec) => sec.id === activeId)?.html;
    if (draft === original) return;
    const timer = setTimeout(() => setApplied(replaceSection(activeId, draft)), 300);
    return () => clearTimeout(timer);
  }, [draft, activeId, tab, sections]);

  /** Read a section back out of the DOM without the editing attributes. */
  function serialiseSection(id: string): string | null {
    const el = document.querySelector<HTMLElement>(`section[data-op-edit="${CSS.escape(id)}"]`);
    return el ? serialiseElement(el) : null;
  }

  /**
   * Put the server's stored copy of a section back on the page.
   *
   * Skipped while text mode is armed on that section: replacing the node
   * would take the caret with it, and the stored copy is what is already
   * there anyway. Everything else — a markup save, a rebuild — swaps.
   */
  function syncSection(id: string, html: string | undefined) {
    if (!html) return;
    if (mode === "text") { rearmRuntime(); return; }
    replaceSection(id, html);
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
        // What comes back has been through the sanitiser, so it is not
        // necessarily what was sent. Showing the stored copy is the only
        // honest thing to show — a save that silently dropped an attribute
        // should look different on the page, not identical until reload.
        syncSection(id, data?.section?.html);
      }
      setSaved(true);
      setTouched([]);
      setTimeout(() => setSaved(false), 2000);
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
      const html = data.section?.html ?? draft;
      setDraft(html);
      syncSection(activeId, html);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
      // The only edit here that still reloads. The header and footer are
      // React components rendered from this spec, not markup in the page, so
      // there is no node to swap — the server has to render them again.
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
      setOverrides(readOverrides(data.css ?? ""));
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  // Also loaded for the on-page modes, not just the code panel: the style
  // inspector writes into the stylesheet, so it needs the real one first.
  useEffect(() => {
    if ((open || mode !== "off") && sections.length === 0 && !loading) void load();
  }, [open, mode, sections.length, loading, load]);

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
      const stored = data?.section?.html ?? draft;
      setDraft(stored);
      setSections((prev) => prev.map((sec) => (sec.id === activeId ? { ...sec, html: stored } : sec)));
      syncSection(activeId, stored);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
      // The stored sheet becomes the new baseline, which drops the live
      // layer: from here the page is showing its own stylesheet again, and
      // it looks the same as it did a moment ago. That is the whole point.
      const stored = data?.css ?? cssDraft;
      setCss(stored);
      setCssDraft(stored);
      setOverrides(readOverrides(stored));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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

  // The bar stays on screen with the code panel open, not just instead of
  // it: with edits applying live, the thing you most want while typing CSS
  // is the Save button and an unobstructed view of the page.
  if (clean) return null;

  const dirtyCss = cssDraft !== css;

  // The swatches are this page's own tokens, ranked by how readable each one
  // is on the picked element's actual backdrop — so the first swatch is
  // almost always the right answer and picking a literal colour is the
  // exception rather than the default.
  const palette: Fix[] = (() => {
    const el = picked ? document.querySelector<HTMLElement>("[data-op-picked]") : null;
    const root = document.querySelector<HTMLElement>(".bespoke-page");
    if (!el || !root) return [];
    return colourFixes(el, root);
  })();

  const toolbar = (
    <div data-operator-ui="1" className="fixed bottom-5 left-5 z-[9999] flex max-w-[min(28rem,calc(100vw-2.5rem))] flex-col items-start gap-2">
      {pageFindings && mode === "style" && (
        <div className="max-h-[46vh] w-[20rem] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-100">
              {pageFindings.length === 0 ? "Nothing to fix — this one is ready" : `${pageFindings.length} thing${pageFindings.length > 1 ? "s" : ""} to look at`}
            </span>
            <button type="button" onClick={() => setPageFindings(null)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-1.5">
            {pageFindings.map((finding, i) => (
              <FindingCard
                key={`${finding.id}-${i}`}
                finding={finding}
                onFix={(fix) => applyFix(fix, finding)}
                onGo={
                  finding.element
                    ? () => {
                        finding.element!.scrollIntoView({ behavior: "smooth", block: "center" });
                        selectElement(finding.element!);
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {picked && mode === "style" && (
        <StyleInspector
          picked={picked}
          findings={findings}
          computed={computed}
          onSet={setDeclaration}
          onFix={applyFix}
          onSelect={selectElement}
          scopeAll={scopeAll}
          onScope={setScopeAll}
          palette={palette}
          onClear={() => {
            const rest = overrides.filter(
              (o) => o.selector !== picked.selector && o.selector !== broadSelector(picked.selector)
            );
            setOverrides(rest);
            setCssDraft(withOverrides(cssRef.current, rest));
          }}
          onClose={() => setPicked(null)}
          changed={overrides.some(
            (o) => o.selector === picked.selector || o.selector === broadSelector(picked.selector)
          )}
        />
      )}

      <div className="flex items-center gap-1 rounded-full bg-slate-900 p-1.5 pl-2 shadow-lg">
        <button
          type="button"
          onClick={() => { setMode((m) => (m === "text" ? "off" : "text")); setPicked(null); }}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
            mode === "text" ? "bg-amber-300 text-slate-900" : "text-slate-200 hover:bg-slate-800"
          }`}
          title="Click any text on the page and type. Changes show as you type."
        >
          <MousePointerClick className="h-3.5 w-3.5" />
          Text
        </button>

        <button
          type="button"
          onClick={() => { setMode((m) => (m === "style" ? "off" : "style")); setPicked(null); }}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
            mode === "style" ? "bg-sky-300 text-slate-900" : "text-slate-200 hover:bg-slate-800"
          }`}
          title="Click any element to change its colour, size or spacing"
        >
          <Paintbrush className="h-3.5 w-3.5" />
          Style
        </button>

        {mode === "style" && (
          <button
            type="button"
            onClick={runScan}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-800"
            title="Sweep the page for anything that would stop you sending it"
          >
            {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Stethoscope className="h-3.5 w-3.5" />}
            Check page
          </button>
        )}

        {mode === "text" && touched.length > 0 && (
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

        {dirtyCss && (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveCss()}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-50"
              title="Store the stylesheet you are looking at"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save style
            </button>
            <button
              type="button"
              onClick={() => { setCssDraft(css); setOverrides(readOverrides(css)); }}
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              title="Throw away the unsaved style changes"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-800"
          >
            <Code2 className="h-3.5 w-3.5" />
            Code
          </button>
        )}

        {saved && <span className="pr-2 text-[11px] font-bold text-emerald-300">Saved</span>}

        {error && (
          <span className="max-w-[16rem] truncate pr-2 text-[11px] text-red-300" title={error}>
            {error}
          </span>
        )}
      </div>
    </div>
  );

  if (!open) return toolbar;

  return (
    <>
      {toolbar}
    <div data-operator-ui="1" className="fixed inset-y-0 right-0 z-[9999] flex w-full max-w-2xl flex-col border-l border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
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
            ? `${cssDraft.length.toLocaleString()} characters · the page is already showing this`
            : tab === "chrome"
              ? "Header and footer are React components — saving these does reload"
              : activeId
                ? applied
                  ? "Live on the page · sanitised on save, same as generated output"
                  : "Not applied yet — the draft is not one complete element"
                : "No section selected"}
        </p>
        <button
          type="button"
          disabled={saving || !dirty}
          onClick={() => (tab === "css" ? void saveCss() : tab === "chrome" ? void saveChrome() : void saveSection())}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-300 px-3.5 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-amber-200 disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
          {saving ? "Saving…" : saved ? "Saved" : tab === "chrome" ? "Save & reload" : "Save"}
        </button>
      </div>
    </div>
    </>
  );
}

// ---------------------------------------------------------------------------

/** rgb(20, 50, 92) → #14325c, because <input type="color"> speaks hex only. */
function toHex(value: string): string {
  const m = value.match(/^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m) return `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
  return /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim() : "#000000";
}

function toNumber(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** A number you can type, arrow-key, or leave alone. */
function NumberField({
  label,
  value,
  suffix = "px",
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="mt-1 flex items-center rounded-md border border-slate-700 bg-slate-950 focus-within:border-sky-400">
        <input
          type="number"
          value={Number.isFinite(value) ? Math.round(value * 100) / 100 : ""}
          onChange={(e) => onChange(e.target.value ? `${e.target.value}${suffix}` : "")}
          className="w-full bg-transparent px-2 py-1 font-mono text-[12px] font-semibold text-slate-100 outline-none"
        />
        <span className="pr-2 text-[10px] text-slate-500">{suffix}</span>
      </div>
    </label>
  );
}

/**
 * One problem, and the buttons that fix it.
 *
 * The fix is a button rather than an instruction on purpose: the point of
 * this panel is that noticing and repairing are the same gesture, so nobody
 * has to work out which property to reach for.
 */
function FindingCard({
  finding,
  onFix,
  onGo,
}: {
  finding: Finding;
  onFix: (fix: Fix) => void;
  onGo?: () => void;
}) {
  const bad = finding.severity === "bad";
  return (
    <div className={`rounded-lg border p-2 ${bad ? "border-red-500/40 bg-red-500/10" : "border-amber-400/30 bg-amber-400/10"}`}>
      <button
        type="button"
        onClick={onGo}
        disabled={!onGo}
        className="flex w-full items-start gap-1.5 text-left disabled:cursor-default"
      >
        <AlertTriangle className={`mt-0.5 h-3 w-3 shrink-0 ${bad ? "text-red-300" : "text-amber-300"}`} />
        <span className="flex-1">
          <span className={`block text-[11px] font-bold ${bad ? "text-red-100" : "text-amber-100"}`}>{finding.title}</span>
          <span className="block text-[10px] leading-snug text-slate-300">{finding.detail}</span>
        </span>
        {onGo && <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />}
      </button>
      {finding.fixes.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {finding.fixes.map((fix) => (
            <button
              key={fix.label}
              type="button"
              onClick={() => onFix(fix)}
              className="inline-flex items-center gap-1 rounded border border-slate-500/60 bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-100 transition hover:border-sky-400 hover:text-sky-200"
            >
              {fix.label}
              {fix.note && <span className="font-mono text-[9px] text-slate-400">{fix.note}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The clicked element: what is wrong with it, then what you can change.
 *
 * Findings come first because they are the reason the panel is open. The
 * controls below are deliberately four things — colour, size, radius,
 * spacing — since anything more is a stylesheet edit wearing a costume, and
 * the Stylesheet tab is one click away for that.
 */
function StyleInspector({
  picked,
  findings,
  computed,
  onSet,
  onFix,
  onSelect,
  onClear,
  onClose,
  scopeAll,
  onScope,
  changed,
  palette,
}: {
  picked: { selector: string; matches: number; label: string; crumbs: { label: string; el: HTMLElement }[] };
  findings: Finding[];
  computed: (prop: string) => string;
  onSet: (prop: string, value: string) => void;
  onFix: (fix: Fix, finding: Finding) => void;
  onSelect: (el: HTMLElement) => void;
  onClear: () => void;
  onClose: () => void;
  scopeAll: boolean;
  onScope: (all: boolean) => void;
  changed: boolean;
  palette: Fix[];
}) {
  return (
    <div className="max-h-[70vh] w-[20rem] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-slate-100 shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-0.5">
          {picked.crumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="flex items-center gap-0.5">
              {i > 0 && <span className="text-[9px] text-slate-600">›</span>}
              <button
                type="button"
                onClick={() => onSelect(crumb.el)}
                className={`rounded px-1 py-0.5 font-mono text-[9.5px] transition ${
                  i === picked.crumbs.length - 1
                    ? "bg-sky-400 font-bold text-slate-900"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {findings.length > 0 && (
        <div className="mb-2.5 space-y-1.5">
          {findings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} onFix={(fix) => onFix(fix, finding)} />
          ))}
        </div>
      )}

      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Colour</span>
      <div className="mb-2.5 mt-1 flex gap-1">
        {palette.map((fix) => (
          <button
            key={fix.label}
            type="button"
            title={`${fix.label} — ${fix.note ?? ""}`}
            onClick={() => onSet("color", fix.declarations.color)}
            className="h-7 flex-1 rounded-md border-2 border-slate-700 transition hover:border-sky-400"
            style={{ background: fix.declarations.color }}
          />
        ))}
        <label className="h-7 w-7 shrink-0 cursor-pointer rounded-md border-2 border-slate-700 bg-slate-950 p-0.5 transition hover:border-sky-400">
          <input
            type="color"
            value={toHex(computed("color"))}
            onChange={(e) => onSet("color", e.target.value)}
            className="h-full w-full cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
      </div>

      <div className="mb-2.5 grid grid-cols-3 gap-2">
        <NumberField label="Size" value={toNumber(computed("font-size"))} onChange={(v) => onSet("font-size", v)} />
        <NumberField label="Radius" value={toNumber(computed("border-radius"))} onChange={(v) => onSet("border-radius", v)} />
        <NumberField label="Space" value={toNumber(computed("padding-top"))} onChange={(v) => onSet("padding-block", v)} />
      </div>

      {picked.matches > 1 && (
        <div className="mb-2 flex gap-1">
          {([false, true] as const).map((all) => (
            <button
              key={String(all)}
              type="button"
              onClick={() => onScope(all)}
              className={`flex-1 rounded-md px-2 py-1 text-[10px] font-bold transition ${
                scopeAll === all ? "bg-sky-400 text-slate-900" : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {all ? `All ${picked.matches} like it` : "This one"}
            </button>
          ))}
        </div>
      )}

      {changed && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-600 px-2 py-1 text-[10px] font-bold text-slate-300 transition hover:border-red-400/50 hover:text-red-300"
        >
          <Undo2 className="h-3 w-3" />
          Undo my changes here
        </button>
      )}
    </div>
  );
}
