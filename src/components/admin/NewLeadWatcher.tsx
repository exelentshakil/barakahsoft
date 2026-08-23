"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Bell, Sparkles, Volume2, X } from "lucide-react";
import { subscribeAsOperator } from "@/lib/supabase/realtime";
import { playShopifyLeadChime } from "@/lib/sound/shopify-chime";

interface PopupLead {
  id: string;
  name: string;
  url?: string | null;
  time: string;
}

// Live leads listener with soothing Shopify-style order notification sound.
//
// When a new lead lands in the database:
// 1. Plays a warm, crisp, soothing chime (Shopify order sound style).
// 2. Pops up a floating notification toast with direct 1-click access.
// 3. Automatically refreshes the workspace view.
export function NewLeadWatcher({ isEmpty = false }: { isEmpty?: boolean }) {
  const router = useRouter();
  const [arrived, setArrived] = useState(0);
  const [latestPopup, setLatestPopup] = useState<PopupLead | null>(null);
  const arrivedRef = useRef(0);
  arrivedRef.current = arrived;

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    subscribeAsOperator((client) =>
      client
        .channel("admin-new-leads-global")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "leads" },
          (payload) => {
            const newRecord = (payload.new ?? {}) as {
              id?: string;
              business_name?: string | null;
              source_url?: string | null;
              contact_name?: string | null;
            };

            // Play the soothing Shopify notification sound
            playShopifyLeadChime();

            const leadName =
              newRecord.business_name ||
              newRecord.contact_name ||
              (newRecord.source_url ? new URL(newRecord.source_url.startsWith("http") ? newRecord.source_url : `https://${newRecord.source_url}`).hostname.replace(/^www\./, "") : "New Inbound Lead");

            if (newRecord.id) {
              setLatestPopup({
                id: newRecord.id,
                name: leadName,
                url: newRecord.source_url,
                time: "Just now",
              });
            }

            if (isEmpty) {
              router.refresh();
              return;
            }

            setArrived((n) => n + 1);
            router.refresh();
          }
        )
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

  // Auto-dismiss popup after 10 seconds
  useEffect(() => {
    if (!latestPopup) return;
    const timer = setTimeout(() => {
      setLatestPopup(null);
    }, 10000);
    return () => clearTimeout(timer);
  }, [latestPopup]);

  return (
    <>
      {/* Floating Realtime Pop-up Toast with Soothing Chime */}
      {latestPopup && (
        <aside
          aria-label="New lead notification"
          className="fixed bottom-6 right-6 z-50 flex max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300 items-start gap-3 rounded-2xl border border-[#533afd]/30 bg-white p-4 shadow-2xl ring-1 ring-black/5"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f3ff] text-[#533afd] shadow-inner">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> New Lead
              </span>
              <span className="text-[10px] text-muted-foreground">{latestPopup.time}</span>
            </div>

            <p className="truncate text-sm font-bold text-[#0d1738]">{latestPopup.name}</p>
            {latestPopup.url && (
              <p className="truncate text-xs text-muted-foreground">{latestPopup.url}</p>
            )}

            <div className="pt-2 flex items-center gap-2">
              <Link
                href={`/admin/leads/${latestPopup.id}`}
                onClick={() => setLatestPopup(null)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#533afd] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#432bd9] transition"
              >
                Open Studio <ArrowRight className="h-3 w-3" />
              </Link>
              <button
                type="button"
                onClick={() => playShopifyLeadChime()}
                title="Play chime sound"
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-slate-50 transition"
              >
                <Volume2 className="h-3 w-3 text-[#533afd]" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLatestPopup(null)}
            aria-label="Close notification"
            className="rounded-lg p-1 text-muted-foreground hover:bg-slate-100 hover:text-[#0d1738] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </aside>
      )}

      {/* Top Banner if multiple leads arrived */}
      {arrived > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setArrived(0)}
            className="flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-600 animate-bounce" />
              {arrived === 1 ? "1 new lead arrived" : `${arrived} new leads arrived`}
            </span>
            <span className="text-[11px] font-semibold underline">Dismiss banner</span>
          </button>
        </div>
      )}
    </>
  );
}
