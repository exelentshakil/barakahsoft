"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Artifact, Lead } from "@/types/database";

// The approval gate, and the domain the site will live on.
//
// Both existed and neither was reachable. The QA route was built, the client
// portal gates every price and section on qa_status, and there was no control
// anywhere that could set it — so nothing could ever be approved and no
// portal could ever unlock. DomainManager had the same problem: fully built,
// mounted only inside a tabs layout that nothing renders.
//
// They belong together because they are the same moment in the workflow: the
// operator says this is good enough to send, and says where it will live.

export function ApprovalGate({
  lead,
  artifact,
  onChanged,
}: {
  lead: Lead;
  artifact: Artifact | null;
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const status = artifact?.qa_status ?? "pending";
  const approved = status === "approved";
  const ready = !!artifact?.bespoke_homepage_html;

  async function decide(decision: "approved" | "rejected") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason: decision === "rejected" ? reason : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not record that decision");
      setRejecting(false);
      setReason("");
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border border-border bg-white shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-[#0d1738]">Approve &amp; go live</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Approving unlocks the client&apos;s portal — the price and the full report stay hidden until you do.
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              approved
                ? "bg-emerald-50 text-emerald-700"
                : status === "rejected"
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-800"
            }`}
          >
            {approved ? "Approved" : status === "rejected" ? "Rejected" : "Awaiting approval"}
          </span>
        </div>

        {error && <p className="rounded-md bg-red-50 p-2.5 text-xs font-medium text-red-700">{error}</p>}

        {!ready ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Generate the homepage before approving — there is nothing for the client to look at yet.
          </p>
        ) : approved ? (
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
            <p className="text-xs text-emerald-900">
              <b>Portal unlocked.</b> The client can see the report, the site and the price.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => decide("rejected")}
              className="ml-auto h-7 text-[11px]"
            >
              Lock it again
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={busy}
                onClick={() => decide("approved")}
                className="gap-2 bg-emerald-600 font-bold text-white hover:bg-emerald-700"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Approve &amp; unlock the portal
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setRejecting((v) => !v)}
                className="gap-2 text-xs"
              >
                <XCircle className="h-3.5 w-3.5 text-red-600" />
                Needs more work
              </Button>
            </div>

            {rejecting && (
              <div className="space-y-2 rounded-md border border-border bg-[#fbfbfd] p-3">
                <Textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="What needs fixing? Saved against the lead so you remember when you come back."
                  className="text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => decide("rejected")}
                  className="h-7 text-[11px] font-semibold"
                >
                  Save and keep it locked
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-border pt-4">
        </div>
      </CardContent>
    </Card>
  );
}
