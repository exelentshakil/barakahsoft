import { Star } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

// Real stats as separate tiles instead of one inline bar — reads heavier/
// more "agency" when a lead has both a real rating and real review count.
export function ProofStatGrid({ payload }: { payload: SitePayload }) {
  const tiles: { label: string; value: string }[] = [];
  if (payload.proof.rating) tiles.push({ label: "Average rating", value: `${payload.proof.rating}★` });
  if (payload.proof.reviewCount) tiles.push({ label: "Real reviews", value: String(payload.proof.reviewCount) });

  return (
    <section id="proof" className="border-t border-border py-14">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-[auto_1fr] sm:items-center">
        {tiles.length > 0 && (
          <div className="flex gap-4">
            {tiles.map((tile) => (
              <div key={tile.label} className="rounded-lg border border-border bg-card px-5 py-3 text-center shadow-card">
                <p className="text-xl font-bold">{tile.value}</p>
                <p className="text-xs text-muted-foreground">{tile.label}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">{payload.differentiator}</p>
          {payload.proof.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={payload.proof.imageUrl} alt="Real work" className="hidden h-24 w-36 shrink-0 rounded-lg object-cover shadow-card sm:block" />
          )}
        </div>
      </div>
    </section>
  );
}
