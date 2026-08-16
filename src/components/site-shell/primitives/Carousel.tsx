"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Real drag/swipe carousel (replaces the earlier hand-rolled CSS
// scroll-snap row) -- prev/next arrows, dot pagination, works with mouse
// drag and touch out of the box via embla. No autoplay plugin; a plain
// setInterval calling emblaApi.scrollNext() is enough if that's ever wanted.
export function Carousel({ children, className }: { children: React.ReactNode[]; className?: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className={cn("relative", className)}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex items-stretch gap-6">
          {children.map((child, i) => (
            <div key={i} className="flex min-w-0 flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_31%]">
              {child}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={scrollPrev}
          aria-label="Previous"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-card transition-shadow hover:shadow-lift"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5">
          {children.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn("h-1.5 rounded-full transition-all", i === selectedIndex ? "w-6 bg-primary" : "w-1.5 bg-border")}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Next"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-card transition-shadow hover:shadow-lift"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
