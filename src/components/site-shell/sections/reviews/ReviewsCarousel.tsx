import { Star } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

// Horizontal scroll-snap row instead of a grid — pure CSS, no client JS
// needed, and reads more "premium editorial" for a shorter real review list.
export function ReviewsCarousel({ payload }: { payload: SitePayload }) {
  if (payload.reviews.length === 0) return null;
  return (
    <section id="reviews" className="border-t border-border py-16">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight">What people say</h2>
        <div className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
          {payload.reviews.map((review, i) => (
            <div key={i} className="w-[280px] shrink-0 snap-start rounded-xl border border-border bg-card p-5 shadow-card">
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
