"use client";

import { useState } from "react";

// What the page will actually be, before it is built — and after.
//
// Replaces PagePlanPanel, which dry-ran the old composer: it showed which of
// fifteen fixed sections survived an evidence check, and struck through the
// rest. That panel was an honest window onto a dishonest mechanism, because a
// page that lost enough sections silently fell back to the vertical's generic
// list and shipped as a template.
//
// There is nothing to dry-run now. Structure is the PRD's, in this industry's
// own vocabulary, so what an operator needs to see is the brief the build
// committed to and what the audit measured against it.

interface AuditFinding {
  check: string;
  severity: "blocker" | "finding" | "note";
  detail: string;
}

interface AuditReport {
  findings?: AuditFinding[];
  score?: number;
  repairs?: number;
  previewUrl?: string | null;
}

export function DesignBriefPanel({
  leadId,
  rationale,
  audit,
  missingCount,
}: {
  leadId: string;
  rationale: string | null;
  audit: AuditReport | null;
  missingCount: number;
}) {
  const [busy, setBusy] = useState(false);

  const findings = audit?.findings ?? [];
  const timid = findings.find((finding) => finding.check === "timid");
  const blockers = findings.filter((finding) => finding.severity === "blocker");
  const score = audit?.score;

  async function regenerate() {
    setBusy(true);
    try {
      await fetch(`/api/leads/${leadId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: 1 }),
      });
    } finally {
      setBusy(false);
    }
  }

  if (!rationale) {
    return (
      <section className="rounded-lg border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
        No design brief yet. It is written at the start of a build, and everything after it — the palette, the
        type scale, the section list, the photography — is compiled from what it decides.
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-lg border border-neutral-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">The design brief</h3>
          <p className="text-xs text-neutral-500">
            Written before the build. Every colour, size and section traces back to it.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {typeof score === "number" && (
            <span
              className={`rounded px-2 py-1 text-xs font-medium ${
                score >= 85 ? "bg-emerald-50 text-emerald-800" : score >= 60 ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-800"
              }`}
            >
              audit {score}/100
              {audit?.repairs ? ` · ${audit.repairs} repair${audit.repairs > 1 ? "s" : ""}` : ""}
            </span>
          )}
          <button
            type="button"
            onClick={regenerate}
            disabled={busy}
            className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {busy ? "Rebuilding…" : "Regenerate brief and rebuild"}
          </button>
        </div>
      </header>

      {(timid || blockers.length > 0 || missingCount > 0) && (
        <div className="space-y-2 border-b border-neutral-200 bg-neutral-50 px-5 py-3 text-xs">
          {timid && (
            <p className="text-amber-800">
              <strong>Timid.</strong> {timid.detail}
            </p>
          )}
          {blockers.map((blocker) => (
            <p key={blocker.check} className="text-red-800">
              <strong>{blocker.check}.</strong> {blocker.detail}
            </p>
          ))}
          {missingCount > 0 && (
            <p className="text-neutral-600">
              {missingCount} intake question{missingCount > 1 ? "s are" : " is"} still unanswered. The page was
              designed around the gap rather than inventing a value — answering them and rebuilding gives it more
              to work with.
            </p>
          )}
        </div>
      )}

      <div className="max-h-[420px] overflow-y-auto px-5 py-4">
        <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-neutral-700">{rationale}</pre>
      </div>
    </section>
  );
}
