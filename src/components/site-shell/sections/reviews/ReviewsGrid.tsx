import { Star } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

// Default reviews variant — extracted verbatim from the original monolith.
export function ReviewsGrid({ payload }: { payload: SitePayload }) {
  if (payload.reviews.length === 0) return null;
  return (
    <section id="reviews" className="border-t border-border py-16">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight">What people say</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {payload.reviews.map((review, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex gap-0.5">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">&ldquo;{review.text}&rdquo;</p>
              <p className="mt-3 text-sm font-medium">{review.author_name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
