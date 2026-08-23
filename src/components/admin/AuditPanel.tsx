"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, BarChart3, Loader2, Search, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// What is wrong with the client's current site, and who is beating them.
//
// This is the sales conversation. Every line is derived from the crawl and
// PageSpeed run already paid for, so the owner can open their own site and
// verify it — which is exactly why it persuades, and why none of it may
// ever be invented.

interface AuditFinding {
  severity: "critical" | "warning" | "ok";
  area: string;
  title: string;
  finding: string;
  consequence: string;
  resolution: string;
  /** The measurement behind the claim, so it can be checked on a call. */
  evidence?: string;
}

interface Competitor {
  name: string;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  speedScore: number | null;
  isClient: boolean;
}

const SEVERITY_STYLE: Record<string, string> = {
  critical: "border-red-200 bg-red-50",
  warning: "border-amber-200 bg-amber-50",
  ok: "border-emerald-200 bg-emerald-50",
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  warning: "bg-amber-100 text-amber-800",
  ok: "bg-emerald-100 text-emerald-800",
};

export function AuditPanel({ leadId }: { leadId: string }) {
  const [audit, setAudit] = useState<{
    findings: AuditFinding[];
    criticalCount: number;
    warningCount?: number;
    passCount?: number;
    score?: number;
    speedScore: number | null;
    pageCount: number;
    pagesChecked?: number;
    pagesKnown?: number;
  } | null>(null);
  const [competitors, setCompetitors] = useState<{ query: string; rows: Competitor[] } | null>(null);
  const [analysed, setAnalysed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [measuring, setMeasuring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/audit`);
      const data = await res.json().catch(() => ({}));
      setAudit(data.audit ?? null);
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

  if (loading) {
    return (
      <Card className="border border-border bg-white shadow-sm">
        <CardContent className="flex items-center gap-2 p-6 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading the audit...
        </CardContent>
      </Card>
    );
  }

  if (!analysed || !audit) return null;

  return (
    <Card className="border border-border bg-white shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                <BarChart3 className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-[#0d1738]">What is wrong with their current site</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Every line is checkable against their own site. This is the conversation, not the report.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {typeof audit.score === "number" && (
              <span
                className={`rounded-full px-3 py-1 text-sm font-bold ${
                  audit.score < 50
                    ? "bg-red-50 text-red-700"
                    : audit.score < 80
                      ? "bg-amber-50 text-amber-800"
                      : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {audit.score}/100
              </span>
            )}
            {audit.criticalCount > 0 && (
              <span className="rounded-full bg-red-50 px-2.5 py-1 font-bold text-red-700">
                {audit.criticalCount} critical
              </span>
            )}
            {(audit.warningCount ?? 0) > 0 && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-800">
                {audit.warningCount} to fix
              </span>
            )}
            {(audit.passCount ?? 0) > 0 && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
                {audit.passCount} already fine
              </span>
            )}
            {audit.speedScore !== null && (
              <span className="rounded-full bg-[#f0f3ff] px-2.5 py-1 font-bold text-[#533afd]">
                Speed {audit.speedScore}/100
              </span>
            )}
          </div>
        </div>

        {/* Most checks below read every crawled page, so a two-page light
            read produces a thin audit of a site that may have hundreds of
            pages of problems. That is a fact about the crawl, not the site,
            and the operator is about to walk a client through it. */}
        {typeof audit.pagesChecked === "number" && (audit.pagesKnown ?? 0) > audit.pagesChecked && (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <b>Only {audit.pagesChecked} of {audit.pagesKnown} pages were read.</b> Most of these checks look at every
            page, so this list is thinner than their site really is. Run <b>Read their site · every page</b> in the Lead
            step for the full picture before you use this on a call.
          </p>
        )}

        {audit.findings.length === 0 ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
            Nothing critical found on their current site. Lead with the design and the local search gap instead.
          </p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {audit.findings.map((f) => (
              <div key={f.title} className={`rounded-lg border p-3 ${SEVERITY_STYLE[f.severity]}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-[#0d1738]">{f.title}</span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${SEVERITY_LABEL[f.severity]}`}>
                    {f.area}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#42506a]">{f.finding}</p>
                {f.evidence && (
                  // The measurement itself, so a claim made on a call can be
                  // checked while the client is still on it.
                  <p className="mt-1.5 rounded bg-black/[0.03] px-2 py-1 font-mono text-[10px] leading-relaxed text-[#60778d]">
                    {f.evidence}
                  </p>
                )}
                {f.consequence && (
                  <p className="mt-1.5 text-xs leading-relaxed text-[#42506a]">
                    <b className="text-[#0d1738]">Why it costs them: </b>
                    {f.consequence}
                  </p>
                )}
                <p className="mt-1.5 border-t border-black/5 pt-1.5 text-xs leading-relaxed text-emerald-800">
                  <b>What we do: </b>
                  {f.resolution}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <h4 className="text-xs font-bold text-[#0d1738]">Who they are up against</h4>
            </div>
            {!competitors && (
              <Button
                type="button"
                size="sm"
                disabled={measuring}
                onClick={measure}
                className="h-7 gap-1.5 bg-[#0d1738] text-[11px] font-bold text-white hover:bg-[#1b2a5c]"
              >
                {measuring ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingDown className="h-3 w-3" />}
                {measuring ? "Measuring..." : "Find real competitors"}
              </Button>
            )}
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-md bg-red-50 p-2 text-[11px] font-medium text-red-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}

          {!competitors && !error && (
            <p className="text-[11px] text-muted-foreground">
              Searches for their trade in their city, then measures each competitor&apos;s real review count and real
              mobile speed. Costs a search and a few API calls, so it runs only when you ask.
            </p>
          )}

          {competitors && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-[#fbfbfd] text-[10px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-bold">Business</th>
                    <th className="px-3 py-2 font-bold">Google rating</th>
                    <th className="px-3 py-2 font-bold">Reviews</th>
                    <th className="px-3 py-2 font-bold">Mobile speed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {competitors.rows.map((row) => (
                    <tr key={row.name} className={row.isClient ? "bg-[#f0f3ff] font-bold text-[#533afd]" : "text-[#42506a]"}>
                      <td className="px-3 py-2">
                        {row.name}
                        {row.isClient && <span className="ml-1.5 text-[10px] font-bold">(your lead)</span>}
                      </td>
                      {/* A blank cell is honest. Nothing here is filled in
                          when it could not be measured. */}
                      <td className="px-3 py-2 tabular-nums">{row.rating ?? "—"}</td>
                      <td className="px-3 py-2 tabular-nums">{row.reviewCount ?? "—"}</td>
                      <td className="px-3 py-2 tabular-nums">{row.speedScore ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
