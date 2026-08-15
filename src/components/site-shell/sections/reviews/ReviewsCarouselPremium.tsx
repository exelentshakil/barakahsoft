import { Star, Quote } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import { Carousel } from "@/components/site-shell/primitives/Carousel";

// Premium sibling of ReviewsCarousel -- same real review data
// (payload.reviews), a real drag/swipe Carousel (Phase J primitive) with
// arrow controls and dot pagination instead of a hand-rolled CSS
// scroll-snap row.
export function ReviewsCarouselPremium({ payload }: { payload: SitePayload }) {
  if (payload.reviews.length === 0) return null;
  return (
    <section id="reviews" className="border-t border-border py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <SectionEyebrow icon={Quote}>Real feedback</SectionEyebrow>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">What people say</h2>
        </div>
        <div className="mt-12">
          <Carousel>
            {payload.reviews.map((review, i) => (
              <div key={i} className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex gap-0.5">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-3 flex-1 text-sm text-muted-foreground">&ldquo;{review.text}&rdquo;</p>
                <p className="mt-4 text-sm font-medium">{review.author_name}</p>
              </div>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
