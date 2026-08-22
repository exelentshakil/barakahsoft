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
// Behaviour depends on whether the operator is in the middle of something.
//
// On an empty workspace there is nothing to interrupt, so the lead is loaded
// straight in — a banner asking permission to show the only thing on screen
// is pure friction. With leads already on screen the operator may be
// mid-task, so the list refreshes to include the new one and a small marker
// says how many arrived, rather than the page changing under their hands.
export function NewLeadWatcher({ isEmpty = false }: { isEmpty?: boolean }) {
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
          // Nothing on screen to interrupt: show it immediately.
          if (isEmpty) {
            router.refresh();
            return;
          }
          setArrived((n) => n + 1);
          // Bring it into the list straight away. The marker below reports
          // that it happened rather than gating it behind a click.
          router.refresh();
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
  }, [router, isEmpty]);

  if (arrived === 0) return null;

  return (
    <button
      type="button"
      onClick={() => setArrived(0)}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
    >
      <Bell className="h-3.5 w-3.5" />
      {arrived === 1 ? "1 new lead added to the list" : `${arrived} new leads added to the list`}
    </button>
  );
}
