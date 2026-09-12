"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, MapPin, X, ExternalLink, AlertTriangle } from "lucide-react";

// The Google listing, and the one button that fixes it.
//
// A listing is not required. A page builds fine without one — it simply has no
// rating, no review quotes and no opening hours, and the generator is told not
// to invent any. That is the safe failure and it is already the behaviour.
//
// The dangerous failure is the WRONG listing, because then the client's
// homepage carries another company's rating, another company's address and five
// of someone else's customers saying nice things. The verifier refuses what it
// cannot match, but a plausible listing for a different branch passes every
// string test there is — which is why a person needs to be able to look at it
// and say no.

export interface ListingState {
  placeId: string | null;
  name: string | null;
  address: string | null;
  rating: number | null;
  reviewCount: number | null;
  reviewsPulled: number;
  pinned: boolean;
}

export function GoogleListing({ leadId, listing }: { leadId: string; listing: ListingState }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [placeId, setPlaceId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function attach() {
    const id = placeId.trim();
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/places`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place_id: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "Google would not accept that id.");
      else {
        setPlaceId("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function detach() {
    setBusy(true);
    setError(null);
    try {
      await fetch(`/api/leads/${leadId}/places`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-2 text-[11px] font-medium text-muted-foreground">Google listing — the page&apos;s proof</p>

      {listing.placeId ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{listing.name ?? "Listing attached"}</p>
              {listing.address && (
                <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" /> {listing.address}
                </p>
              )}
              <p className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                {listing.rating ? (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {listing.rating} · {listing.reviewCount ?? "?"} reviews
                  </span>
                ) : (
                  <span className="text-amber-600">no rating on this listing</span>
                )}
                <span>· {listing.reviewsPulled} quotes usable</span>
                {listing.pinned && <span className="text-emerald-600">· pinned by you</span>}
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void detach()}
              title="This is not their business"
              className="inline-flex shrink-0 items-center gap-1 rounded border border-border px-2 py-1 text-[11px] font-medium hover:bg-accent disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
              Not them
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Check the name and address match. If they do not, detach it — a wrong listing puts another
            company&apos;s reviews on your client&apos;s homepage.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
            <span>
              Nothing matched, so the page is built with <strong>no rating, no review quotes and no
              opening hours</strong> rather than someone else&apos;s. That is safe — it is just a
              weaker page. Paste their place ID to add the proof back.
            </span>
          </p>
          <div className="flex items-center gap-2">
            <input
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              placeholder="ChIJ…"
              className="w-full rounded-lg border border-border bg-background px-2.5 py-2 font-mono text-xs"
            />
            <button
              type="button"
              disabled={busy || !placeId.trim()}
              onClick={() => void attach()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              {busy && <Loader2 className="h-3 w-3 animate-spin" />} Attach
            </button>
          </div>
          <a
            href="https://developers.google.com/maps/documentation/places/web-service/place-id"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Find a place ID <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {error && <p className="mt-2 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
