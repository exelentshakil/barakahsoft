"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, ExternalLink, Send, ArrowLeft, Search } from "lucide-react";
import { ManualPhotoUpload } from "@/components/admin/ManualPhotoUpload";
import { SlotPanel } from "@/components/admin/SlotPanel";

// One lead, read top to bottom.
//
// Mockup first, because that is the thing being judged. Then what it was built
// from, then the photographs it was built with, then the email that goes out.
// Every control on this page acts on this one lead; there is nothing global and
// nothing hidden behind a tab.

interface BriefSummary {
  businessName: string;
  city: string;
  industry: string;
  phone: string | null;
  services: string[];
  areas: string[];
  rating: number | null;
  reviewCount: number | null;
  photos: number;
}

export function LeadDetail({
  lead,
  hasPage,
  rationale,
  analysed,
  brief,
  costUsd,
}: {
  lead: {
    id: string;
    name: string | null;
    sourceUrl: string;
    email: string | null;
    industry: string | null;
    status: string;
    draft: Record<string, unknown> | null;
  };
  hasPage: boolean;
  rationale: string | null;
  analysed: boolean;
  brief: BriefSummary | null | undefined;
  costUsd: number | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "analyse" | "build" | "send">(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function post(path: string, body: unknown, kind: "analyse" | "build" | "send") {
    setBusy(kind);
    setError(null);
    setNote(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "That did not work.");
        return;
      }
      if (typeof data.bytes === "number") {
        // The numbers that tell you whether the page is thin before you look.
        // A stylesheet under about 25KB is the shape of a generated-looking
        // page, whatever the screenshot says.
        setNote(
          `${Math.round(data.bytes / 1024)}KB · ${Math.round((data.cssBytes ?? 0) / 1024)}KB css · ` +
            `${data.sections} sections · ${data.photosUsed}/${data.photosSupplied} photos`
        );
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  const draft = lead.draft as { subject?: string; body?: string; hook?: string } | null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Pipeline
          </Link>
          <h1 className="font-display text-2xl font-semibold">{lead.name || lead.sourceUrl}</h1>
          <a
            href={lead.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            their site today <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!analysed && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void post(`/api/leads/${lead.id}/analyse`, {}, "analyse")}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              {busy === "analyse" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Analyse first
            </button>
          )}
          <button
            type="button"
            disabled={busy !== null || !analysed}
            onClick={() => void post(`/api/leads/${lead.id}/generate`, {}, "build")}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-40"
          >
            {busy === "build" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {busy === "build" ? "Building — 60 to 180 seconds…" : hasPage ? "Rebuild" : "Build the page"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}
      {note && (
        <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{note}</p>
      )}

      {hasPage ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <p className="text-xs font-semibold">The mockup</p>
            <a
              href={`/api/leads/${lead.id}/raw`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              open full size <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <iframe
            src={`/api/leads/${lead.id}/raw`}
            title={lead.name ?? "Mockup"}
            sandbox="allow-scripts allow-popups"
            style={{ display: "block", width: "100%", height: "80vh", border: 0 }}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {analysed
            ? "Not built yet. The hourly build will pick this up, or press Build the page."
            : "Not analysed yet. Analyse first — the page is built from what the scrape finds."}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What it was built from
          </h2>
          {brief ? (
            <dl className="space-y-2 text-sm">
              <Row label="Business">{brief.businessName}</Row>
              <Row label="Trade">{brief.industry}</Row>
              <Row label="Town">{brief.city}</Row>
              <Row label="Phone">{brief.phone ?? <Missing>none found</Missing>}</Row>
              <Row label="Proof">
                {brief.rating ? `${brief.rating} from ${brief.reviewCount ?? "?"} reviews` : <Missing>no rating</Missing>}
              </Row>
              <Row label="Photos">
                {brief.photos > 0 ? `${brief.photos} usable` : <Missing>none — the page has no imagery</Missing>}
              </Row>
              <Row label={`Services (${brief.services.length})`}>
                {brief.services.length ? brief.services.join(" · ") : <Missing>none found</Missing>}
              </Row>
              <Row label={`Areas (${brief.areas.length})`}>
                {brief.areas.length ? brief.areas.join(" · ") : <Missing>none found</Missing>}
              </Row>
              {costUsd != null && <Row label="Model cost">${costUsd.toFixed(2)}</Row>}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing scraped yet.</p>
          )}
          {rationale && (
            <details className="mt-3 border-t border-border pt-3">
              <summary className="cursor-pointer text-xs font-medium">The plan the model wrote</summary>
              <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">{rationale}</pre>
            </details>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            The email that goes out
          </h2>
          {draft?.subject ? (
            <div className="space-y-2 text-sm">
              <Row label="To">{lead.email ?? <Missing>no address — this one cannot be sent</Missing>}</Row>
              <Row label="Subject">{draft.subject}</Row>
              {draft.hook && <Row label="Hook">{draft.hook}</Row>}
              <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-muted p-3 text-[12px] leading-relaxed">{draft.body}</pre>
              <Link
                href="/admin/review"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                <Send className="h-3 w-3" /> Send from the review queue
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No draft yet — one is written when the page is built.
            </p>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Photographs</h2>
        <ManualPhotoUpload leadId={lead.id} />
        {hasPage && <SlotPanel leadId={lead.id} />}
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{children}</dd>
    </div>
  );
}

function Missing({ children }: { children: React.ReactNode }) {
  return <span className="text-amber-600">{children}</span>;
}
