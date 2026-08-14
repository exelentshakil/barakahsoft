// Client-side Pixel wrapper — safe to import from "use client" components.
// Server-side CAPI (uses node:crypto) lives in meta-pixel-server.ts so this
// file never pulls a Node-only module into the browser bundle.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackPixelEvent(eventName: string, eventId: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", eventName, params ?? {}, { eventID: eventId });
}
