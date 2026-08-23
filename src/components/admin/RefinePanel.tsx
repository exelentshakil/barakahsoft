"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, History, Image as ImageIcon, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

// The refinement step: the human pass between the generator's first draft
// and the client seeing anything.
//
// The single most important thing on screen is the placeholder count. A
// generated image means that position is NOT finished, and the panel says so
// at the top rather than letting a page with an AI hero look complete.

interface SlotView {
  key: string;
  label: string;
  url: string;
  caption: string;
  origin: "real" | "generated" | "uploaded";
  usedOn: string[];
}

interface PageVersion {
  id: string;
  page_key: string;
  version: number;
  source: string;
  note: string | null;
  created_at: string;
}

const PAGE_LABELS: Record<string, string> = {
  home: "Homepage",
  about: "About",
  faq: "FAQ",
  contact: "Contact",
  blog: "Advice index",
};

function pageLabel(key: string): string {
  if (PAGE_LABELS[key]) return PAGE_LABELS[key];
  const clean = key.replace(/^(services|areas|locations|blog)\//, "").replace(/-/g, " ");
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
}

const ORIGIN_STYLE: Record<SlotView["origin"], { label: string; className: string }> = {
  real: { label: "Client photo", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  uploaded: { label: "You uploaded", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  generated: { label: "Placeholder", className: "bg-amber-50 text-amber-800 border-amber-200" },
};

export function RefinePanel({ leadId }: { leadId: string }) {
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [versions, setVersions] = useState<Record<string, PageVersion[]>>({});
  const [loading, setLoading] = useState(true);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [promptFor, setPromptFor] = useState<string | null>(null);
  const [promptText, setPromptText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    try {
      const [slotRes, versionRes] = await Promise.all([
        fetch(`/api/leads/${leadId}/slots`),
        fetch(`/api/leads/${leadId}/versions`),
      ]);
      const slotData = await slotRes.json().catch(() => ({}));
      const versionData = await versionRes.json().catch(() => ({}));
      setSlots(slotData.slots ?? []);
      setVersions(versionData.versions ?? {});
    } catch {
      // A failed refresh is not worth an error banner; the next action retries.
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(slotKey: string, file: File) {
    setBusySlot(slotKey);
    setError(null);
    try {
      const form = new FormData();
      form.append("slot", slotKey);
      form.append("file", file);
      const res = await fetch(`/api/leads/${leadId}/slots`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusySlot(null);
    }
  }

  async function regenerate(slotKey: string) {
    if (!promptText.trim()) return;
    setBusySlot(slotKey);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: slotKey, subject: promptText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not generate that image");
      setPromptFor(null);
      setPromptText("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setBusySlot(null);
    }
  }

  async function generateAvatar(slotKey: string) {
    setBusySlot(slotKey);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/generate-avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Avatar generation failed");
      await fetch(`/api/leads/${leadId}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: slotKey, url: data.url }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Avatar generation failed");
    } finally {
      setBusySlot(null);
    }
  }

  const [retouchingAll, setRetouchingAll] = useState(false);

  async function handleRetouchAll() {
    if (!confirm("This will enhance all images across the website with commercial-grade AI photography. Proceed?")) return;
    setRetouchingAll(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/slots/retouch-all`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Retouch failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retouch failed");
    } finally {
      setRetouchingAll(false);
    }
  }

  async function restore(pageKey: string, version: number) {
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey, version }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Restore failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed");
    }
  }

  if (loading) {
    return (
      <Card className="border border-border bg-white shadow-sm">
        <CardContent className="flex items-center gap-2 p-6 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading refinement panel...
        </CardContent>
      </Card>
    );
  }

  if (slots.length === 0) {
    return (
      <Card className="border border-border bg-white shadow-sm">
        <CardContent className="p-6 text-xs text-muted-foreground">
          Generate the site first — image slots and version history appear here afterwards.
        </CardContent>
      </Card>
    );
  }

  const placeholders = slots.filter((s) => s.origin === "generated");
  const pageKeys = Object.keys(versions).sort((a, b) => (a === "home" ? -1 : b === "home" ? 1 : a.localeCompare(b)));

  return (
    <Card className="border border-border bg-white shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                <ImageIcon className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-[#0d1738]">Refine before sending</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              The generator produced a first draft. Swap in real photos or enhance them with AI for a super premium commercial finish.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            disabled={retouchingAll}
            onClick={handleRetouchAll}
            className="gap-1.5 bg-[#0d1738] text-white hover:bg-[#1b2a5c] text-xs font-bold shadow-sm"
          >
            {retouchingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-amber-400" />}
            {retouchingAll ? "Retouching All Images..." : "✨ Retouch All Images (AI)"}
          </Button>
        </div>

        {placeholders.length > 0 ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <p className="text-xs text-amber-900">
              <b>
                {placeholders.length} of {slots.length} image{slots.length === 1 ? "" : "s"} {placeholders.length === 1 ? "is" : "are"} still a placeholder.
              </b>{" "}
              Generated imagery is a stand-in, not the finished job. Upload real photos below, or ask the client for them.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <Check className="h-4 w-4 shrink-0 text-emerald-700" />
            <p className="text-xs text-emerald-900">
              <b>Every image is a real photo.</b> This site is ready to send.
            </p>
          </div>
        )}

        {error && <p className="rounded-md bg-red-50 p-2.5 text-xs font-medium text-red-700">{error}</p>}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot) => {
            const origin = ORIGIN_STYLE[slot.origin];
            const busy = busySlot === slot.key;

            return (
              <div key={slot.key} className="overflow-hidden rounded-lg border border-border bg-[#fbfbfd]">
                <div className="relative aspect-[4/3] bg-[#eef0f6]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slot.url} alt={slot.caption} className="h-full w-full object-cover" />
                  <span
                    className={`absolute left-2 top-2 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${origin.className}`}
                  >
                    {origin.label}
                  </span>
                </div>

                <div className="space-y-2 p-3">
                  <div>
                    <p className="text-xs font-bold text-[#0d1738]">{slot.label}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{slot.caption}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {slot.usedOn.length > 0
                        ? `On ${slot.usedOn.map(pageLabel).join(", ")}`
                        : "Not placed on any page"}
                    </p>
                  </div>

                  <input
                    ref={(el) => {
                      fileInputs.current[slot.key] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) upload(slot.key, file);
                      e.target.value = "";
                    }}
                  />

                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => fileInputs.current[slot.key]?.click()}
                      className="h-7 flex-1 gap-1 bg-[#533afd] text-[11px] font-semibold text-white hover:bg-[#432bd9]"
                    >
                      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      Real photo
                    </Button>
                    {(slot.key.includes("about") || slot.key.includes("team") || slot.key.includes("hero")) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => generateAvatar(slot.key)}
                        title="Generate a photorealistic owner portrait with Gemini AI"
                        className="h-7 gap-1 text-[11px] text-[#533afd] hover:bg-[#f0f3ff] border-[#533afd]/30 font-bold"
                      >
                        <Sparkles className="h-3 w-3" />
                        AI Avatar
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setPromptFor(promptFor === slot.key ? null : slot.key);
                        setPromptText(slot.caption);
                      }}
                      className="h-7 gap-1 text-[11px]"
                    >
                      <Sparkles className="h-3 w-3" />
                    </Button>
                  </div>

                  {promptFor === slot.key && (
                    <div className="space-y-1.5 border-t border-border pt-2">
                      <Input
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder="Describe the photo you want"
                        className="h-7 text-[11px]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            regenerate(slot.key);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy || !promptText.trim()}
                        onClick={() => regenerate(slot.key)}
                        className="h-7 w-full text-[11px] font-semibold"
                      >
                        {busy ? "Generating..." : "Generate replacement"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {pageKeys.length > 0 && (
          <div className="border-t border-border pt-4">
            <div className="mb-2 flex items-center gap-2">
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              <h4 className="text-xs font-bold text-[#0d1738]">Page versions</h4>
              <span className="text-[11px] text-muted-foreground">
                Every change is kept. Restoring never loses what you have now.
              </span>
            </div>

            <div className="divide-y divide-border rounded-lg border border-border">
              {pageKeys.map((key) => {
                const history = versions[key] ?? [];
                const current = history[0];
                return (
                  <div key={key} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <div>
                      <span className="text-xs font-semibold text-[#0d1738]">{pageLabel(key)}</span>
                      <span className="ml-2 text-[11px] text-muted-foreground">
                        v{current?.version ?? 1}
                        {current?.note ? ` · ${current.note.slice(0, 60)}` : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {history.slice(1, 5).map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => restore(key, v.version)}
                          title={v.note ?? `Restore version ${v.version}`}
                          className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-[#533afd] hover:text-[#533afd]"
                        >
                          Restore v{v.version}
                        </button>
                      ))}
                      {history.length <= 1 && (
                        <span className="text-[10px] text-muted-foreground">No earlier versions yet</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
