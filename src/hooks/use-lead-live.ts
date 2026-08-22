"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Keeps the lead workspace in step with the pipeline without anyone
// reloading.
//
// Scraping and generation run in background jobs that take minutes, and the
// operator had no way to know they had finished except to refresh and look.
// Refreshing mid-build was worse still: the page came back with no sign that
// work was still running, which read as the build having been lost.
//
// Driven by Postgres changes rather than polling, because the rows the
// operator is watching are exactly the rows the jobs write.
export function useLeadLive(leadId: string, onChange?: () => void) {
  const router = useRouter();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const supabase = createClient();

    // Coalesce bursts: one generation step can touch build_jobs and
    // artifacts within the same second, and refreshing per event would make
    // the page thrash for the whole length of a build.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        router.refresh();
        onChangeRef.current?.();
      }, 600);
    };

    const channel = supabase
      .channel(`lead-live-${leadId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "leads", filter: `id=eq.${leadId}` }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "artifacts", filter: `lead_id=eq.${leadId}` }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "scrape_results", filter: `lead_id=eq.${leadId}` }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "build_jobs", filter: `lead_id=eq.${leadId}` }, schedule)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [leadId, router]);
}
