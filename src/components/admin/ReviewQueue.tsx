"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// One screen, one keyboard.
//
// At three hundred builds a day the review has to cost seconds, so every
// action is a single key and the queue advances on its own. Reading a row is
// meant to be: look at the shot, read the idea, glance at the score, decide.

export interface QueueRow {
  leadId: string;
  businessName: string;
  industry: string;
  slug: string;
  websiteUrl: string | null;
  state: string;
  score: number | null;
  repairs: number;
  previewUrl: string | null;
  idea: string | null;
  sectionCount: number | null;
  findings: Array<{ check: string; severity: string; detail: string }>;
}

const KEYS = "  a approve · r reject · b rebuild · j/k or arrows to move · o open ";

export function ReviewQueue({ rows }: { rows: QueueRow[] }) {
  const pending = useMemo(() => rows.filter((row) => row.state === "pending" || row.state === "building"), [rows]);
  const [queue, setQueue] = useState(pending);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const current = queue[index] ?? null;

  const act = useCallback(
    async (action: "approve" | "reject" | "rebuild") => {
      if (!current || busy) return;
      setBusy(true);
      const reason = action === "reject" ? window.prompt("Why? One line — recurring reasons are the next prompt change.") ?? "" : "";
      try {
        const response = await fetch(`/api/leads/${current.leadId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          setNote(body.error ?? "That did not work.");
          return;
        }
        setNote(`${current.businessName} — ${action === "rebuild" ? "rebuilding with a different look" : `${action}d`}`);
        // Removed from the queue rather than marked in place: a row that has
        // been decided is not one to scroll back past.
        setQueue((rest) => rest.filter((row) => row.leadId !== current.leadId));
        setIndex((i) => Math.max(0, Math.min(i, queue.length - 2)));
      } finally {
        setBusy(false);
      }
    },
    [current, busy, queue.length]
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      if (event.key === "a") void act("approve");
      else if (event.key === "r") void act("reject");
      else if (event.key === "b") void act("rebuild");
      else if (event.key === "j" || event.key === "ArrowDown") setIndex((i) => Math.min(i + 1, queue.length - 1));
      else if (event.key === "k" || event.key === "ArrowUp") setIndex((i) => Math.max(i - 1, 0));
      else if (event.key === "o" && current) window.open(`/s/${current.slug}?view=preview`, "_blank");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, queue.length, current]);

  if (!queue.length) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-lg font-semibold text-neutral-900">Nothing waiting</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Every build has been decided. New ones land here automatically as they finish.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Review queue</h1>
          <p className="text-sm text-neutral-500">
            {queue.length} waiting · nothing is sent from here, approving marks it fit to send
          </p>
        </div>
        <code className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-600">{KEYS}</code>
      </header>

      {note && <p className="mb-4 rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">{note}</p>}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <ol className="max-h-[70vh] space-y-1 overflow-y-auto">
          {queue.map((row, i) => (
            <li key={row.leadId}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                className={`w-full rounded px-3 py-2 text-left text-sm ${
                  i === index ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <span className="block truncate font-medium">{row.businessName}</span>
                <span className={`block truncate text-xs ${i === index ? "text-neutral-300" : "text-neutral-500"}`}>
                  {row.industry}
                  {typeof row.score === "number" ? ` · ${row.score}/100` : ""}
                </span>
              </button>
            </li>
          ))}
        </ol>

        {current && (
          <section className="rounded-lg border border-neutral-200 bg-white">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-neutral-900">{current.businessName}</h2>
                {current.idea && <p className="mt-1 text-sm italic text-neutral-600">“{current.idea}”</p>}
                <p className="mt-1 text-xs text-neutral-500">
                  {current.sectionCount ?? "?"} sections
                  {current.repairs ? ` · ${current.repairs} repair round${current.repairs > 1 ? "s" : ""}` : ""}
                  {current.websiteUrl ? ` · was ${current.websiteUrl.replace(/^https?:\/\//, "")}` : ""}
                </p>
              </div>
              {typeof current.score === "number" && (
                <span
                  className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${
                    current.score >= 85
                      ? "bg-emerald-50 text-emerald-800"
                      : current.score >= 60
                        ? "bg-amber-50 text-amber-800"
                        : "bg-red-50 text-red-800"
                  }`}
                >
                  {current.score}/100
                </span>
              )}
            </header>

            {current.findings.length > 0 && (
              <ul className="space-y-1 border-b border-neutral-200 bg-neutral-50 px-5 py-3 text-xs text-neutral-700">
                {current.findings.map((finding) => (
                  <li key={finding.check}>
                    <strong>{finding.check}</strong> — {finding.detail}
                  </li>
                ))}
              </ul>
            )}

            <div className="max-h-[52vh] overflow-y-auto bg-neutral-100 p-4">
              {current.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.previewUrl} alt={`${current.businessName} homepage`} className="w-full rounded shadow-sm" />
              ) : (
                <p className="py-12 text-center text-sm text-neutral-500">
                  No screenshot — open the preview to see it.
                </p>
              )}
            </div>

            <footer className="flex flex-wrap gap-2 border-t border-neutral-200 px-5 py-3">
              <button
                type="button"
                onClick={() => void act("approve")}
                disabled={busy}
                className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Approve <kbd className="ml-1 opacity-60">a</kbd>
              </button>
              <button
                type="button"
                onClick={() => void act("rebuild")}
                disabled={busy}
                className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 disabled:opacity-50"
              >
                Rebuild, different look <kbd className="ml-1 opacity-60">b</kbd>
              </button>
              <button
                type="button"
                onClick={() => void act("reject")}
                disabled={busy}
                className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
              >
                Reject <kbd className="ml-1 opacity-60">r</kbd>
              </button>
              <a
                href={`/s/${current.slug}?view=preview`}
                target="_blank"
                rel="noreferrer"
                className="ml-auto rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
              >
                Open <kbd className="ml-1 opacity-60">o</kbd>
              </a>
            </footer>
          </section>
        )}
      </div>
    </main>
  );
}
