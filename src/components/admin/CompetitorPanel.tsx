"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, RotateCcw, Search, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// The real businesses this lead is up against.
//
// Lived inside the audit panel, which put it under "Their faults" — a tab
// about what is wrong with their own site. Who is beating them is a
// different argument and belongs beside the local search grid, which is the
// other half of the same conversation.

interface Competitor {
  name: string;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  speedScore: number | null;
  isClient: boolean;
}

export function CompetitorPanel({ leadId }: { leadId: string }) {
  const [competitors, setCompetitors] = useState<{ query: string; rows: Competitor[] } | null>(null);
  const [analysed, setAnalysed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [measuring, setMeasuring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/audit`);
      const data = await res.json().catch(() => ({}));
      setCompetitors(data.competitors ?? null);
      setAnalysed(data.analysed !== false);
    } catch {
      // A failed read is not worth a banner; the next action retries.
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  async function measure() {
    setMeasuring(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/audit`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not measure competitors");
      setCompetitors(data.competitors);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Measurement failed");
    } finally {
      setMeasuring(false);
    }
  }

  if (loading || !analysed) return null;

  return (
    <Card className="border border-border bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                <Search className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-[#0d1738]">Who they are up against</h3>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Searches for their trade in their city, then measures each competitor&apos;s real review count and real
              mobile speed. Costs a search and a few API calls, so it runs only when you ask.
            </p>
          </div>

          {!competitors ? (
            <Button
              type="button"
              disabled={measuring}
              onClick={measure}
              className="gap-2 bg-[#0d1738] text-sm font-bold text-white hover:bg-[#1b2a5c]"
            >
              {measuring ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingDown className="h-4 w-4" />}
              {measuring ? "Measuring..." : "Find their competitors"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={measuring}
              onClick={measure}
              className="gap-2 border-border text-xs font-semibold text-[#0d1738] hover:bg-[#f0f3ff] hover:text-[#533afd]"
            >
              {measuring ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#533afd]" /> : <RotateCcw className="h-3.5 w-3.5" />}
              {measuring ? "Re-measuring..." : "Redo measurement"}
            </Button>
          )}
        </div>

        {error && (
          <p className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-xs font-medium text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {competitors && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Real results for <b className="text-[#0d1738]">&ldquo;{competitors.query}&rdquo;</b>
              </p>
              <span className="text-[11px] text-muted-foreground">
                {competitors.rows.length - 1} competitors found
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-[#fbfbfd] text-[10px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2.5 font-bold">Business</th>
                    <th className="px-3 py-2.5 font-bold">Google rating</th>
                    <th className="px-3 py-2.5 font-bold">Reviews</th>
                    <th className="px-3 py-2.5 font-bold">Mobile speed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {competitors.rows.map((row) => (
                    <tr key={row.name} className={row.isClient ? "bg-[#f0f3ff] font-bold text-[#533afd]" : "text-[#42506a]"}>
                      <td className="px-3 py-2.5">
                        {/* The site is the point of the comparison — being
                            able to open the competitor beating them is half
                            of what makes this table useful on a call. */}
                        {row.website ? (
                          <a
                            href={row.website.startsWith("http") ? row.website : `https://${row.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:underline"
                          >
                            {row.name}
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                          </a>
                        ) : (
                          row.name
                        )}
                        {row.isClient && <span className="ml-1.5 text-[10px] font-bold">(your lead)</span>}
                      </td>
                      {/* A blank cell is honest. Nothing here is filled in
                          when it could not be measured. */}
                      <td className="px-3 py-2.5 tabular-nums">{row.rating ?? "—"}</td>
                      <td className="px-3 py-2.5 tabular-nums">{row.reviewCount ?? "—"}</td>
                      <td className="px-3 py-2.5 tabular-nums">{row.speedScore ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
