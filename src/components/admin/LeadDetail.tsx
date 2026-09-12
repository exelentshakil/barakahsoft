"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, ExternalLink, Send, ArrowLeft, Search } from "lucide-react";
import { ManualPhotoUpload } from "@/components/admin/ManualPhotoUpload";
import { SlotPanel } from "@/components/admin/SlotPanel";
import { BriefPanel, type BriefFields } from "@/components/admin/BriefPanel";
import { GoogleListing, type ListingState } from "@/components/admin/GoogleListing";

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
  briefFields,
  listing,
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
  briefFields: BriefFields;
  listing: ListingState;
  hasPage: boolean;
  rationale: string | null;
  analysed: boolean;
  brief: BriefSummary | null | undefined;
  costUsd: number | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "analyse" | "build" | "send">(null);
  const [error, setError] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [stats, setStats] = useState<Record<string, number | boolean | string> | null>(null);

  // The build runs as a job now, so this screen reads its progress rather than
  // holding it. That is the whole point: closing the tab or opening another
  // lead no longer abandons three minutes of paid work.
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${lead.id}/generate`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setStats(data.stats ?? null);
      setBuilding((wasBuilding) => {
        // A build that has just finished is a build whose page is now on screen
        // only after a re-render.
        if (wasBuilding && !data.building) router.refresh();
        return Boolean(data.building);
      });
    } catch {
      // A missed poll is not worth a banner; the next one is two seconds away.
    }
  }, [lead.id, router]);

  useEffect(() => {
    void poll();
    const id = setInterval(poll, building ? 4000 : 20000);
    return () => clearInterval(id);
  }, [poll, building]);

  async function post(path: string, body: unknown, kind: "analyse" | "build" | "send") {
    setBusy(kind);
    setError(null);
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
      if (data.started) setBuilding(true);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  const draft = lead.draft as { subject?: string; body?: string; hook?: string } | null;
  const cssKb = stats ? Math.round(Number(stats.cssBytes ?? 0) / 1024) : 0;
  const thin = Boolean(stats) && cssKb < 25;

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
            disabled={busy !== null || building || !analysed}
            onClick={() => void post(`/api/leads/${lead.id}/generate`, {}, "build")}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-40"
          >
            {busy === "build" || building ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {building ? "Building…" : hasPage ? "Rebuild" : "Build the page"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}
      {building && (
        <p className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
          Building — three to four minutes. This runs on the server, so you can close this tab, open
          another lead, or refresh. It will be here when it finishes.
        </p>
      )}

      {stats && !building && (
        <p
          className={`rounded-lg border px-3 py-2 text-xs ${
            thin
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-emerald-300 bg-emerald-50 text-emerald-800"
          }`}
        >
          {Math.round(Number(stats.bytes ?? 0) / 1024)}KB · <strong>{cssKb}KB css</strong> ·{" "}
          {String(stats.sections ?? 0)} sections · {String(stats.photosUsed ?? 0)}/
          {String(stats.photosSupplied ?? 0)} photos
          {stats.continued ? " · continued" : ""}
          {thin && " — the stylesheet is thin, so the page will read as generated. Rebuild."}
        </p>
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

      <BriefPanel leadId={lead.id} initial={briefFields} listing={listing} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What the last build used
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
