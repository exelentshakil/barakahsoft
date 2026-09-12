"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Send, MailX, Maximize2, CheckCircle2 } from "lucide-react";

// Look at the pages, untick the bad ones, send the rest.
//
// Each card is the real generated document in an iframe pointed at
// /api/leads/[id]/raw, scaled down. Not a screenshot: there is no capture
// service to run, nothing to store, nothing to go stale, and clicking through
// to the full size is the same bytes already in the browser cache.

export interface ReviewCard {
  id: string;
  name: string;
  host: string;
  email: string | null;
  draft: Record<string, unknown> | null;
}

// The frame renders at desktop width and is scaled to the card, so the mockup
// is judged at the proportions a recipient will actually see.
const FRAME_W = 1280;
const FRAME_H = 1000;

export function ReviewGrid({ cards }: { cards: ReviewCard[] }) {
  const router = useRouter();
  const mailable = useMemo(() => cards.filter((c) => c.email), [cards]);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(mailable.map((c) => c.id)));
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function send() {
    const ids = [...picked];
    if (ids.length === 0) return;
    setSending(true);
    setError(null);
    setResult(null);

    // Chunked because the sender caps a request at fifty, and because a daily
    // send is worth watching move rather than staring at one long spinner.
    let sent = 0;
    let capped = false;
    let remaining: number | null = null;
    const skipped: string[] = [];
    try {
      for (let i = 0; i < ids.length; i += 50) {
        const res = await fetch("/api/outreach/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ track: "outreach", stage: 1, leadIds: ids.slice(i, i + 50) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "The send failed.");
        sent += data.sent ?? 0;
        if (typeof data.remainingToday === "number") remaining = data.remainingToday;
        for (const s of data.skipped ?? []) {
          const reason = typeof s === "string" ? s : s.reason ?? "skipped";
          if (reason.includes("limit")) capped = true;
          skipped.push(reason);
        }
        // The day's budget is spent; the rest keep their place for tomorrow and
        // there is no point issuing the remaining chunks.
        if (remaining === 0) { capped = true; break; }
      }
      setResult(
        capped
          ? `Sent ${sent}. That is today's limit — the rest stay here and can go tomorrow. ` +
            `The cap protects the sending domain, so it is deliberate.`
          : `Sent ${sent}.${skipped.length ? ` ${skipped.length} skipped.` : ""}` +
            `${remaining != null ? ` ${remaining} more can go today.` : ""}`
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The send failed.");
    } finally {
      setSending(false);
    }
  }

  if (cards.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="font-display text-2xl font-semibold">Review</h1>
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">Nothing waiting</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A site is built every hour. Come back when the queue has moved.
          </p>
          <Link href="/admin" className="mt-4 inline-block text-sm font-medium underline">
            Back to the pipeline
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cards.length} built · {mailable.length} have an email · {picked.size} selected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPicked(new Set(mailable.map((c) => c.id)))}
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setPicked(new Set())}
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={sending || picked.size === 0}
            onClick={() => void send()}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {sending ? "Sending…" : `Send ${picked.size}`}
          </button>
        </div>
      </div>

      {result && (
        <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{result}</p>
      )}
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const on = picked.has(card.id);
          const draft = card.draft as { subject?: string; hook?: string } | null;
          return (
            <div
              key={card.id}
              className={`overflow-hidden rounded-xl border bg-card transition ${
                on ? "border-foreground" : "border-border opacity-70"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(card.id)}
                className="relative block w-full overflow-hidden bg-muted"
                style={{ height: 260 }}
                aria-label={`${on ? "Deselect" : "Select"} ${card.name}`}
              >
                <iframe
                  src={`/api/leads/${card.id}/raw`}
                  title={card.name}
                  loading="lazy"
                  tabIndex={-1}
                  sandbox="allow-scripts"
                  style={{
                    width: FRAME_W,
                    height: FRAME_H,
                    border: 0,
                    transform: "scale(0.297)",
                    transformOrigin: "top left",
                    pointerEvents: "none",
                  }}
                />
                <span
                  className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${
                    on ? "border-foreground bg-foreground text-background" : "border-border bg-background"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
              </button>

              <div className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{card.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{card.host}</p>
                  </div>
                  <Link
                    href={`/admin/leads/${card.id}`}
                    className="shrink-0 rounded border border-border p-1.5 hover:bg-accent"
                    aria-label={`Open ${card.name}`}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Link>
                </div>

                {card.email ? (
                  <p className="truncate text-[11px] text-muted-foreground">{card.email}</p>
                ) : (
                  <p className="flex items-center gap-1 text-[11px] text-amber-600">
                    <MailX className="h-3 w-3" /> no email — cannot be sent
                  </p>
                )}

                {draft?.hook && (
                  <p className="line-clamp-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">Hook:</span> {draft.hook}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
