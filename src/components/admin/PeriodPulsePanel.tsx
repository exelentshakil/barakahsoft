"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, AlertTriangle, Settings, RefreshCw } from "lucide-react";
import { CostSettingsDialog } from "@/components/admin/CostSettingsDialog";

// Did this period pay for itself?
//
// The pulse previously showed collected revenue and open pipeline and
// nothing about what the leads cost to produce, so the one number that
// decides whether this works — what went out against what came in — was not
// on the screen at all.

type Period = "week" | "fortnight" | "month" | "custom";

interface Summary {
  from: string;
  to: string;
  ai: { calls: number; promptTokens: number; completionTokens: number; costUsd: number; unpricedCalls: number };
  otherCosts: { kind: string; amountUsd: number }[];
  paidLeads: number;
  pricingConfigured: boolean;
}

const PERIODS: { id: Period; label: string }[] = [
  { id: "week", label: "7 days" },
  { id: "fortnight", label: "14 days" },
  { id: "month", label: "Month" },
  { id: "custom", label: "Custom" },
];

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function PeriodPulsePanel({ collectedRevenue, pipelineToClose }: { collectedRevenue: number; pipelineToClose: number }) {
  const [period, setPeriod] = useState<Period>("week");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  // The same sync the nightly job runs. Kept on the panel rather than only
  // inside settings because "is this figure current?" is asked while looking
  // at the figure, not while configuring anything.
  async function pullAdSpend() {
    setSyncing(true);
    setSyncNote(null);
    setError(null);
    try {
      const res = await fetch("/api/costs/meta-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 30 }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) { setError(body?.error ?? "Sync failed."); return; }
      if (body.synced === 0) { setSyncNote(body.note ?? "Nothing to sync."); return; }
      setSyncNote(`${body.synced} days · ${body.currency} ${body.totalSpend.toFixed(2)}`);
      if (body.currencyWarning) setError(body.currencyWarning);
      await load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSyncing(false);
    }
  }

  const load = useCallback(async () => {
    if (period === "custom" && !from) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ period });
      if (period === "custom") {
        qs.set("from", from);
        if (to) qs.set("to", to);
      }
      const res = await fetch(`/api/costs?${qs}`);
      const body = await res.json().catch(() => null);
      if (!res.ok) { setError(body?.error ?? "Could not load costs."); return; }
      setData(body);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [period, from, to]);

  useEffect(() => { void load(); }, [load]);

  const otherTotal = (data?.otherCosts ?? []).reduce((n, c) => n + c.amountUsd, 0);
  const spend = (data?.ai.costUsd ?? 0) + otherTotal;
  const net = collectedRevenue - spend;

  return (
    <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500">Target pulse</span>
        <span className="flex items-center gap-1.5">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
          <button type="button" onClick={() => setSettingsOpen(true)} title="Costs and model prices"
            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <Settings className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`rounded-md px-2 py-1 text-[10px] font-bold transition ${
              period === p.id ? "bg-[#533afd] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="flex items-center gap-1.5">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-7 flex-1 rounded border border-slate-200 px-1.5 text-[10px]" />
          <span className="text-[10px] text-slate-400">to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-7 flex-1 rounded border border-slate-200 px-1.5 text-[10px]" />
        </div>
      )}

      <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
        <Row label="Collected revenue" value={money(collectedRevenue)} tone="good" />
        <Row label="AI processing" value={data ? money(data.ai.costUsd) : "—"} tone="cost" />
        {(data?.otherCosts ?? []).map((c) => (
          <Row key={c.kind} label={c.kind === "ads" ? "Ad spend" : c.kind} value={money(c.amountUsd)} tone="cost" />
        ))}
        <div className="flex items-center justify-between pt-0.5">
          <button
            type="button"
            disabled={syncing}
            onClick={() => void pullAdSpend()}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 transition hover:border-[#533afd] hover:text-[#533afd] disabled:opacity-40"
          >
            {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            {syncing ? "Pulling…" : "Pull ad spend"}
          </button>
          {syncNote && <span className="text-[10px] font-semibold text-emerald-700">{syncNote}</span>}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
          <span className="text-xs font-black text-slate-700">Net</span>
          <span className={`rounded border px-2 py-0.5 text-base font-black ${
            net >= 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}>
            {money(net)}
          </span>
        </div>
        <Row label="Pipeline to close" value={money(pipelineToClose)} tone="neutral" />
      </div>

      {data && (
        <p className="text-[10px] leading-snug text-slate-400">
          {data.ai.calls} model calls · {(data.ai.promptTokens + data.ai.completionTokens).toLocaleString()} tokens ·{" "}
          {data.paidLeads} paid {data.paidLeads === 1 ? "lead" : "leads"}
        </p>
      )}

      {/* An unpriced model contributes tokens but no dollars, so the spend
          figure above is a floor rather than a total. Saying so beats a
          number that quietly understates what the week cost. */}
      {data && !data.pricingConfigured && (
        <p className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[10px] leading-snug text-amber-900">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            No model prices set, so cost shows as $0 — tokens above are already accurate.{" "}
            <button type="button" onClick={() => setSettingsOpen(true)} className="font-bold underline">
              Set prices
            </button>
          </span>
        </p>
      )}
      {data?.pricingConfigured && data.ai.unpricedCalls > 0 && (
        <p className="text-[10px] leading-snug text-amber-700">
          {data.ai.unpricedCalls} of {data.ai.calls} calls used a model with no price — actual spend is higher.
        </p>
      )}

      {error && <p className="text-[10px] font-semibold text-rose-600">{error}</p>}

      {settingsOpen && <CostSettingsDialog onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: "good" | "cost" | "neutral" }) {
  const colour = tone === "good" ? "text-emerald-700" : tone === "cost" ? "text-rose-600" : "text-indigo-700";
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <span className={`text-sm font-black ${colour}`}>{tone === "cost" ? `−${value.replace("$", "$")}` : value}</span>
    </div>
  );
}
