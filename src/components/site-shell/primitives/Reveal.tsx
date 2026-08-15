"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

type RevealVariant = "fade-up" | "fade-in" | "scale-in";

const VARIANTS: Record<RevealVariant, Variants> = {
  "fade-up": { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } },
  "fade-in": { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  "scale-in": { hidden: { opacity: 0, scale: 0.94 }, visible: { opacity: 1, scale: 1 } },
};

// Scroll-triggered entrance animation, used once per section/card instead
// of everything just appearing instantly -- respects prefers-reduced-motion
// (via useReducedMotion, falls back to a plain fade with no movement).
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
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={reduceMotion ? VARIANTS["fade-in"] : VARIANTS[variant]}
      transition={{ duration: reduceMotion ? 0.2 : 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Staggers its direct motion children in on scroll -- wrap a grid/list's
// items each in a plain motion.div (variants inherited from this parent)
// for services-grid/process-steps/badge-row style reveals.
export function RevealGroup({ children, className, stagger = 0.08 }: { children: React.ReactNode; className?: string; stagger?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ staggerChildren: reduceMotion ? 0 : stagger }}
    >
      {children}
    </motion.div>
  );
}

// One item inside a RevealGroup -- inherits hidden/visible from the parent's
// whileInView state rather than triggering its own viewport observer.
export function RevealItem({ children, variant = "fade-up", className }: { children: React.ReactNode; variant?: RevealVariant; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div className={className} variants={reduceMotion ? VARIANTS["fade-in"] : VARIANTS[variant]} transition={{ duration: reduceMotion ? 0.2 : 0.5, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}
