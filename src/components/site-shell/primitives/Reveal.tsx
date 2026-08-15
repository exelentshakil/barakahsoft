"use client";

import { useEffect, useRef, useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

type RevealVariant = "fade-up" | "fade-in" | "scale-in";

const HIDDEN_CLASSES: Record<RevealVariant, string> = {
  "fade-up": "opacity-0 translate-y-6",
  "fade-in": "opacity-0",
  "scale-in": "opacity-0 scale-95",
};
const VISIBLE_CLASSES = "opacity-100 translate-y-0 scale-100";

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

function useInViewOnce(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

// Scroll-triggered entrance animation, used once per section/card instead
// of everything just appearing instantly. Plain CSS transition + a native
// IntersectionObserver -- not framer-motion's animate/whileInView engine,
// which was observed getting stuck mid-transition (opacity frozen at a
// fraction, never resolving) for above-the-fold content in the installed
// version. Same real scroll-reveal effect, no dependency on whatever is
// broken there. Respects prefers-reduced-motion (renders fully visible,
// no transition, immediately).
export function Reveal({
  children,
  variant = "fade-up",
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInViewOnce(ref);
  const reduceMotion = usePrefersReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={cn("transition-all duration-500 ease-out", inView ? VISIBLE_CLASSES : HIDDEN_CLASSES[variant], className)}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

const StaggerContext = createContext(0.08);

// Staggers its direct RevealItem children in on scroll -- pass each item's
// list index to RevealItem (e.g. `.map((x, i) => <RevealItem index={i}>)`)
// to get an increasing delay; the group's own inView state is shared via
// a data attribute + MutationObserver rather than each item running its
// own separate IntersectionObserver.
export function RevealGroup({ children, className, stagger = 0.08 }: { children: React.ReactNode; className?: string; stagger?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInViewOnce(ref);
  const reduceMotion = usePrefersReducedMotion();
  return (
    <div ref={ref} className={className} data-in-view={inView || reduceMotion ? "true" : "false"}>
      <StaggerContext.Provider value={reduceMotion ? 0 : stagger}>{children}</StaggerContext.Provider>
    </div>
  );
}

// One item inside a RevealGroup -- reads whether the group is in view from
// the DOM (data-in-view, set by the parent) via a MutationObserver, and
// applies `index * stagger` as its own transition delay.
export function RevealItem({
  children,
  variant = "fade-up",
  className,
  index = 0,
}: {
  children: React.ReactNode;
  variant?: RevealVariant;
  className?: string;
  index?: number;
}) {
  const stagger = useContext(StaggerContext);
  const itemRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const groupEl = itemRef.current?.closest("[data-in-view]");
    if (!groupEl) return;
    const check = () => setInView(groupEl.getAttribute("data-in-view") === "true");
    check();
    const observer = new MutationObserver(check);
    observer.observe(groupEl, { attributes: true, attributeFilter: ["data-in-view"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={itemRef}
      className={cn("transition-all duration-500 ease-out", inView ? VISIBLE_CLASSES : HIDDEN_CLASSES[variant], className)}
      style={{ transitionDelay: inView ? `${index * stagger}s` : "0s" }}
    >
      {children}
    </div>
  );
}
