"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  Unlock,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

// The refinement surface.
//
// Written so that fixing a page needs no HTML knowledge: pick the section
// that is wrong, say what is wrong in plain English. That is the whole
// interaction, because the people doing this are running a business between
// phone calls, not editing markup.
//
// Approving a section locks it. That is the point of the lock — it makes the
// good parts of a page structurally safe from every later rewrite, so
// iterating on a weak hero can never cost you a services section you already
// liked.

interface SectionRow {
  id: string;
  kind: string;
  label: string;
  locked: boolean;
  words: number;
  images: number;
}

export function SectionEditor({ leadId, onChanged }: { leadId: string; onChanged?: () => void }) {
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [addingAfter, setAddingAfter] = useState<string | null>(null);
  const [newSection, setNewSection] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/sections`);
      const data = await res.json().catch(() => ({}));
      setSections(data.sections ?? []);
    } catch {
      // A failed refresh is not worth a banner; the next action retries.
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(payload: Record<string, unknown>, busyKey: string) {
    setBusy(busyKey);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "That did not work");
      setOpenFor(null);
      setInstruction("");
      setAddingAfter(null);
      setNewSection("");
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <Card className="border border-border bg-white shadow-sm">
        <CardContent className="flex items-center gap-2 p-6 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading sections...
        </CardContent>
      </Card>
    );
  }

  if (sections.length === 0) return null;

  const approved = sections.filter((s) => s.locked).length;

  return (
    <Card className="border border-border bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                <Wand2 className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-[#0d1738]">Fix the homepage, section by section</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Say what is wrong in plain English. Approved sections are never touched by any rewrite.
            </p>
          </div>
          <span className="rounded-full bg-[#f0f3ff] px-2.5 py-1 text-[11px] font-semibold text-[#533afd]">
            {approved} of {sections.length} approved
          </span>
        </div>

        {error && <p className="rounded-md bg-red-50 p-2.5 text-xs font-medium text-red-700">{error}</p>}

        <div className="divide-y divide-border rounded-lg border border-border">
          {sections.map((section, index) => {
            const rowBusy = busy === section.id;
            return (
              <div key={section.id} className={section.locked ? "bg-[#f7fdf9]" : "bg-white"}>
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-5 shrink-0 font-mono text-[11px] text-muted-foreground">{index + 1}</span>
                    <span className="truncate text-xs font-semibold text-[#0d1738]">{section.label}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {section.words}w{section.images > 0 ? ` · ${section.images} image${section.images > 1 ? "s" : ""}` : ""}
                    </span>
                    {section.locked && (
                      <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        Approved
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={!!busy || index === 0}
                      onClick={() => act({ action: "move", sectionId: section.id, direction: "up" }, section.id)}
                      className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={!!busy || index === sections.length - 1}
                      onClick={() => act({ action: "move", sectionId: section.id, direction: "down" }, section.id)}
                      className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => act({ action: section.locked ? "unlock" : "lock", sectionId: section.id }, section.id)}
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-semibold ${
                        section.locked
                          ? "text-emerald-700 hover:bg-emerald-50"
                          : "text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {section.locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {section.locked ? "Reopen" : "Approve"}
                    </button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!!busy || section.locked}
                      onClick={() => setOpenFor(openFor === section.id ? null : section.id)}
                      className="h-7 gap-1 text-[11px]"
                    >
                      {rowBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Fix
                    </Button>

                    <button
                      type="button"
                      disabled={!!busy || section.locked}
                      onClick={() => act({ action: "remove", sectionId: section.id }, section.id)}
                      className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-30"
                      aria-label="Remove section"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => setAddingAfter(addingAfter === section.id ? null : section.id)}
                      className="rounded p-1 text-[#533afd] hover:bg-[#f0f3ff] disabled:opacity-30"
                      aria-label="Add a section below"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {openFor === section.id && (
                  <div className="space-y-2 border-t border-border bg-[#fbfbfd] px-3 py-3">
                    <Textarea
                      rows={2}
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      placeholder="What's wrong with this section? e.g. 'make it dark with the owner photo on the right' — or leave blank and it will simply be made better."
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!!busy}
                        onClick={() => act({ action: "regenerate", sectionId: section.id, instruction }, section.id)}
                        className="h-7 bg-[#533afd] text-[11px] font-semibold text-white hover:bg-[#432bd9]"
                      >
                        {rowBusy ? "Rewriting..." : instruction.trim() ? "Apply this change" : "Just make it better"}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setOpenFor(null)} className="h-7 text-[11px]">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {addingAfter === section.id && (
                  <div className="space-y-2 border-t border-border bg-[#f7f7ff] px-3 py-3">
                    <Textarea
                      rows={2}
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      placeholder="Describe the new section, e.g. 'a guarantee band with three promises and a call button'"
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!!busy || !newSection.trim()}
                        onClick={() => act({ action: "add", sectionId: section.id, description: newSection }, section.id)}
                        className="h-7 bg-[#0d1738] text-[11px] font-semibold text-white hover:bg-[#1b2a5c]"
                      >
                        {rowBusy ? "Building..." : "Add section here"}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setAddingAfter(null)} className="h-7 text-[11px]">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {approved === sections.length && (
          <p className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-900">
            <Check className="h-4 w-4 shrink-0" />
            <span>
              <b>Every section approved.</b> Nothing here can change unless you reopen it.
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
