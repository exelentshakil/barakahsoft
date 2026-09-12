"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Upload, RotateCcw, ImageIcon } from "lucide-react";

// The image-swap surface.
//
// Photographs are curated before a build now, so by the time a page exists the
// library has already been cleaned up. This exists for the one case curation
// cannot prevent: a good photo placed in the wrong section. Every <img> the
// generator writes carries a data-slot, so a swap rewrites one attribute in the
// stored document — no rebuild, no model call, and undoable from the version
// list underneath.
//
// What this replaces asked the operator to describe a scene and had a model
// invent one. A generated hero is not something we would send to a client, so
// the option is gone rather than discouraged.

interface SlotView {
  key: string;
  label: string;
  url: string;
  origin: "real" | "generated" | "uploaded";
}

interface SparePhoto {
  url: string;
  caption: string;
  subject: string;
}

interface VersionEntry {
  version: number;
  reason: string;
  note: string | null;
  created_at: string;
}

export function SlotPanel({ leadId }: { leadId: string }) {
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [spare, setSpare] = useState<SparePhoto[]>([]);
  const [versions, setVersions] = useState<Record<string, VersionEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
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
      setSpare(slotData.spare ?? []);
      setVersions(versionData.versions ?? {});
    } catch {
      // A failed refresh is not worth a banner; the next action retries.
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function swap(slotKey: string, url: string) {
    setBusy(slotKey);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: slotKey, url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "That swap did not apply.");
      else {
        setOpen(null);
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function upload(slotKey: string, file: File) {
    setBusy(slotKey);
    setError(null);
    try {
      const form = new FormData();
      form.append("slot", slotKey);
      form.append("file", file);
      const res = await fetch(`/api/leads/${leadId}/slots`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "That upload did not apply.");
      else await load();
    } finally {
      setBusy(null);
    }
  }

  async function restore(version: number) {
    setBusy("restore");
    try {
      await fetch(`/api/leads/${leadId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey: "home", version }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading images…
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        <ImageIcon className="mb-2 h-4 w-4" />
        No slotted images on this page yet. Generate the site, and every photograph it places will be swappable here.
      </div>
    );
  }

  const history = versions.home ?? [];

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot) => (
          <div key={slot.key} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="relative aspect-[4/3] bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slot.url} alt={slot.label} className="h-full w-full object-cover" />
              {slot.origin === "uploaded" && (
                <span className="absolute left-2 top-2 rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Uploaded
                </span>
              )}
            </div>
            <div className="space-y-2 p-3">
              <div>
                <p className="text-xs font-semibold">{slot.label}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{slot.key}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy === slot.key}
                  onClick={() => setOpen(open === slot.key ? null : slot.key)}
                  className="flex-1 rounded border border-border px-2 py-1.5 text-[11px] font-medium hover:bg-accent disabled:opacity-50"
                >
                  {busy === slot.key ? <Loader2 className="mx-auto h-3 w-3 animate-spin" /> : `Swap (${spare.length})`}
                </button>
                <button
                  type="button"
                  disabled={busy === slot.key}
                  onClick={() => fileInputs.current[slot.key]?.click()}
                  className="rounded border border-border px-2 py-1.5 text-[11px] font-medium hover:bg-accent disabled:opacity-50"
                  aria-label={`Upload a photo for ${slot.label}`}
                >
                  <Upload className="h-3 w-3" />
                </button>
                <input
                  ref={(el) => {
                    fileInputs.current[slot.key] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(slot.key, file);
                    e.target.value = "";
                  }}
                />
              </div>

              {open === slot.key && (
                <div className="grid grid-cols-3 gap-1.5 border-t border-border pt-2">
                  {spare.length === 0 && (
                    <p className="col-span-3 text-[11px] text-muted-foreground">
                      Every photo this lead has is already on the page. Upload one to swap.
                    </p>
                  )}
                  {spare.map((photo) => (
                    <button
                      key={photo.url}
                      type="button"
                      onClick={() => void swap(slot.key, photo.url)}
                      title={photo.caption}
                      className="overflow-hidden rounded border border-border hover:border-foreground"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt={photo.caption} className="aspect-square w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {history.length > 1 && (
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="mb-2 text-xs font-semibold">Page history</p>
          <ul className="space-y-1">
            {history.slice(0, 6).map((entry) => (
              <li key={entry.version} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate text-muted-foreground">
                  v{entry.version} · {entry.note || entry.reason} · {new Date(entry.created_at).toLocaleString()}
                </span>
                <button
                  type="button"
                  disabled={busy === "restore"}
                  onClick={() => void restore(entry.version)}
                  className="flex shrink-0 items-center gap-1 rounded border border-border px-1.5 py-0.5 font-medium hover:bg-accent disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" /> Restore
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
