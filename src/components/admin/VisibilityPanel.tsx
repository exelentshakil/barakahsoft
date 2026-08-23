"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, RotateCcw, Search, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Local search visibility, run on demand at a size the operator chooses.
//
// Grid size is a real commercial decision, not a setting. Every cell is a
// paid search, and the measurement is worth far more in some trades than
// others: a roofer competes across a whole metro and being invisible in
// twelve suburbs is the pitch, while a painter working three postcodes
// learns almost nothing from a 49-cell sweep. Making the choice explicit,
// with the cost attached, is what stops it being spent by habit.

interface Cell {
  area: string;
  rank: number | null;
  topCompetitor: string | null;
  ahead: string[];
}

interface Report {
  query: string;
  provider: string;
  cells: Cell[];
  visible: number;
  missing: number;
  dominant: number;
  measuredAt: string;
}

const SIZES = [
  {
    cells: 9,
    label: "3 × 3",
    note: "9 areas",
    when: "A quick read, or a trade working a handful of postcodes",
  },
  {
    cells: 25,
    label: "5 × 5",
    note: "25 areas",
    when: "The usual choice — enough coverage to show a real pattern",
  },
  {
    cells: 49,
    label: "7 × 7",
    note: "49 areas",
    when: "Metro-wide trades, and the size the ad promises",
  },
];

function cellColour(rank: number | null): string {
  if (rank === null) return "bg-red-100 text-red-700 border-red-200";
  if (rank <= 3) return "bg-emerald-500 text-white border-emerald-600";
  if (rank <= 10) return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-orange-100 text-orange-800 border-orange-300";
}

