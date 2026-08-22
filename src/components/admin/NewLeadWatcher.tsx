"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { subscribeAsOperator } from "@/lib/supabase/realtime";

// Live leads list.
//
// The per-lead workspace already followed the pipeline live, but the list
// itself did not — so a lead submitted from the landing page sat invisible
// until someone thought to reload. For a workflow whose first step is a
// person deciding whether a lead is real, the list is exactly where "new
// thing arrived" needs to be obvious.
//
// A banner rather than a silent refresh: replacing the page under someone
// mid-click is worse than telling them there is something new and letting
// them take it.
export function NewLeadWatcher() {
  const router = useRouter();
  const [arrived, setArrived] = useState(0);
  const arrivedRef = useRef(0);
  arrivedRef.current = arrived;

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    // Authenticated before subscribing: the socket must carry the operator's
    // token or the RLS policies reject it and nothing is ever delivered.
    subscribeAsOperator((client) =>
      client
        .channel("admin-new-leads")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, () => {
          setArrived((n) => n + 1);
        })
        // A status change is the pipeline reporting progress on a lead already
        // in the list, so it refreshes quietly rather than raising a banner.
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, () => {
          if (arrivedRef.current === 0) router.refresh();
        })
    ).then((result) => {
      if (!result) return;
      if (cancelled) {
        result.client.removeChannel(result.channel);
        return;
      }
      cleanup = () => result.client.removeChannel(result.channel);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [router]);

  if (arrived === 0) return null;

  return (
    <button
      type="button"
      onClick={() => {
        setArrived(0);
        router.refresh();
      }}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#533afd]/30 bg-[#f0f3ff] px-4 py-2.5 text-xs font-bold text-[#533afd] transition hover:bg-[#e6ebff]"
    >
      <Bell className="h-3.5 w-3.5" />
      {arrived === 1 ? "1 new lead just landed" : `${arrived} new leads just landed`} — click to show
    </button>
  );
}
