import { Star } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

// Default proof variant — extracted verbatim from the original monolith.
export function ProofBar({ payload }: { payload: SitePayload }) {
  return (
    <section id="proof" className="border-t border-border py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-4">
          {payload.proof.rating && (
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-3 shadow-card">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold">{payload.proof.rating}</span>
              <span className="text-sm text-muted-foreground">({payload.proof.reviewCount ?? 0} reviews)</span>
            </div>
          )}
          <p className="max-w-sm text-sm text-muted-foreground">{payload.differentiator}</p>
        </div>
        {payload.proof.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={payload.proof.imageUrl} alt="Real work" className="h-32 w-48 rounded-lg object-cover shadow-card" />
        )}
      </div>
    </section>
  );
}
