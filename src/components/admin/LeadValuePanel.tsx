"use client";

import { useState } from "react";
import { Check, Minus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { OfferOption } from "@/lib/audit/lead-value";

// What to quote this lead, and why.
//
// The pricing panel lets an operator set any number and gives no basis for
// choosing one, so the same offer goes to a business turning over millions
// and to a sole trader with four reviews. One of those is being overcharged
// into a no and the other is being undercharged into a yes worth half what
// it should be.
//
// Everything except the job-value estimate is measured from the scrape.
// That distinction is on the panel, because an operator about to say a
// number on a call needs to know which parts they can defend.

interface LeadValueSignal {
  label: string;
  weight: number;
  evidence: string;
}

export interface LeadValueData {
  tier: "budget" | "standard" | "premium";
  score: number;
  signals: LeadValueSignal[];
  typicalJobValue: string | null;
  recommendation: string;
  suggested: { setupPrice: number; monthlyPrice: number; standardValue: number; label: string; offerId: OfferOption["id"] };
  offers: OfferOption[];
}

const TIER_STYLE: Record<LeadValueData["tier"], { chip: string; name: string }> = {
  premium: { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", name: "Can pay properly" },
  standard: { chip: "bg-[#f0f3ff] text-[#533afd] border-[#c7d0fb]", name: "Steady business" },
  budget: { chip: "bg-amber-50 text-amber-800 border-amber-200", name: "Price sensitive" },
};

export function LeadValuePanel({ leadId, value }: { leadId: string; value: LeadValueData | null }) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!value) return null;
  const style = TIER_STYLE[value.tier];

  async function applySuggested() {
    if (!value) return;
    setApplying(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: value.suggested.monthlyPrice > 0 ? "monthly" : "flat",
          setupPrice: value.suggested.setupPrice,
          monthlyPrice: value.suggested.monthlyPrice,
          standardValue: value.suggested.standardValue,
          offerOptions: value.offers,
          offerId: value.suggested.offerId,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Could not save the price");
      setApplied(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the price");
    } finally {
      setApplying(false);
    }
  }

  return (
    <Card className="border border-border bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#533afd]" />
              <h3 className="text-base font-bold text-[#0d1738]">What to quote them</h3>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${style.chip}`}>{style.name}</span>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#42506a]">{value.recommendation}</p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-xs font-semibold text-[#777588]">Suggested</p>
            <p className="text-lg font-bold text-[#0d1738]">{value.suggested.label}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold text-[#777588]">Can-pay score</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-[#0d1738]">{value.score}/100</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Measured from their reviews, size, reach and how much they already invest.
            </p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold text-[#777588]">One job is worth roughly</p>
            <p className="mt-0.5 text-2xl font-bold text-[#0d1738]">{value.typicalJobValue ?? "—"}</p>
            {/* Labelled every time it is shown. It is the one number here
                that is a judgement rather than a reading, and an operator
                about to say it out loud needs to know that. */}
            <p className="mt-1 text-[11px] text-muted-foreground">
              An estimate for this trade — not measured. Use it to frame the monthly, never as a claim.
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-[#777588]">What the scrape actually found</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {value.signals.map((signal) => (
              <div key={signal.label} className="flex items-start gap-2 rounded-md bg-[#fbfbfd] px-2.5 py-2">
                {signal.weight >= 0 ? (
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                )}
                <span className="min-w-0 text-xs text-[#42506a]">
                  <b className="text-[#0d1738]">{signal.label}.</b> {signal.evidence}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="rounded-md bg-red-50 p-2.5 text-xs font-medium text-red-700">{error}</p>}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            A suggestion, not a rule. You can set any price in the pricing step.
          </p>
          <Button
            type="button"
            onClick={applySuggested}
            disabled={applying || applied}
            className="gap-2 bg-[#533afd] text-sm font-bold text-white hover:bg-[#432bd9]"
          >
            {applied ? <Check className="h-4 w-4" /> : null}
            {applied ? "AI price applied" : applying ? "Applying..." : `Apply AI price · ${value.suggested.label}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
