"use client";

import { useState } from "react";
import { Check, ClipboardCopy, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// The manual override: take this lead's whole build brief somewhere else, and
// bring a page back.
//
// The sell-this-site skill already does this through the API, but it needs an
// admin session, so it works from Claude Code and nowhere else. Every other
// tool an operator reaches for fails at the first call and then invents the
// business rather than saying it cannot see it. Copying a hydrated prompt and
// pasting the result back closes that loop for any tool at all.
//
// HTML and CSS are one field pair on purpose: a page saved without the
// stylesheet that matches its class names renders bare, and that is the most
// likely way this panel could produce something worse than what it replaced.

export function HandBuildPanel({ leadId, hasPage }: { leadId: string; hasPage: boolean }) {
  const [copied, setCopied] = useState(false);
  const [includeCurrent, setIncludeCurrent] = useState(false);
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function copyPrompt() {
    setMessage(null);
    const res = await fetch(`/api/leads/${leadId}/prompt${includeCurrent ? "?includeCurrent=1" : ""}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Could not build the prompt" }));
      setMessage({ tone: "error", text: body.error ?? "Could not build the prompt" });
      return;
    }
    await navigator.clipboard.writeText(await res.text());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function save() {
    if (!html.trim()) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/leads/${leadId}/bespoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_key: "home",
        html: fenced(html),
        css: css.trim() ? fenced(css) : undefined,
        note: "Hand-built",
      }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setMessage({ tone: "error", text: body.error ?? "Save failed" });
      return;
    }
    setMessage({ tone: "ok", text: `Saved as version ${body.version ?? "?"}. Reload the preview to see it.` });
    setHtml("");
    setCss("");
  }

  return (
    <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e5e7f2] pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-[#0d1738]">
            <Wand2 className="h-4 w-4 text-[#533afd]" /> Build it somewhere else
          </h3>
          <p className="mt-1 max-w-2xl text-[13px] text-[#42506a]">
            Copy this lead&apos;s whole brief — real facts, palette, imagery, and everything measurably
            wrong with the current build — as one prompt. Paste it into OpenCode, Claude, or anything
            else, then paste the page back here.
          </p>
        </div>
        <Button onClick={copyPrompt} variant="outline" className="shrink-0 gap-2">
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <ClipboardCopy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy build prompt"}
        </Button>
      </div>

      {hasPage && (
        <label className="flex items-start gap-2 text-[13px] text-[#42506a]">
          <input
            type="checkbox"
            checked={includeCurrent}
            onChange={(e) => setIncludeCurrent(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Include the current page in the prompt.{" "}
            <span className="text-[#777588]">
              Leave this off for a rebuild — showing a model the flat page it is replacing anchors it
              to that page. Turn it on only for a targeted fix.
            </span>
          </span>
        </label>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#777588]">HTML</span>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="<main>…</main>"
            spellCheck={false}
            className="h-48 w-full rounded-xl border border-[#e5e7f2] bg-[#fbfbfd] p-3 font-mono text-[11px] leading-relaxed text-[#0d1738] focus:border-[#533afd] focus:outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#777588]">
            CSS <span className="font-medium normal-case tracking-normal text-[#b6151f]">— required if the class names changed</span>
          </span>
          <textarea
            value={css}
            onChange={(e) => setCss(e.target.value)}
            placeholder=".hero { … }"
            spellCheck={false}
            className="h-48 w-full rounded-xl border border-[#e5e7f2] bg-[#fbfbfd] p-3 font-mono text-[11px] leading-relaxed text-[#0d1738] focus:border-[#533afd] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={saving || !html.trim()} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save as new version
        </Button>
        <span className="text-[12px] text-[#777588]">
          Sanitised on save, and the version it replaces is kept.
        </span>
      </div>

      {message && (
        <p className={`text-[13px] font-semibold ${message.tone === "ok" ? "text-emerald-700" : "text-[#b6151f]"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

/** Models wrap answers in fences however firmly they are told not to. */
function fenced(value: string): string {
  return value
    .trim()
    .replace(/^```(?:html|css)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}
