"use client";

import { useEffect } from "react";

const CRISP_WEBSITE_ID = "28d857ed-70f3-4edf-bba4-e23a1e627d00";

declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

/** Deferred support chat for BarakahSoft-owned surfaces only - loads only on interaction or idle */
export function CrispChat() {
  useEffect(() => {
    let loaded = false;
    function loadCrisp() {
      if (loaded) return;
      loaded = true;
      window.$crisp = window.$crisp || [];
      window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;
      const s = document.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = true;
      document.head.appendChild(s);
    }

    const events = ["scroll", "mousemove", "touchstart", "click"];
    const trigger = () => {
      loadCrisp();
      events.forEach((e) => window.removeEventListener(e, trigger));
    };

    events.forEach((e) => window.addEventListener(e, trigger, { passive: true, once: true }));

    const timer = setTimeout(loadCrisp, 6000);
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, trigger));
    };
  }, []);

  return null;
}
