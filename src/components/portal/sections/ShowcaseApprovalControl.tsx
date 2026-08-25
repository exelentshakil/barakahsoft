"use client";

import { useState } from "react";
import { BadgeCheck, Loader2, RefreshCw, AlertTriangle, X } from "lucide-react";

// Operator-only control, rendered inside the client's own proposal page.
//
// It lives here rather than in the admin workspace because this is where the
// judgement actually gets made: the operator is looking at the finished
// redesign next to the old site, which is exactly the moment they can tell
// whether it is good enough to put on the marketing homepage. Sending them
// to a different screen to approve something they are currently looking at
// is how showcases never get approved at all.
//
// The client never sees this — the page only renders it when the server
// resolved an operator session (accounts-table allowlist, same as /admin).

interface ShowcaseApprovalControlProps {
  leadId: string;
  initialApproved: boolean;
  initialLabel: string | null;
  hasImages: boolean;
}

export function ShowcaseApprovalControl({
  leadId,
  initialApproved,
  initialLabel,
  hasImages,
}: ShowcaseApprovalControlProps) {
  const [approved, setApproved] = useState(initialApproved);
  const [label, setLabel] = useState(initialLabel ?? "");
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function send(action: "approve" | "revoke", recapture = false) {
    setBusy(true);
    setError(null);
    setProblems([]);
    try {
      const res = await fetch(`/api/leads/${leadId}/showcase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, recapture, label: label.trim() || undefined }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
        if (Array.isArray(data?.problems)) setProblems(data.problems);
        return;
      }

      setApproved(Boolean(data?.approved));
      if (Array.isArray(data?.problems) && data.problems.length > 0) setProblems(data.problems);
      // The landing page is a separate server-rendered route, so its cached
      // showcase list will not reflect this until it revalidates.
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-[#f0a202] bg-[#fffaf0] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BadgeCheck className={`h-4 w-4 shrink-0 ${approved ? "text-[#0b8f5b]" : "text-[#b07500]"}`} />
          <div>
            <p className="text-xs font-bold text-[#0d1738]">
              Operator only — {approved ? "live on the landing page" : "not on the landing page"}
            </p>
            <p className="text-[11px] text-[#6b5a34]">
              Approving publishes this before/after to the public Design Quality Bar section.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label, e.g. Roofing"
            className="h-8 w-40 rounded-md border border-[#e0cfa8] bg-white px-2 text-xs text-[#0d1738] outline-none focus:border-[#f0a202]"
          />

          {approved ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => send("approve", true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#c7d0fb] bg-white px-3 text-xs font-bold text-[#533afd] transition hover:bg-[#f0f3ff] disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Re-capture
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => send("revoke")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#f3c2c2] bg-white px-3 text-xs font-bold text-[#b42318] transition hover:bg-[#fff5f5] disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => send("approve")}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0b8f5b] px-3 text-xs font-bold text-white transition hover:bg-[#097a4d] disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
              {hasImages ? "Approve for landing page" : "Capture & approve"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-[11px] font-semibold text-[#b42318]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {problems.length > 0 && (
        <ul className="space-y-1 text-[11px] text-[#8a6d1f]">
          {problems.map((p) => (
            <li key={p}>• {p}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
