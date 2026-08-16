"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollProgress } from "@/components/landing/primitives/useScrollProgress";

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

// Stripe/Linear-style "card stack" scroll effect: cards sit stacked on top
// of each other in a pinned viewport, and as page scroll progress crosses
// each card's own segment of the track, it flips/slides away (rotateX +
// translateY + fade) to reveal the next one underneath -- distinct from
// ScrollSlideRow's horizontal translate, used here for a smaller, curated
// set of "hero" cards rather than a long real gallery. Falls back to a
// plain stacked-vertical list (no pin, no transforms) under
// prefers-reduced-motion.
export function StackFlipRow({ children }: { children: React.ReactNode[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(trackRef);
  const reduceMotion = usePrefersReducedMotion();
  const count = children.length;

  if (reduceMotion) {
    return <div className="mx-auto flex max-w-lg flex-col gap-6 px-6">{children}</div>;
  }

  return (
    <div ref={trackRef} className="relative" style={{ height: `${count * 70}vh` }}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-6">
        <div className="relative h-[70vh] w-full max-w-2xl">
          {children.map((child, i) => {
            const segment = 1 / count;
            const start = i * segment;
            const localProgress = Math.min(1, Math.max(0, (progress - start) / segment));
            // Active while its own segment is current; flips out (rotate +
            // rise + fade) once scroll passes it, sits inert below before its turn.
            const isPast = progress > start + segment * 0.85;
            const isFuture = progress < start - segment * 0.15;
            const rotate = isPast ? -8 : 0;
            const translateY = isPast ? -60 : isFuture ? 24 : 0;
            const opacity = isFuture ? 0 : isPast ? Math.max(0, 1 - (localProgress - 0.85) / 0.15) : 1;
            const scale = isFuture ? 0.94 : 1;

            return (
              <div
                key={i}
                className="absolute inset-0 will-change-transform"
                style={{
                  transform: `translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                  opacity,
                  zIndex: count - i,
                  transition: "opacity 0.05s linear",
                  pointerEvents: opacity < 0.5 ? "none" : "auto",
                }}
              >
                {child}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
