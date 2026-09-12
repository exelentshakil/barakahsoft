"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink, Play, Eye, Check, Mail, MailX } from "lucide-react";
import { AddUrlDialog } from "@/components/admin/AddUrlDialog";

// Where every lead is, in one table.
//
// The machine builds one site an hour on its own, so this screen is mostly a
// window rather than a control panel. The only control it needs is "build this
// one now", for when you do not want to wait for the cron.

export interface PipelineRow {
  id: string;
  name: string;
  host: string;
  sourceUrl: string;
  email: string | null;
  status: string;
  built: boolean;
  sentAt: string | null;
  createdAt: string;
}

type Bucket = "queued" | "building" | "review" | "sent";

function bucketOf(row: PipelineRow): Bucket {
  if (row.sentAt || row.status === "delivered") return "sent";
  if (["scraping", "enriching", "rendering"].includes(row.status)) return "building";
  if (row.built) return "review";
  return "queued";
}

const BUCKET_LABEL: Record<Bucket, string> = {
  queued: "Waiting to build",
  building: "Building",
  review: "Ready to review",
  sent: "Sent",
};

export function Pipeline({ rows }: { rows: PipelineRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Bucket | "all">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<Bucket, number> = { queued: 0, building: 0, review: 0, sent: 0 };
    for (const row of rows) c[bucketOf(row)] += 1;
    return c;
  }, [rows]);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => bucketOf(r) === filter)),
    [rows, filter]
  );

  async function buildNow(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "That build did not start.");
      else {
        // Queued, not finished — the row moves to Building and the job carries
        // on whether or not this tab stays open.
        router.refresh();
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One site is built every hour. Add URLs and the queue drains on its own.
          </p>
        </div>
        <AddUrlDialog />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(BUCKET_LABEL) as Bucket[]).map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setFilter(filter === b ? "all" : b)}
            className={`rounded-xl border p-3 text-left transition ${
              filter === b ? "border-foreground bg-accent" : "border-border bg-card hover:bg-accent/50"
            }`}
          >
            <div className="text-2xl font-semibold tabular-nums">{counts[b]}</div>
            <div className="text-[11px] text-muted-foreground">{BUCKET_LABEL[b]}</div>
          </button>
        ))}
      </div>

      {counts.review > 0 && (
        <Link
          href="/admin/review"
          className="flex items-center justify-between rounded-xl border border-foreground bg-card px-4 py-3 text-sm font-medium hover:bg-accent"
        >
          <span>
            {counts.review} mockup{counts.review === 1 ? "" : "s"} waiting for you to look at
          </span>
          <span className="flex items-center gap-1.5">
            Review <Eye className="h-4 w-4" />
          </span>
        </Link>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Business</th>
              <th className="px-4 py-2.5 font-medium">Their site</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Nothing here. Add some URLs and the hourly build will pick them up.
                </td>
              </tr>
            )}
            {visible.map((row) => {
              const bucket = bucketOf(row);
              return (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-accent/40">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/leads/${row.id}`} className="font-medium hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <a
                      href={row.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      {row.host} <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-4 py-2.5">
                    {row.email ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" /> {row.email}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-600" title="Nothing to send to">
                        <MailX className="h-3.5 w-3.5" /> none found
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusPill bucket={bucket} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {bucket === "queued" && (
                      <button
                        type="button"
                        disabled={busy === row.id}
                        onClick={() => void buildNow(row.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
                      >
                        {busy === row.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" /> Queued…
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" /> Build now
                          </>
                        )}
                      </button>
                    )}
                    {bucket === "review" && (
                      <Link
                        href={`/admin/leads/${row.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-accent"
                      >
                        <Eye className="h-3 w-3" /> Open
                      </Link>
                    )}
                    {bucket === "sent" && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Check className="h-3 w-3" /> sent
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ bucket }: { bucket: Bucket }) {
  const style: Record<Bucket, string> = {
    queued: "border-border text-muted-foreground",
    building: "border-indigo-300 bg-indigo-50 text-indigo-700",
    review: "border-emerald-300 bg-emerald-50 text-emerald-700",
    sent: "border-border bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${style[bucket]}`}>
      {BUCKET_LABEL[bucket]}
    </span>
  );
}
