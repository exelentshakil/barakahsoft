"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

/**
 * Deferred support chat — loads only on interaction or idle.
 *
 * The website id is a prop rather than a constant: it identifies an inbox, and
 * the platform's inbox must never open on a partner's domain. A tenant with no
 * chat configured renders nothing at all.
 */
export function CrispChat({ websiteId }: { websiteId?: string }) {
  if (!websiteId) return null;
  return <CrispLoader websiteId={websiteId} />;
}

function CrispLoader({ websiteId }: { websiteId: string }) {
  useEffect(() => {
    let loaded = false;
    function loadCrisp() {
      if (loaded) return;
      loaded = true;
      window.$crisp = window.$crisp || [];
      window.CRISP_WEBSITE_ID = websiteId;
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
