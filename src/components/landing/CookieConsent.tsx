"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "barakahsoft-cookie-consent";

// Gates the Meta Pixel behind an explicit accept — PRD §7's "cookie consent
// for UK/EU traffic" requirement. Decline still lets the intake form work;
// it just means the client-side Pixel event never fires (server-side CAPI
// in /api/intake fires either way, since it's first-party and not gated
// the same way as a third-party tracking cookie).
export function CookieConsent() {
  const [choice, setChoice] = useState<"accepted" | "declined" | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted" || stored === "declined") setChoice(stored);
    setHydrated(true);
  }, []);

  function choose(value: "accepted" | "declined") {
    localStorage.setItem(STORAGE_KEY, value);
    setChoice(value);
  }

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {choice === "accepted" && pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      )}
      {hydrated && choice === null && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-3 border-t border-border bg-card/95 p-4 backdrop-blur sm:flex-row sm:justify-between sm:px-6">
          <p className="text-sm text-muted-foreground">
            We use cookies to measure ad performance. No personal data is sold.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => choose("declined")}>
              Decline
            </Button>
            <Button size="sm" onClick={() => choose("accepted")}>
              Accept
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
