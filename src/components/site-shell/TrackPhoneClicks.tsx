"use client";

import { useEffect } from "react";

export function TrackPhoneClicks({ leadSlug }: { leadSlug: string }) {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="tel:"]') : null;
      if (!target) return;
      const body = JSON.stringify({ event: "phone_click", path: window.location.pathname });
      navigator.sendBeacon?.(`/api/s/${leadSlug}/events`, new Blob([body], { type: "application/json" }));
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [leadSlug]);
  return null;
}