export function VisibilityPanel({ leadId, industry }: { leadId: string; industry?: string | null }) {
  const [report, setReport] = useState<Report | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Cell | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/visibility`);
      const data = await res.json().catch(() => ({}));
      if (data.visibility) {
        setReport(data.visibility);
        setRunning(false);
      }
    } catch {
      // A failed poll is not an error worth surfacing.
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  // The measurement is dozens of real searches, so it runs as a job and the
  // panel watches for the result rather than holding a request open.
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [running, load]);

  async function run(cells: number) {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/visibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cells }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not start the measurement");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Measurement failed to start");
      setRunning(false);
    }
  }

  // Identify top rival holding the most spots where the lead is absent
  const topRival = useMemo(() => {
    if (!report) return null;
    const holders = new Map<string, number>();
    for (const cell of report.cells) {
      if (cell.rank === null && cell.topCompetitor) {
        holders.set(cell.topCompetitor, (holders.get(cell.topCompetitor) ?? 0) + 1);
      }
    }
    return [...holders.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  }, [report]);

  return (
    <Card className="border border-border bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                <Search className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-[#0d1738]">Local search visibility</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Runs a real search per area and records who actually appears. Nothing is estimated.
            </p>
          </div>
          {report && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                Missing in {report.missing} of {report.cells.length}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={running}
                onClick={() => run(report.cells.length)}
                className="gap-1.5 border-border text-xs font-semibold text-[#0d1738] hover:bg-[#f0f3ff] hover:text-[#533afd]"
              >
                {running ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#533afd]" /> : <RotateCcw className="h-3.5 w-3.5" />}
                {running ? "Re-measuring..." : "Redo search"}
              </Button>
            </div>
          )}
        </div>

        {error && <p className="rounded-md bg-red-50 p-2.5 text-xs font-medium text-red-700">{error}</p>}

        {!report && !running && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Choose a size. Every area is a paid search, so pick the smallest that makes the point
              {industry ? ` for a ${industry.toLowerCase()}` : ""}.
            </p>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
              {SIZES.map((size) => (
                <button
                  key={size.cells}
                  type="button"
                  onClick={() => run(size.cells)}
                  className="group flex flex-col rounded-xl border border-border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#533afd] hover:shadow-md"
                >
                  <span className="flex items-center justify-between">
                    <span className="text-lg font-bold tracking-tight text-[#0d1738]">{size.label}</span>
                    <span className="rounded-full bg-[#f0f3ff] px-2 py-0.5 font-mono text-[10px] font-bold text-[#533afd]">
                      {size.note}
                    </span>
                  </span>
                  <span className="mt-2 block text-[11px] leading-snug text-muted-foreground">{size.when}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#533afd] opacity-0 transition group-hover:opacity-100">
                    Run this size <TrendingDown className="h-3 w-3 rotate-90" />
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Skip it entirely for trades that win on referral rather than local search — the report still carries the
              speed audit, the friction points and the competitor benchmark.
            </p>
          </div>
        )}

        {running && (
          <div className="flex items-center gap-2 rounded-md border border-[#533afd]/20 bg-[#f9f9ff] p-3 text-xs text-[#0d1738]">
            <Loader2 className="h-4 w-4 animate-spin text-[#533afd]" />
            Searching each area. This takes a few minutes — you can leave this page.
          </div>
        )}

        {report && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded bg-emerald-50 px-2 py-1 font-semibold text-emerald-800">
                Top 3 in {report.dominant}
              </span>
              <span className="rounded bg-amber-50 px-2 py-1 font-semibold text-amber-800">
                Visible in {report.visible}
              </span>
              <span className="rounded bg-red-50 px-2 py-1 font-semibold text-red-700">
                Absent in {report.missing}
              </span>
              <span className="ml-auto text-muted-foreground">
                via {report.provider} · {new Date(report.measuredAt).toLocaleDateString()}
              </span>
            </div>

            {/* Two-column layout: Map Grid on Left, Rich Details / Inspector on Right */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
              {/* Left Column: Matrix Grid */}
              <div className="flex flex-col items-start gap-3 lg:col-span-5">
                <div className="rounded-xl border border-border/70 bg-[#fbfbfd] p-3.5 shadow-inner">
                  <div
                    className="grid gap-1.5"
                    style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(report.cells.length))}, minmax(0, 1fr))` }}
                  >
                    {report.cells.map((cell) => {
                      const isSelected = selected?.area === cell.area;
                      return (
                        <button
                          key={cell.area}
                          type="button"
                          onClick={() => setSelected(cell)}
                          title={`${cell.area} — ${cell.rank ? `Ranked #${cell.rank}` : "Does not appear"}`}
                          className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border text-xs font-bold transition-all ${cellColour(
                            cell.rank
                          )} ${
                            isSelected
                              ? "ring-2 ring-[#533afd] ring-offset-2 scale-105 z-10 font-extrabold shadow-sm"
                              : "hover:scale-105"
                          }`}
                        >
                          {cell.rank ?? "–"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Map Legend */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
                    <span>Top 3</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-amber-400" />
                    <span>Visible (4–10)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-orange-400" />
                    <span>Visible (11+)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-red-400" />
                    <span>Absent</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Area Details & Insights */}
              <div className="flex flex-col gap-3 lg:col-span-7">
                {selected ? (
                  <div className="rounded-xl border border-[#533afd]/20 bg-[#f9f9ff] p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-[#533afd]/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#533afd]/10 text-[#533afd]">
                          <MapPin className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-[#0d1738]">{selected.area}</h4>
                          <p className="text-[11px] text-muted-foreground">Local search area</p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          selected.rank === null
                            ? "bg-red-100 text-red-700"
                            : selected.rank <= 3
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {selected.rank ? `Ranked #${selected.rank}` : "Does not appear"}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {selected.topCompetitor ? (
                        <div className="rounded-lg border border-border bg-white p-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Top Competitor
                          </span>
                          <p className="mt-1 font-semibold text-[#0d1738] flex items-center gap-1.5">
                            <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            {selected.topCompetitor}
                          </p>
                          {selected.ahead && selected.ahead.length > 1 && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Holds the top spot ahead of {selected.ahead.length - 1} other competing{" "}
                              {selected.ahead.length - 1 === 1 ? "business" : "businesses"}.
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">No competitor details recorded for this point.</p>
                      )}

                      {selected.rank === null ? (
                        <p className="text-[11px] text-red-700 bg-red-50 rounded-lg p-2.5 font-medium leading-relaxed">
                          Your lead is completely absent in <strong>{selected.area}</strong>. Potential customers searching here are going directly to competitors.
                        </p>
                      ) : selected.rank <= 3 ? (
                        <p className="text-[11px] text-emerald-800 bg-emerald-50 rounded-lg p-2.5 font-medium leading-relaxed">
                          Strong presence! Your lead ranks #{selected.rank} in the top 3 spots for <strong>{selected.area}</strong>.
                        </p>
                      ) : (
                        <p className="text-[11px] text-amber-800 bg-amber-50 rounded-lg p-2.5 font-medium leading-relaxed">
                          Your lead appears at #{selected.rank} in <strong>{selected.area}</strong>, but sits below the prime top-3 local pack.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-[#fbfbfd] p-4 text-xs space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-[#533afd]" />
                      <span className="font-semibold text-[#0d1738]">Area Inspector</span>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                      Click any square on the map to inspect who holds the top spot in that suburb and where your lead ranks.
                    </p>

                    {topRival && (
                      <div className="rounded-lg border border-border/80 bg-white p-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Leading Rival in Missing Areas
                        </span>
                        <p className="mt-1 text-xs text-[#0d1738] leading-snug">
                          <strong className="text-[#533afd]">{topRival[0]}</strong> holds the #1 spot across{" "}
                          <strong>{topRival[1]}</strong> of the {report.missing} areas where your lead does not appear.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setReport(null);
                      setSelected(null);
                    }}
                    className="text-[11px] font-semibold text-[#533afd] hover:underline"
                  >
                    Measure again at a different size
                  </button>
                  {selected && (
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="text-[11px] text-muted-foreground hover:text-[#0d1738] hover:underline"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
