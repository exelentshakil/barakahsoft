"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Makes the waiting page's own promise true.
//
// It told the client "this page updates as your build progresses" and then
// never re-rendered, so someone who left it open through the whole build
// watched nothing happen. A build takes minutes, not seconds, so this
// checks every half minute rather than hammering it.
export function PendingAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(timer);
  }, [router]);

  return null;
}
