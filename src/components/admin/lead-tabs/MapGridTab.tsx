import { MapPin } from "lucide-react";
import type { CompetitorCandidate } from "@/lib/google/places";

// A lightweight Maps Embed iframe (no @react-google-maps or similar heavy
// client-side mapping library needed) plus a grid of competitor pins as
// plain Google Maps search links — the operator's "here's the competitive
// landscape" view, not an interactive map product in its own right.
export function MapGridTab({
  address,
  competitors,
}: {
  address: string | null;
  competitors: CompetitorCandidate[];
}) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  // Business name alone is too generic to geolocate reliably (a short or
  // common name can match an unrelated place worldwide) — only map once
  // the scrape has produced a real address.
  const mapQuery = address;

  return (
    <div className="space-y-6">
      {apiKey && mapQuery ? (
        <iframe
          className="h-80 w-full rounded-lg border border-border"
          loading="lazy"
          src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(mapQuery)}`}
        />
      ) : (
        <p className="text-sm text-muted-foreground">No address available to map yet.</p>
      )}

      <div>
        <p className="mb-3 text-sm font-medium">Nearby competitors</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {competitors.map((c) => (
            <a
              key={c.place_id}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name)}&query_place_id=${c.place_id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm hover:bg-accent"
            >
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              {c.name}
            </a>
          ))}
          {competitors.length === 0 && <p className="text-sm text-muted-foreground">None found nearby.</p>}
        </div>
      </div>
    </div>
  );
}
