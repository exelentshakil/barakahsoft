"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, X, Plus, AlertTriangle, ExternalLink } from "lucide-react";

// Setting model prices and recording spend.
//
// The look-up button asks a search-capable model to read the provider's own
// pricing page. What comes back lands in editable fields with the source
// link beside it and takes effect only when the operator saves — nothing
// here writes a rate on the model's say-so. A wrong price does not error, it
// reports a margin that is wrong on the screen used to judge the business,
// so a human confirming it is the point rather than friction.

interface PriceRow {
  model: string;
  provider: "openai" | "gemini";
  inputPerMillion: string;
  outputPerMillion: string;
  sourceUrl: string | null;
  note: string | null;
  source: "manual" | "looked-up";
}

export function CostSettingsDialog({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [looking, setLooking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [spendAmount, setSpendAmount] = useState("");
  const [spendKind, setSpendKind] = useState<"ads" | "tooling" | "other">("ads");
  const [spendDate, setSpendDate] = useState(new Date().toISOString().slice(0, 10));
  const [spendSaving, setSpendSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/models/pricing");
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error ?? "Could not load prices."); return; }

      const stored = new Map<string, PriceRow>();
      for (const p of data.prices ?? []) {
        stored.set(p.model, {
          model: p.model,
          provider: p.provider,
          inputPerMillion: String(p.input_per_million),
          outputPerMillion: String(p.output_per_million),
          sourceUrl: p.source_url,
          note: null,
          source: p.source,
        });
      }
      // Models that have been billed but never priced are what the operator
      // most needs to see, so they appear as empty rows rather than absences.
      for (const m of data.modelsInUse ?? []) {
        if (!stored.has(m.model)) {
          stored.set(m.model, {
            model: m.model, provider: m.provider,
            inputPerMillion: "", outputPerMillion: "", sourceUrl: null, note: null, source: "manual",
          });
        }
      }
      setRows([...stored.values()]);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function lookUp() {
    setLooking(true);
    setError(null);
    try {
      const res = await fetch("/api/models/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models: rows.map((r) => ({ model: r.model, provider: r.provider })) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error ?? "Look-up failed."); return; }

      setRows((prev) =>
        prev.map((row) => {
          const s = (data.suggestions ?? []).find((x: { model: string }) => x.model === row.model);
          if (!s || s.inputPerMillion === null) {
            return { ...row, note: s?.note ?? "No price found — enter it by hand." };
          }
          return {
            ...row,
            inputPerMillion: String(s.inputPerMillion),
            outputPerMillion: String(s.outputPerMillion ?? ""),
            sourceUrl: s.sourceUrl,
            note: s.note,
            source: "looked-up",
          };
        })
      );
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLooking(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = rows
        .filter((r) => r.inputPerMillion !== "" && r.outputPerMillion !== "")
        .map((r) => ({
          model: r.model,
          provider: r.provider,
          inputPerMillion: Number(r.inputPerMillion),
          outputPerMillion: Number(r.outputPerMillion),
          sourceUrl: r.sourceUrl,
          source: r.source,
        }));
      if (payload.length === 0) { setError("Fill in at least one price."); return; }

      const res = await fetch("/api/models/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices: payload }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error ?? "Save failed."); return; }
      setSaved(true);
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function addSpend() {
    const amount = Number(spendAmount);
    if (!Number.isFinite(amount) || amount <= 0) { setError("Enter an amount greater than zero."); return; }
    setSpendSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/costs/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: spendKind, amountUsd: amount, incurredOn: spendDate }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error ?? "Could not save."); return; }
      setSpendAmount("");
      setSaved(true);
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSpendSaving(false);
    }
  }

  function update(model: string, field: "inputPerMillion" | "outputPerMillion", value: string) {
    setRows((prev) =>
      prev.map((r) => (r.model === model ? { ...r, [field]: value, source: "manual" as const } : r))
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-600">Costs &amp; model prices</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">Price per million tokens (USD)</p>
            <button
              type="button"
              disabled={looking || rows.length === 0}
              onClick={() => void lookUp()}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:border-[#533afd] hover:text-[#533afd] disabled:opacity-40"
            >
              {looking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
              {looking ? "Looking up…" : "Look up current prices"}
            </button>
          </div>

          <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[10px] leading-snug text-amber-900">
            Look-up reads the provider&rsquo;s pricing page and fills these in as <strong>suggestions</strong>. Check them
            against your own invoice before saving — a wrong rate does not show an error, it quietly reports the wrong margin.
          </p>

          {loading ? (
            <p className="py-4 text-center text-xs text-slate-400">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="py-4 text-center text-xs italic text-slate-400">
              No models billed yet. Generate a site and they will appear here.
            </p>
          ) : (
            rows.map((r) => (
              <div key={r.model} className="rounded-lg border border-slate-200 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-bold text-slate-800">{r.model}</span>
                  {r.sourceUrl && (
                    <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-[#533afd] hover:underline">
                      source <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <label className="flex flex-1 items-center gap-1 text-[10px] font-semibold text-slate-500">
                    in
                    <input value={r.inputPerMillion} onChange={(e) => update(r.model, "inputPerMillion", e.target.value)}
                      inputMode="decimal" placeholder="—"
                      className="h-7 w-full rounded border border-slate-200 px-1.5 text-[11px] tabular-nums" />
                  </label>
                  <label className="flex flex-1 items-center gap-1 text-[10px] font-semibold text-slate-500">
                    out
                    <input value={r.outputPerMillion} onChange={(e) => update(r.model, "outputPerMillion", e.target.value)}
                      inputMode="decimal" placeholder="—"
                      className="h-7 w-full rounded border border-slate-200 px-1.5 text-[11px] tabular-nums" />
                  </label>
                </div>
                {r.note && <p className="mt-1 text-[10px] leading-snug text-amber-700">{r.note}</p>}
              </div>
            ))
          )}

          <button type="button" disabled={saving || loading} onClick={() => void save()}
            className="w-full rounded-md bg-[#533afd] py-2 text-xs font-bold text-white transition hover:bg-[#432bd9] disabled:opacity-40">
            {saving ? "Saving…" : saved ? "Saved" : "Save prices"}
          </button>
        </div>

        <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
          <p className="text-xs font-bold text-slate-700">Record spend</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <select value={spendKind} onChange={(e) => setSpendKind(e.target.value as typeof spendKind)}
              className="h-8 rounded border border-slate-200 px-1.5 text-[11px] font-semibold">
              <option value="ads">Ads</option>
              <option value="tooling">Tooling</option>
              <option value="other">Other</option>
            </select>
            <input value={spendAmount} onChange={(e) => setSpendAmount(e.target.value)} inputMode="decimal" placeholder="Amount USD"
              className="h-8 w-28 rounded border border-slate-200 px-2 text-[11px] tabular-nums" />
            <input type="date" value={spendDate} onChange={(e) => setSpendDate(e.target.value)}
              className="h-8 rounded border border-slate-200 px-1.5 text-[11px]" />
            <button type="button" disabled={spendSaving} onClick={() => void addSpend()}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-slate-900 px-3 text-[11px] font-bold text-white transition hover:bg-slate-800 disabled:opacity-40">
              {spendSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add
            </button>
          </div>
          <p className="text-[10px] text-slate-500">Dated, not stamped with today — ad spend entered late belongs in the week it happened.</p>

          <p className="text-[10px] leading-snug text-slate-500">
            Meta ad spend syncs on its own every six hours, and the refresh icon on the pulse pulls it on demand.
            Needs META_ADS_TOKEN and META_AD_ACCOUNT_ID — a System User token, not one from the Graph API Explorer,
            which expires within hours.
          </p>
        </div>

        {error && (
          <p className="mt-3 flex items-start gap-1.5 text-[11px] font-semibold text-rose-600">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          </p>
        )}
      </div>
    </div>
  );
}
