"use client";

import { useMemo, useState } from "react";
import { Loader2, Send, Gift, Bell, DoorClosed, AlertTriangle, Check } from "lucide-react";
import type { Lead } from "@/types/database";
import { sequenceFor, isDue, type SequenceTrack } from "@/lib/outreach/sequence";

// The outreach list, grouped by which touch each prospect is next owed.
//
// The whole point of a three-step sequence is that the list is different on
// each step, so the filter is the stage rather than a status — "everyone due
// the 48h bump" is the only question this screen is ever asked.

const ICONS = [Gift, Bell, DoorClosed];

function sanitizeEmail(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const match = String(candidate).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|co|io|us|uk|ca|au|biz|info|tv|app|dev|me|site|tech|agency|studio|services|construction|plumbing|roofing)/i);
  return match ? match[0].toLowerCase() : null;
}

export function OutreachSequencePanel({
  leads,
  track = "outreach",
  title,
  blurb,
}: {
  leads: Lead[];
  track?: SequenceTrack;
  title?: string;
  blurb?: string;
}) {
  const sequence = sequenceFor(track);
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; skipped: { business: string; reason: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buckets = useMemo(() => {
    const map: Record<1 | 2 | 3, Lead[]> = { 1: [], 2: [], 3: [] };
    for (const lead of leads) {
      if (lead.outreach_stopped_at) continue;
      const next = (lead.outreach_stage ?? 0) + 1;
      if (next === 1 || next === 2 || next === 3) map[next].push(lead);
    }
    return map;
  }, [leads]);

  const inStage = buckets[stage];
  // Only prospects that would actually be sent can be selected — offering a
  // checkbox next to someone the server will skip is a promise the screen
  // cannot keep.
  const sendable = inStage.filter((l) => l.email && isDue(l, track));
  const allSelected = sendable.length > 0 && selected.length === sendable.length;

  async function send() {
    if (selected.length === 0) return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track, stage, leadIds: selected }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error ?? "Send failed."); return; }
      setResult({ sent: data.sent ?? 0, skipped: data.skipped ?? [] });
      setSelected([]);
      setTimeout(() => window.location.reload(), 1800);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
          {title ?? "Cold outreach sequence"}
        </h3>
        <p className="mt-1 text-[11px] leading-snug text-slate-500">
          {blurb ??
            "A gift, one bump, then a clean exit. Three touches and it stops — a fourth converts nobody and is what gets a sending domain blocked."}
        </p>
      </div>

      <div className="grid gap-1.5">
        {sequence.map((s, i) => {
          const Icon = ICONS[i];
          const count = buckets[s.stage].length;
          return (
            <button
              key={s.stage}
              type="button"
              onClick={() => { setStage(s.stage); setSelected([]); setResult(null); setError(null); }}
              className={`flex w-full min-w-0 items-center gap-2.5 rounded-lg border p-2.5 text-left transition ${
                stage === s.stage ? "border-[#533afd] bg-[#f0f3ff] ring-1 ring-[#533afd]" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 text-[#533afd]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-[#0d1738]">
                  {s.stage}. {s.label}
                </span>
                <span className="block truncate text-[10px] text-slate-500">{s.purpose}</span>
              </span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
            <input
              type="checkbox"
              checked={allSelected}
              disabled={sendable.length === 0}
              onChange={(e) => setSelected(e.target.checked ? sendable.map((l) => l.id) : [])}
            />
            Select all ready ({sendable.length})
          </label>
          <button
            type="button"
            disabled={sending || selected.length === 0}
            onClick={() => void send()}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#533afd] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#432bd9] disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {sending ? "Sending…" : `Send to ${selected.length}`}
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {inStage.length === 0 ? (
            <p className="px-3 py-3 text-xs italic text-slate-400">Nobody is waiting on this touch.</p>
          ) : (
            inStage.map((lead) => {
              const cleanEmail = sanitizeEmail(lead.email);
              const ready = Boolean(cleanEmail) && isDue(lead, track);
              const why = !cleanEmail ? "no email on file" : !isDue(lead, track) ? "not due yet" : null;
              return (
                <label
                  key={lead.id}
                  className={`flex items-center gap-2.5 border-b border-slate-50 px-3 py-2 text-xs last:border-0 ${
                    ready ? "cursor-pointer hover:bg-slate-50" : "opacity-55"
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={!ready}
                    checked={selected.includes(lead.id)}
                    onChange={(e) =>
                      setSelected((prev) => (e.target.checked ? [...prev, lead.id] : prev.filter((id) => id !== lead.id)))
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-[#0d1738]">{lead.business_name || lead.source_url}</span>
                    <span className="block truncate text-[10px] text-slate-500">{cleanEmail || lead.source_url}</span>
                  </span>
                  {why && <span className="shrink-0 text-[10px] font-semibold text-amber-600">{why}</span>}
                </label>
              );
            })
          )}
        </div>
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-[11px] font-semibold text-red-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-1 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
            <Check className="h-3.5 w-3.5" /> Sent to {result.sent}
          </p>
          {result.skipped.length > 0 && (
            <ul className="space-y-0.5 text-[10px] text-emerald-900/70">
              {result.skipped.slice(0, 6).map((s, i) => (
                <li key={i}>• {s.business}: {s.reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
