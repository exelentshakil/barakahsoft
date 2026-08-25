"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A drag-to-reveal comparison between two images of the same page.
//
// The "after" image is the base layer and the "before" is clipped over it,
// so the finished redesign is what renders if anything about the interaction
// fails — a broken slider that shows the old site would be actively harmful
// on a page whose whole job is selling the new one.
//
// Pointer events (not mouse/touch pairs) because a single set of handlers
// covers mouse, touch and pen, and setPointerCapture keeps the drag alive
// when the cursor leaves the element mid-gesture — the usual reason these
// sliders feel like they "stick" halfway.

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  /** Aspect ratio of the frame, e.g. "16 / 10". */
  ratio?: string;
  className?: string;
  /** Alt text prefix, so screen readers get the business name. */
  subject?: string;
}

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "Before",
  afterLabel = "After",
  ratio = "16 / 10",
  className = "",
  subject = "website",
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const setFromClientX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratioX = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, ratioX)));
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setFromClientX(event.clientX);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setFromClientX(event.clientX);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  // While dragging horizontally on a phone the page must not also scroll.
  useEffect(() => {
    if (!dragging) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => document.removeEventListener("touchmove", prevent);
  }, [dragging]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 2;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPosition((p) => Math.max(0, p - step));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setPosition((p) => Math.min(100, p + step));
    } else if (event.key === "Home") {
      event.preventDefault();
      setPosition(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setPosition(100);
    }
  };

  return (
    <div
      ref={frameRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`group relative select-none overflow-hidden rounded-xl bg-slate-900 ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      } ${className}`}
      style={{ aspectRatio: ratio, touchAction: "pan-y" }}
    >
      {/* After — the base layer, so it survives any failure above it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterUrl}
        alt={`${subject} after the redesign`}
        draggable={false}
        loading="lazy"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top"
      />

      {/* Before — clipped to the left of the handle. */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt={`${subject} before the redesign`}
          draggable={false}
          loading="lazy"
          className="h-full w-full object-cover object-top"
        />
      </div>

      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-[#0c68c8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
        {afterLabel}
      </span>

      {/* Divider */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.45)]"
        style={{ left: `${position}%` }}
      />

      {/* Handle — the actual focusable control. */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={`Reveal how much of the ${subject} redesign is shown`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}% of the new design visible`}
        onKeyDown={onKeyDown}
        className="absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-white/95 shadow-lg outline-none ring-[#0c68c8] transition focus-visible:ring-4"
        style={{ left: `${position}%` }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#07284d]" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6 4 12l5 6" />
          <path d="m15 6 5 6-5 6" />
        </svg>
      </div>
    </div>
  );
}
