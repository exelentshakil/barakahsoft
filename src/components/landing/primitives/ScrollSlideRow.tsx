"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollProgress } from "@/components/landing/primitives/useScrollProgress";
import { cn } from "@/lib/utils";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Stripe-style "pin and slide": the track is taller than the viewport and
// pins via `sticky` while its own scroll progress (0->1, from
// useScrollProgress) drives a horizontal transform on the row inside --
// content genuinely slides as the page scrolls, not an autoplaying
// marquee (see Marquee.tsx for that). Falls back to a plain, always-usable
// horizontally-scrollable row (native touch/trackpad scroll, no pin) for
// prefers-reduced-motion, matching the same reduced-motion discipline as
// Reveal.tsx.
export function ScrollSlideRow({ children, itemClassName }: { children: React.ReactNode[]; itemClassName?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [maxTranslate, setMaxTranslate] = useState(0);
  const progress = useScrollProgress(trackRef);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    function measure() {
      if (!rowRef.current) return;
      setMaxTranslate(Math.max(0, rowRef.current.scrollWidth - window.innerWidth));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [children.length]);

  if (reduceMotion) {
    return (
      <div className="scrollbar-thin flex gap-6 overflow-x-auto px-6 pb-4">
        {children.map((child, i) => (
          <div key={i} className={cn("shrink-0", itemClassName)}>
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={trackRef} className="relative" style={{ height: "220vh" }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div ref={rowRef} className="flex gap-6 px-6 will-change-transform" style={{ transform: `translateX(-${progress * maxTranslate}px)` }}>
          {children.map((child, i) => (
            <div key={i} className={cn("shrink-0", itemClassName)}>
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
