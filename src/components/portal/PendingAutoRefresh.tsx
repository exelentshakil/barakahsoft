"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Makes the waiting page's own promise true.
//
// Automatically refreshes the portal view while in pending/processing mode so
// the moment the operator approves or delivers the site, the client's screen
// instantly unblurs and unlocks the full proposal, audit report, and pricing.
export function PendingAutoRefresh({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) {
        router.refresh();
      }
    };

    const timer = setInterval(refresh, intervalMs);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        router.refresh();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router, intervalMs]);

  return null;
}
